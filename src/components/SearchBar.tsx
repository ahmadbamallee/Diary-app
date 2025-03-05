import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search entries...',
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-diary-beige-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-diary-beige-200 rounded-lg
                 bg-white placeholder-diary-beige-400 text-diary-beige-900
                 focus:outline-none focus:ring-2 focus:ring-diary-beige-500 focus:border-transparent
                 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}; 