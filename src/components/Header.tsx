import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  BarChart2, 
  Home as HomeIcon, 
  Menu, 
  X, 
  UserCheck, 
  Layers,
  LogOut,
  Shield,
  ChevronDown
} from 'lucide-react';
import { Language, UserRole, AuthUser } from '../types';
import { t } from '../locales/i18n';

export type MainNavTab = 'home' | 'documents' | 'issues' | 'reports';

interface HeaderProps {
  activeTab: MainNavTab;
  onNavigateTab: (tab: MainNavTab) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentRole: UserRole;
  user?: AuthUser | null;
  onSignOut?: () => void;
  onRoleChange?: (role: UserRole) => void;
  pendingIssuesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateTab,
  lang,
  onLanguageChange,
  currentRole,
  user,
  onSignOut,
  onRoleChange,
  pendingIssuesCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const navItems: { key: MainNavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'home', label: t('nav.home', lang), icon: HomeIcon },
    { key: 'documents', label: t('nav.documents', lang), icon: FileText },
    { key: 'issues', label: t('nav.issues', lang), icon: AlertTriangle },
    { key: 'reports', label: t('nav.reports', lang), icon: BarChart2 }
  ];

  const roleLabel = 
    currentRole === 'ADMIN' 
      ? t('roles.admin', lang) 
      : currentRole === 'VIEWER' 
      ? t('roles.viewer', lang) 
      : t('roles.operator', lang);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner / Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Wordmark & Subtitle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('home')}
              className="flex items-center gap-3 text-left focus:outline-hidden focus:ring-2 focus:ring-blue-700 rounded-lg p-1"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-blue-950 font-sans">
                    {t('app.title', lang)}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold border border-blue-200">
                    KMRL OPS
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600">
                  {t('app.subtitle', lang)}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Right Actions: Language Switcher & User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher: English | മലയാളം */}
            <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-medium" role="group" aria-label="Language selection">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'en'
                    ? 'bg-white text-blue-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={lang === 'en'}
              >
                English
              </button>
              <span className="text-slate-300 px-0.5">|</span>
              <button
                onClick={() => onLanguageChange('ml')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'ml'
                    ? 'bg-white text-blue-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={lang === 'ml'}
              >
                മലയാളം
              </button>
            </div>

            {/* User Profile Badge & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 py-1.5 pr-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs text-slate-700 focus:outline-hidden"
              >
                <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                  {user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : <UserCheck className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 block leading-tight">
                    {user?.name || roleLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {user?.stationName || 'Kochi Metro Rail'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name || 'KMRL Official'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{user?.badgeNumber || 'KMRL-OPS-4092'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{user?.email || 'officer@kochimetro.org'}</p>
                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                      {roleLabel}
                    </div>
                  </div>

                  {/* Role Switcher in Dropdown */}
                  {onRoleChange && (
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                        Switch Operational Role
                      </span>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            onRoleChange('OPERATOR');
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                            currentRole === 'OPERATOR' ? 'bg-blue-100 text-blue-950 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t('roles.operator', lang)}
                        </button>
                        <button
                          onClick={() => {
                            onRoleChange('ADMIN');
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                            currentRole === 'ADMIN' ? 'bg-blue-100 text-blue-950 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t('roles.admin', lang)}
                        </button>
                        <button
                          onClick={() => {
                            onRoleChange('VIEWER');
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                            currentRole === 'VIEWER' ? 'bg-blue-100 text-blue-950 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t('roles.viewer', lang)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sign Out Button */}
                  {onSignOut && (
                    <div className="px-1.5 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out / End Shift</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-white text-blue-950 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ml')}
                className={`px-2 py-0.5 rounded ${lang === 'ml' ? 'bg-white text-blue-950 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                മല
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Primary Horizontal Navigation Bar (Government Portal Standard) */}
      <div className="bg-blue-950 text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigateTab(item.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-amber-400 bg-blue-900 text-white font-bold'
                      : 'border-transparent text-blue-100 hover:bg-blue-900/60 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.key === 'issues' && pendingIssuesCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 text-xs font-bold rounded-full bg-amber-400 text-blue-950">
                      {pendingIssuesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-950 text-white border-t border-blue-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigateTab(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                  isActive ? 'bg-blue-900 text-amber-400 font-bold' : 'text-blue-100 hover:bg-blue-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.key === 'issues' && pendingIssuesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-blue-950">
                    {pendingIssuesCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Mobile Sign Out */}
          {onSignOut && (
            <div className="pt-2 border-t border-blue-900/80">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-rose-300 hover:bg-blue-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user?.name || roleLabel})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
