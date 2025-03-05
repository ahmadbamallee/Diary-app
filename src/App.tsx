import React, { useState, useEffect } from 'react';
import { DiaryProvider, useDiary } from './context/DiaryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationBar } from './components/NavigationBar';
import { SearchBar } from './components/SearchBar';
import { CategoryCard } from './components/CategoryCard';
import { EntryCard } from './components/EntryCard';
import { EntryForm } from './components/EntryForm';
import { AuthForm } from './components/auth/AuthForm';
import { ResetPassword } from './components/auth/ResetPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { ProfilePage } from './components/auth/ProfilePage';
import { Category, CategoryInfo, DiaryEntry } from './types/diary';
import { Button } from './components/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from './lib/supabase';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';


const categories: CategoryInfo[] = [
  {
    name: 'Dream',
    icon: '✨',
    coverImage: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?auto=format&fit=crop&q=80',
    description: 'Record your dreams and aspirations',
  },
  {
    name: 'Travel',
    icon: '✈️',
    coverImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80',
    description: 'Document your adventures',
  },
  {
    name: 'Home',
    icon: '🏠',
    coverImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80',
    description: 'Memories from home',
  },
  {
    name: 'Work',
    icon: '💼',
    coverImage: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&q=80',
    description: 'Professional life journal',
  },
  {
    name: 'Personal',
    icon: '📝',
    coverImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80',
    description: 'Your personal thoughts',
  },
];

// Add these toast style configurations
const toastStyles = {
  success: {
    style: {
      background: '#059669',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#059669',
    },
  },
  error: {
    style: {
      background: '#DC2626',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#DC2626',
    },
  },
  warning: {
    style: {
      background: '#D97706',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#D97706',
    },
  },
  loading: {
    style: {
      background: '#1E40AF',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },
};

function DiaryApp() {
  const { user } = useAuth();
  const {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByCategory,
    searchEntries,
  } = useDiary();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset-password'>('signin');
  const [isResetPasswordPage, setIsResetPasswordPage] = useState(false);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>(() => entries);

  useEffect(() => {
    const checkSession = async () => {
      // Check for access token in URL
      const fragment = window.location.hash;
      const params = new URLSearchParams(fragment.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (accessToken && type === 'recovery') {
        // Set up session for password reset
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });
        setIsResetPasswordPage(true);
      } else if (fragment) {
        // Handle other hash-based navigation
        if (fragment.includes('#signin')) {
          setAuthMode('signin');
        } else if (fragment.includes('#signup')) {
          setAuthMode('signup');
        } else if (fragment.includes('#reset-password')) {
          setAuthMode('reset-password');
        }
      }
    };

    checkSession();
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('#signin')) {
        setAuthMode('signin');
        setIsResetPasswordPage(false);
      } else if (hash.includes('#signup')) {
        setAuthMode('signup');
        setIsResetPasswordPage(false);
      } else if (hash.includes('#reset-password')) {
        setAuthMode('reset-password');
        setIsResetPasswordPage(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Add effect to update filtered entries when search, category, or entries change
  useEffect(() => {
    let result = entries;
    
    if (selectedCategory) {
      result = getEntriesByCategory(selectedCategory);
    }
    
    if (searchQuery) {
      result = searchEntries(searchQuery);
    }

    setFilteredEntries(result);
  }, [searchQuery, selectedCategory, entries, getEntriesByCategory, searchEntries]);

  // Add the missing handler functions
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName as Category);
  };

  const handleEntryClick = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsDetailView(true);
  };

  const handleEntrySubmit = async (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEntry) {
      await updateEntry(selectedEntry.id, entry);
    } else {
      await addEntry(entry);
    }
    setIsFormOpen(false);
    setSelectedEntry(null);
  };

  // Update the AuthForm success handler with better messaging and error handling
  const handleAuthSuccess = async (mode: 'signin' | 'signup', message?: string) => {
    if (mode === 'signup') {
      // Check if there's a rate limit message
      if (message?.toLowerCase().includes('security purposes')) {
        toast.error(
          'Please wait a moment before requesting another verification email.',
          {
            duration: 5000,
            position: 'top-center',
            style: {
              maxWidth: '500px',
              padding: '16px',
              lineHeight: '1.5',
            },
          }
        );
        return;
      }

      toast.success(
        'Account created successfully! A confirmation link has been sent to your email. Please check your inbox and click the link to verify your account.',
        {
          duration: 8000,
          position: 'top-center',
          style: {
            maxWidth: '500px',
            padding: '16px',
            lineHeight: '1.5',
          },
        }
      );
    } else {
      toast.success('Welcome back!', {
        duration: 3000,
        position: 'top-center',
      });
      // Clear any hash from URL after successful login
      window.location.hash = '';
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const isConfirmed = window.confirm(
      '📝 Delete Entry\n\n' +
      'Are you sure you want to delete this diary entry?\n' +
      'This action cannot be undone.'
    );
    
    if (!isConfirmed) {
      return;
    }

    try {
      toast.loading('Deleting entry...', { 
        duration: 2000,
        ...toastStyles.loading
      });

      await deleteEntry(entryId);
      setIsDetailView(false);
      setSelectedEntry(null);
      
      toast.success('Entry deleted successfully', {
        icon: '🗑️',
        duration: 3000,
        ...toastStyles.success
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry. Please try again.', {
        icon: '❌',
        duration: 3000,
        ...toastStyles.error
      });
    }
  };

  // Show update password form for reset password flow
  if (isResetPasswordPage) {
    return (
      <div className="min-h-screen bg-diary-beige-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <UpdatePassword />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-diary-beige-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          {authMode === 'reset-password' ? (
            <ResetPassword onBack={() => {
              setAuthMode('signin');
              window.location.hash = 'signin';
            }} />
          ) : (
            <>
              <h1 className="text-2xl font-serif font-bold text-diary-beige-900 mb-6 text-center">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              
              <AuthForm
                mode={authMode === 'signin' ? 'signin' : 'signup'}
                onSuccess={(message) => handleAuthSuccess(authMode, message)}
                onForgotPassword={() => {
                  setAuthMode('reset-password');
                  window.location.hash = 'reset-password';
                }}
              />

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    const newMode = authMode === 'signin' ? 'signup' : 'signin';
                    setAuthMode(newMode);
                    window.location.hash = newMode;
                  }}
                  className="text-diary-beige-600 hover:text-diary-beige-800 text-sm"
                >
                  {authMode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isProfileView) {
    return (
      <div className="min-h-screen bg-diary-beige-50">
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileView(false)}
            >
              Back to Diary
            </Button>
          </div>
        </header>
        <ProfilePage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-diary-beige-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-bold text-diary-beige-900">
              My Diary
            </h1>
            {selectedCategory && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                rightIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Clear Filter
              </Button>
            )}
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search your entries..."
          />
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6 pb-24">
        {!isDetailView && (
          <>
            {/* Your Journal Section */}
            <section className="mb-8">
              <h2 className="text-xl font-serif font-semibold text-diary-beige-900 mb-4">
                Your Journal
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.name}
                    category={category}
                    onClick={() => handleCategoryClick(category.name)}
                  />
                ))}
              </div>
            </section>

            {/* Recent Entries Section */}
            <section>
              <h2 className="text-xl font-serif font-semibold text-diary-beige-900 mb-4">
                {selectedCategory ? `${selectedCategory} Entries` : 'Recent Entries'}
              </h2>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-diary-beige-600">
                    {searchQuery
                      ? 'No entries found for your search'
                      : selectedCategory
                      ? `No entries in ${selectedCategory} category yet`
                      : 'No entries yet. Start writing your first entry!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => handleEntryClick(entry)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Entry Detail View */}
        {isDetailView && selectedEntry && (
          <section className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailView(false)}
              >
                Back
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(true);
                    setIsDetailView(false);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedEntry.imageUrl && (
                <div className="relative h-64 -mx-6 -mt-6 mb-6">
                  <img
                    src={selectedEntry.imageUrl}
                    alt={selectedEntry.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-2 py-1 text-sm font-semibold rounded-full bg-diary-beige-100 text-diary-beige-800">
                  {selectedEntry.category}
                </span>
                <time className="text-sm text-gray-500">
                  {new Date(selectedEntry.createdAt).toLocaleDateString()}
                </time>
              </div>
              <h1 className="text-2xl font-serif font-bold text-diary-beige-900 mb-4">
                {selectedEntry.title}
              </h1>
              <p className="text-diary-beige-800 whitespace-pre-wrap">
                {selectedEntry.content}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Entry Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-serif font-semibold text-diary-beige-900 mb-6">
              {selectedEntry ? 'Edit Entry' : 'New Entry'}
            </h2>
            <EntryForm
              entry={selectedEntry || undefined}
              onSubmit={handleEntrySubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedEntry(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <NavigationBar
        onHomeClick={() => {
          setIsDetailView(false);
          setSelectedEntry(null);
          setSelectedCategory(null);
        }}
        onAddClick={() => {
          setIsFormOpen(true);
          setSelectedEntry(null);
        }}
        onProfileClick={() => setIsProfileView(true)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DiaryProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              maxWidth: '500px',
              minWidth: '300px',
            },
            success: toastStyles.success,
            error: toastStyles.error,
            loading: toastStyles.loading,
          }}
        />
        <DiaryApp />
      </DiaryProvider>
    </AuthProvider>
  );
}

export default App;
