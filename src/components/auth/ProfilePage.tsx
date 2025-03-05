import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Profile {
  username?: string;
  avatar_url?: string;
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(password);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-red-600">Delete Account</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          ⚠️ This action will permanently delete:
          <ul className="list-disc ml-6 mt-2">
            <li>Your account</li>
            <li>All your diary entries</li>
            <li>Your profile information</li>
            <li>Your avatar</li>
          </ul>
        </p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Please enter your password to confirm deletion:
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      setLoading(true);

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (checkError) {
        // If profile doesn't exist, create it
        if (checkError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert([{ 
              id: user.id,
              username: user.email?.split('@')[0] || '',
              updated_at: new Date().toISOString()
            }], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select('username, avatar_url')
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            toast.error('Failed to create profile: ' + createError.message);
            return;
          }

          if (newProfile) {
            setUsername(newProfile.username || '');
            setAvatarUrl(newProfile.avatar_url || '');
            toast.success('Profile created successfully');
          }
        } else {
          console.error('Error checking profile:', checkError);
          toast.error('Failed to load profile: ' + checkError.message);
        }
      } else if (existingProfile) {
        setUsername(existingProfile.username || '');
        setAvatarUrl(existingProfile.avatar_url || '');
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast.error('Failed to load profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!user) throw new Error('No user');

      const updates: Profile = {
        username: username,
        avatar_url: avatarUrl,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setNewPassword('');
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Error updating password');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        toast.error('Incorrect password. Please try again.');
        return;
      }

      // Sign out first to clear any existing sessions
      await supabase.auth.signOut();

      // Delete user's data in this order:
      // 1. Delete avatar from storage if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/');
        await supabase.storage
          .from('avatars')
          .remove([oldPath]);
      }

      // 2. Delete user's diary entries
      const { error: entriesError } = await supabase
        .from('diary_entries')
        .delete()
        .eq('user_id', user.id);

      if (entriesError) {
        console.error('Error deleting diary entries:', entriesError);
      }

      // 3. Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // 4. Delete the user's auth account using session
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) {
        throw new Error('Failed to delete account: ' + deleteError.message);
      }

      setIsDeleteModalOpen(false);
      
      toast.success('Your account has been permanently deleted', {
        duration: 5000,
        icon: '👋',
        style: {
          background: '#DC2626',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error in handleDeleteAccount:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account. Please try again later.', {
        duration: 5000,
        icon: '❌',
        style: {
          background: '#DC2626',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${user?.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete existing avatar if it exists
      if (avatarUrl) {
        try {
          const oldPath = avatarUrl.split('/').slice(-2).join('/'); // Get last two segments
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // Set to false to avoid conflicts
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Failed to update profile');
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    const isConfirmed = window.confirm(
      '🖼️ Delete Avatar\n\n' +
      'Are you sure you want to remove your profile picture?\n' +
      'You can always upload a new one later.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Removing avatar...', { 
        duration: 2000,
        style: {
          background: '#1E40AF',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });

      if (!avatarUrl) {
        throw new Error('No avatar to delete');
      }

      // Delete from storage
      const oldPath = avatarUrl.split('/').slice(-2).join('/');
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([oldPath]);

      if (deleteError) {
        console.error('Error deleting avatar file:', deleteError);
        throw new Error('Failed to delete avatar file');
      }

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile');
      }

      setAvatarUrl('');
      toast.success('Avatar removed successfully', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#D97706', // Orange for warning
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
    } catch (error) {
      console.error('Error in handleDeleteAvatar:', error);
      toast.error('Failed to remove avatar. Please try again.', {
        icon: '❌',
        duration: 3000,
        style: {
          background: '#DC2626',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-diary-beige-900">
          Profile Settings
        </h1>
        <Button
          onClick={() => signOut()}
          variant="outline"
          className="border-diary-beige-300 text-diary-beige-700 hover:bg-diary-beige-50"
        >
          Sign Out
        </Button>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-diary-beige-900">Avatar</h2>
          <div className="flex items-center space-x-4">
            {avatarUrl ? (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://via.placeholder.com/80?text=Avatar';
                  }}
                />
                <button
                  onClick={handleDeleteAvatar}
                  disabled={loading}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 
                           hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
                           focus:ring-red-500"
                  title="Delete avatar"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-diary-beige-100 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading || loading}
                className="block w-full text-sm text-diary-beige-900
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-diary-beige-50 file:text-diary-beige-700
                       hover:file:bg-diary-beige-100
                       disabled:opacity-50"
              />
              {uploading && (
                <span className="text-sm text-diary-beige-600 mt-2 block">
                  Uploading...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h2 className="text-lg font-medium text-diary-beige-900">Profile Information</h2>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-diary-beige-900"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500"
            />
          </div>
          <Button type="submit" isLoading={loading}>
            Update Profile
          </Button>
        </form>

        {/* Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <h2 className="text-lg font-medium text-diary-beige-900">Change Password</h2>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-diary-beige-900"
            >
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500"
              minLength={6}
            />
          </div>
          <Button type="submit" isLoading={loading}>
            Update Password
          </Button>
        </form>

        {/* Delete Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={loading}
      />
    </div>
  );
}; 