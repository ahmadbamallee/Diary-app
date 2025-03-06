import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset-password';
  onSuccess: (mode: 'signin' | 'signup', message?: string) => void;
  onModeChange: (mode: 'signin' | 'signup' | 'reset-password') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return true; // Email exists but not confirmed
        }
        return false; // Email doesn't exist
      }

      return true; // Email exists
    } catch {
      return false;
    }
  };

  const handleEmailBlur = async () => {
    if (mode === 'signup' && email) {
      setIsCheckingEmail(true);
      setError(null);
      
      try {
        const exists = await checkEmailExists(email);
        if (exists) {
          setError('An account with this email already exists');
        }
      } catch (err) {
        console.error('Error checking email:', err);
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'reset-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}?type=recovery`,
        });

        if (error) throw error;

        toast.success(
          'Password reset instructions have been sent to your email. Please check your inbox.',
          {
            duration: 6000,
            icon: '📧',
            style: {
              background: '#10B981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            }
          }
        );

        // Switch back to sign in mode after sending reset instructions
        onModeChange('signin');
      } else if (mode === 'signup') {
        // Check if passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Check email existence again before signup
        const exists = await checkEmailExists(email);
        if (exists) {
          setError('An account with this email already exists');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              invited: true
            }
          },
        });

        if (error) throw error;
        onSuccess(mode);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onSuccess(mode);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-diary-beige-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-serif font-bold text-diary-beige-900 mb-6 text-center">
          {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

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
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
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

          {mode !== 'reset-password' && (
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-diary-beige-900"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
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
          )}

          {mode === 'signup' && (
            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-diary-beige-900"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
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
          )}

          <Button
            type="submit"
            isLoading={loading}
            isFullWidth
            disabled={isCheckingEmail || (mode === 'signup' && error !== null)}
          >
            {mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Sign Up'
              : 'Send Reset Instructions'}
          </Button>
        </form>

        <div className="mt-6 space-y-4 text-center">
          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => onModeChange('reset-password')}
              className="text-sm text-diary-beige-600 hover:text-diary-beige-800"
            >
              Forgot your password?
            </button>
          )}

          <button
            type="button"
            onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-diary-beige-600 hover:text-diary-beige-800"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : mode === 'signup'
              ? 'Already have an account? Sign in'
              : 'Back to Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
