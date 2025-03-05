import React, { useState } from 'react';
import { Category, DiaryEntry } from '../types/diary';
import { Button } from './Button';

interface EntryFormProps {
  entry?: DiaryEntry;
  onSubmit: (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  entry,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    category: entry?.category || 'Personal' as Category,
    imageUrl: entry?.imageUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-diary-beige-900"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-diary-beige-300 shadow-sm
                   focus:border-diary-beige-500 focus:ring-diary-beige-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-diary-beige-900"
        >
          Category
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
          className="mt-1 block w-full rounded-md border-diary-beige-300 shadow-sm
                   focus:border-diary-beige-500 focus:ring-diary-beige-500"
        >
          <option value="Dream">Dream</option>
          <option value="Travel">Travel</option>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-diary-beige-900"
        >
          Content
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={6}
          className="mt-1 block w-full rounded-md border-diary-beige-300 shadow-sm
                   focus:border-diary-beige-500 focus:ring-diary-beige-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="image"
          className="block text-sm font-medium text-diary-beige-900"
        >
          Image
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1 block w-full text-sm text-diary-beige-900
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-diary-beige-50 file:text-diary-beige-700
                   hover:file:bg-diary-beige-100"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">
          {entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
}; 