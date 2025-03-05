import React from 'react';
import { CategoryInfo } from '../types/diary';

interface CategoryCardProps {
  category: CategoryInfo;
  onClick?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const { name, icon, coverImage, description } = category;

  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md aspect-[4/3]"
    >
      <div className="absolute inset-0">
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
      </div>
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white w-6 h-6">
            {icon}
          </span>
          <h3 className="text-xl font-serif font-semibold text-white">
            {name}
          </h3>
        </div>
        <p className="text-sm text-white/90">
          {description}
        </p>
      </div>
    </div>
  );
}; 