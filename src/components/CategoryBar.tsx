import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Shirt,
  BookOpen,
  Zap,
  Leaf,
  ShieldCheck,
} from 'lucide-react';

const categories = [
  { id: 'study', label: 'Study Essentials', icon: GraduationCap },
  { id: 'clothes', label: 'Clothes & Accessories', icon: Shirt },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'daily', label: 'Daily Essentials', icon: Zap },
  { id: 'eco', label: 'Eco-Friendly', icon: Leaf },
  { id: 'safe', label: 'Safe & Trusted', icon: ShieldCheck },
];

export const CategoryBar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const active = searchParams.get('category') || '';

  return (
    <div className="bg-white border-y border-blush-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 py-3 overflow-x-auto scrollbar-hide">
          {categories.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              to={id === 'safe' ? '/marketplace' : `/marketplace?category=${id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                active === id
                  ? 'bg-blush-100 text-[#c45a7c]'
                  : 'text-[#6b4f57] hover:bg-blush-50 hover:text-[#c45a7c]'
              }`}
            >
              <Icon size={18} strokeWidth={1.8} className="text-[#c45a7c]" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
