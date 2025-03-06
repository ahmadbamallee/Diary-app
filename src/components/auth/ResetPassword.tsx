import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { toast } from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    // Check if this is an invitation flow
    const checkInviteStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.aud === 'authenticated' && !session?.user?.email_confirmed_at) {
        setIsInvite(true);
      }
    };
    checkInviteStatus();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // First verify that we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session has expired. Please request a new link.');
        setTimeout(() => {
          window.location.href = '/#reset-password';
        }, 2000);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(
        isInvite 
          ? 'Password set successfully! You can now sign in with your new password.'
          : 'Password updated successfully! You can now sign in with your new password.',
        {
          duration: 5000,
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          }
        }
      );

      // Sign out to clear the recovery/invite session
      await supabase.auth.signOut();

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/#signin';
      }, 2000);

    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-serif font-bold text-diary-beige-900 mb-6 text-center">
        {isInvite ? 'Welcome to Diary' : 'Reset Your Password'}
      </h1>

      <form onSubmit={handlePasswordReset} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="text-sm text-diary-beige-600 mb-4">
          {isInvite ? 'Please set your password to complete your account setup.' : 'Enter your new password below.'}
          <ul className="list-disc ml-5 mt-1">
            <li>Must be at least 6 characters long</li>
            <li>Must contain at least one uppercase letter</li>
            <li>Must contain at least one lowercase letter</li>
            <li>Must contain at least one number</li>
            <li>Must contain at least one special character (!@#$%^&*)</li>
          </ul>
        </div>

        <div className="relative">
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-diary-beige-900"
          >
            {isInvite ? 'Password' : 'New Password'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500 pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
      </div>

        <div className="relative">
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-diary-beige-900"
          >
            Confirm Password
          </label>
          <div className="relative">
          <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
            className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500 pr-10"
            required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          isFullWidth
        >
          {isInvite ? 'Set Password' : 'Reset Password'}
        </Button>
      </form>
    </>
  );
}; 