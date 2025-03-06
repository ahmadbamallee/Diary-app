import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ user: User | null; message: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  handlePasswordReset: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ✅ Check active sessions and set the user
    const setupAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // ✅ Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            console.log('Auth event:', event);
            
            switch (event) {
              case 'SIGNED_IN':
                setUser(session?.user ?? null);
                break;
              case 'SIGNED_OUT':
                setUser(null);
                break;
              case 'USER_UPDATED':
                setUser(session?.user ?? null);
                break;
              case 'PASSWORD_RECOVERY':
                setUser(null);
                break;
              default:
                // Handle any other events
                if (session) {
                  setUser(session.user);
                }
                break;
            }
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupAuth();
  }, []);

  // ✅ SIGN UP FUNCTION WITH PASSWORD VALIDATION
  const signUp = async (email: string, password: string, confirmPassword: string) => {
    try {
      // Check if passwords match before sending request
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      // Attempt to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // Redirect after email verification
        },
      });

      // Handle errors properly
      if (error) {
        if (error.message.includes("User already registered")) {
          return {
            user: null,
            message: "This email is already registered. Please sign in instead.",
          };
        }
        throw error;
      }

      // If signup was successful, inform the user
      if (data?.user && !data.user.email_confirmed_at) {
        return {
          user: data.user,
          message: "A verification email has been sent to your email address. Please check your inbox and spam folder.",
        };
      }

      return {
        user: data?.user || null,
        message: "Signup successful!",
      };
    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "An error occurred during signup");
    }
  };

  // ✅ SIGN IN FUNCTION
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "An error occurred during sign in");
    }
  };

  // ✅ SIGN OUT FUNCTION
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "An error occurred during sign out");
    }
  };

  // ✅ UPDATE PASSWORD FUNCTION
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Update password error:", error);
      throw new Error(error.message || "An error occurred while updating password");
    }
  };

  // ✅ RESET PASSWORD REQUEST FUNCTION
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error("Reset password error:", error);
      throw new Error(error.message || "An error occurred while requesting password reset");
    }
  };

  // ✅ HANDLE PASSWORD RESET FUNCTION
  const handlePasswordReset = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // After successful password reset, sign out to force re-authentication
      await signOut();
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw new Error(error.message || "An error occurred while resetting password");
    }
  };

  // Updated DELETE ACCOUNT FUNCTION
  const deleteAccount = async () => {
    try {
      // Get current session and verify authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return { success: false, message: 'Failed to get session' };
      }

      if (!session) {
        return { success: false, message: 'Not authenticated' };
      }

      // Delete user data using RPC
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        if (deleteError.message.includes('Not authenticated')) {
          return { success: false, message: 'Please sign in again to delete your account' };
        }
        return { success: false, message: deleteError.message };
      }

      // Only sign out if deletion was successful
      await signOut();
      setUser(null);
      
      toast.success('Your account has been successfully deleted');
      return { success: true, message: 'Account successfully deleted' };

    } catch (error: any) {
      console.error('Delete account error:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred while deleting account'
      };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    resetPassword,
    handlePasswordReset,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ✅ CUSTOM HOOK FOR USING AUTH
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
