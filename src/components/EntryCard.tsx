import React from 'react';
import { format, parseISO } from 'date-fns';
import { DiaryEntry } from '../types/diary';

interface EntryCardProps {
  entry: DiaryEntry;
  onClick?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onClick }) => {
  const { title, category, createdAt, imageUrl } = entry;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover-card"
    >
      {imageUrl ? (
        <div className="relative h-48 w-full">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-white/90 text-diary-beige-800">
                {category}
              </span>
              <time className="text-sm text-white/90 font-medium">
                {formatDate(createdAt)}
              </time>
            </div>
            <h3 className="text-lg font-serif font-semibold text-white line-clamp-2">
              {title}
            </h3>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-diary-beige-100 text-diary-beige-800">
              {category}
            </span>
            <time className="text-sm text-diary-beige-500">
              {formatDate(createdAt)}
            </time>
          </div>
          <h3 className="text-lg font-serif font-semibold text-diary-beige-900 line-clamp-2">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
}; 