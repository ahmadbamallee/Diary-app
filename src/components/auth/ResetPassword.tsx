import React, { useState } from 'react';
import { Button } from '../Button';
import { Toast } from '../Toast';
import { supabase } from '../../lib/supabase';

interface ResetPasswordProps {
  onBack: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/Diary-app/`,
      });

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Password reset instructions have been sent to your email',
      });
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
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-diary-beige-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-diary-beige-900"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500"
            required
          />
        </div>

        <Button
          type="submit"
          isLoading={loading}
          isFullWidth
        >
          Send Reset Instructions
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-diary-beige-600 hover:text-diary-beige-800"
        >
          Back to Sign In
        </button>
      </form>
    </div>
  );
}; 