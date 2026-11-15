import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { Logo } from './Logo';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/marketplace', label: 'Browse', icon: Search },
  { to: '/emergency', label: 'Emergency Essentials', icon: AlertTriangle },
];

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blush-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blush-100 text-[#c45a7c]'
                      : 'text-[#6b4f57] hover:bg-blush-50 hover:text-[#c45a7c]'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side: notifications + avatar + mobile menu hint */}
          <div className="flex items-center gap-3">
            <Link
              to="/listings/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c45a7c] text-white text-sm font-medium hover:bg-[#a34463] transition-colors shadow-sm"
            >
              List an Item
            </Link>
            <button
              type="button"
              className="relative p-2 rounded-full text-[#6b4f57] hover:bg-blush-50 hover:text-[#c45a7c] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c45a7c] rounded-full" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8a0b0] to-[#c45a7c] text-white font-semibold text-sm flex items-center justify-center shadow-sm ring-2 ring-white"
              aria-label="Profile"
            >
              NJ
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blush-100 text-[#c45a7c]'
                    : 'text-[#6b4f57] hover:bg-blush-50'
                }`
              }
            >
              <Icon size={14} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
