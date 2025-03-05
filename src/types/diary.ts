export type Category = 'Dream' | 'Travel' | 'Home' | 'Work' | 'Personal';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface CategoryInfo {
  name: Category;
  icon: string;
  coverImage: string;
  description: string;
} 