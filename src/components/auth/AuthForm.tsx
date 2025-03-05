import React, { useState } from 'react';
import { Button } from '../Button';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../Toast';
import { supabase } from '../../lib/supabase';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess: (message?: string) => void;
  onForgotPassword: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onForgotPassword }) => {
  const { signIn, signUp, checkEmailExists } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const handleEmailBlur = async () => {
    if (mode === 'signup' && email) {
      setIsCheckingEmail(true);
      try {
        const exists = await checkEmailExists(email);
        if (exists) {
          setError('An account with this email already exists');
        }
      } catch (err) {
        // Silently fail email check - we'll catch it during signup if it's an issue
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('security purposes')) {
            onSuccess(error.message); // Pass the rate limit message
            return;
          }
          throw error;
        }

        onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-diary-beige-900">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null); // Clear error when email changes
            }}
            onBlur={handleEmailBlur}
            className={`mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500
                     ${isCheckingEmail ? 'opacity-50' : ''}`}
            required
            disabled={isCheckingEmail}
          />
          {isCheckingEmail && (
            <p className="mt-1 text-sm text-diary-beige-600">
              Checking email availability...
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-diary-beige-900">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                     focus:border-diary-beige-500 focus:ring-diary-beige-500 pr-10"
            required
            minLength={6}
          />
          <button
            type="button"
            className="absolute right-2 top-9 text-lg text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Confirm Password Field (Only for Signup Mode) */}
        {mode === 'signup' && (
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-diary-beige-900">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-diary-beige-300 shadow-sm
                       focus:border-diary-beige-500 focus:ring-diary-beige-500 pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-2 top-9 text-lg text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        )}

        {mode === 'signin' && onForgotPassword && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-diary-beige-600 hover:text-diary-beige-800"
            >
              Forgot your password?
            </button>
          </div>
        )}

        <Button
          type="submit"
          isLoading={loading}
          isFullWidth
          disabled={isCheckingEmail || (mode === 'signup' && error !== null)}
        >
          {mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>
    </>
  );
};
