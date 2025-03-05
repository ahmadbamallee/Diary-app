import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { DiaryEntry, Category } from '../types/diary';

interface DiaryContextType {
  entries: DiaryEntry[];
  loading: boolean;
  addEntry: (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, data: Partial<Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntriesByCategory: (category: Category) => DiaryEntry[];
  searchEntries: (query: string) => DiaryEntry[];
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch entries when user changes
  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to ensure proper date handling
      const transformedEntries = (data || []).map(entry => ({
        ...entry,
        id: entry.id,
        title: entry.title,
        content: entry.content,
        category: entry.category,
        imageUrl: entry.image_url,
        createdAt: new Date(entry.created_at).toISOString(),
        updatedAt: new Date(entry.updated_at).toISOString()
      }));

      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('diary_entries')
        .insert([
          {
            user_id: user?.id,
            title: data.title,
            content: data.content,
            category: data.category,
            image_url: data.imageUrl,
            created_at: now,
            updated_at: now
          },
        ]);

      if (error) throw error;

      await fetchEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const updateEntry = async (
    id: string,
    data: Partial<Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          image_url: data.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const getEntriesByCategory = (category: Category) => {
    return entries.filter((entry) => entry.category === category);
  };

  const searchEntries = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.content.toLowerCase().includes(lowercaseQuery)
    );
  };

  const value = {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByCategory,
    searchEntries,
  };

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
};

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return context;
}; 