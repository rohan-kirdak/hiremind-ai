import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  BarChart3,
  UserCircle,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

export default function Sidebar({ isOpen, onClose }) {
  const { hasProfile, profile } = useProfile();

  const navItems = [
    {
      name: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Job Search',
      to: '/jobs',
      icon: Briefcase,
      badge: '1,700+',
    },
    {
      name: 'AI Career Assistant',
      to: '/assistant',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-brand-100 text-brand-700',
    },
    {
      name: 'Match Analysis',
      to: '/match-analysis',
      icon: BarChart3,
      badge: hasProfile ? 'Active' : null,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      name: 'My Profile',
      to: '/profile',
      icon: UserCircle,
      badge: hasProfile ? `${profile.skills?.length || 0} skills` : 'Empty',
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col pt-16 lg:pt-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header for desktop */}
        <div className="hidden lg:flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              HireMind <span className="text-brand-600">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
              Career Intelligence
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-brand-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile completion footer widget */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-xl">
          {hasProfile ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Resume Active</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-medium">
                {profile.designation || 'Candidate'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {profile.domain?.categoryName || 'Multi-Domain'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1 text-slate-700">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold">No Resume Yet</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                Upload your resume to enable deterministic match scoring and AI guidance.
              </p>
              <NavLink
                to="/profile"
                onClick={onClose}
                className="inline-flex items-center justify-center w-full text-xs font-medium py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Upload Resume
              </NavLink>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
