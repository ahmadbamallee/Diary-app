import React from 'react';
import {
  HomeIcon,
  PlusCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface NavigationBarProps {
  onHomeClick: () => void;
  onAddClick: () => void;
  onProfileClick: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  onHomeClick,
  onAddClick,
  onProfileClick,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-diary-beige-200 px-6 py-2">
      <div className="max-w-screen-xl mx-auto flex items-center justify-around">
        <button
          onClick={onHomeClick}
          className="p-2 text-diary-beige-600 hover:text-diary-beige-900 transition-colors"
        >
          <HomeIcon className="h-6 w-6" />
        </button>

        <button
          onClick={onAddClick}
          className="p-2 -mt-8 bg-diary-beige-600 text-white rounded-full shadow-lg
                   hover:bg-diary-beige-700 transition-colors"
        >
          <PlusCircleIcon className="h-8 w-8" />
        </button>

        <button
          onClick={onProfileClick}
          className="p-2 text-diary-beige-600 hover:text-diary-beige-900 transition-colors"
        >
          <UserCircleIcon className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}; 