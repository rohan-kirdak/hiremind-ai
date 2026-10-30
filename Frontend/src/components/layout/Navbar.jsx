import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, UserCheck, AlertCircle } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import Badge from '../common/Badge';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { hasProfile, profile } = useProfile();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight tracking-tight flex items-center gap-1.5 font-semibold">
                HireMind <span className="text-brand-600 font-bold">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                Career Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Profile status indicator & quick action */}
        <div className="flex items-center gap-3">
          {hasProfile ? (
            <Link to="/profile" className="flex items-center gap-2 group">
              <Badge variant="success" size="md" icon={UserCheck} className="hidden sm:inline-flex">
                Profile Active
              </Badge>
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {profile.designation || 'Active Profile'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {profile.skills?.length || 0} skills identified
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/profile">
              <Badge variant="warning" size="md" icon={AlertCircle} className="cursor-pointer hover:bg-amber-100 transition-colors">
                Upload Resume
              </Badge>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

