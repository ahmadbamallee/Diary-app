import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Toast } from '../Toast';
import { supabase } from '../../lib/supabase';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Get the access token from the URL
    const hash = window.location.hash;
    const accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
    
    if (accessToken) {
      // Set the session with the access token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Password has been updated successfully. You can now sign in with your new password.',
      });

      // Clear the hash and redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.href = '/Diary-app/#signin';
      }, 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="text-center mb-6">
        <h1 className="text-2xl font-serif font-bold text-diary-beige-900">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-diary-beige-600">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-diary-beige-900"
          >
            New Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500"
            required
            minLength={6}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-diary-beige-900"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500"
            required
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          isLoading={loading}
          isFullWidth
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}; 