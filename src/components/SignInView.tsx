import React, { useState } from 'react';
import { 
  Layers, 
  Shield, 
  UserCheck, 
  KeyRound, 
  ArrowRight, 
  Lock, 
  Building2, 
  CheckCircle2,
  TrainTrack,
  Info
} from 'lucide-react';
import { AuthUser, Language, UserRole } from '../types';
import { DEFAULT_DEMO_USERS } from '../data/syntheticDemoData';
import { t } from '../locales/i18n';

interface SignInViewProps {
  onSignIn: (user: AuthUser) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignIn,
  lang,
  onLanguageChange
}) => {
  const [selectedDemoUser, setSelectedDemoUser] = useState<AuthUser>(DEFAULT_DEMO_USERS[0]);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [customRole, setCustomRole] = useState<UserRole>('OPERATOR');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'quick' | 'credentials'>('quick');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickSignIn = (user: AuthUser) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setTimeout(() => {
      onSignIn({
        ...user,
        lastLogin: new Date().toISOString()
      });
    }, 250);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) {
      setErrorMsg('Please enter an official KMRL email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      // Find matching demo user or generate a session user
      const existing = DEFAULT_DEMO_USERS.find(u => u.email.toLowerCase() === customEmail.toLowerCase());
      const authenticatedUser: AuthUser = existing || {
        id: `USR-KMRL-${Math.floor(100 + Math.random() * 900)}`,
        name: customEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: customEmail,
        role: customRole,
        badgeNumber: `KMRL-${customRole.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
        stationName: 'OCC Muttom / Kochi Metro',
        stationId: 'STN-OCC-CENTRAL',
        department: customRole === 'ADMIN' ? 'SIGNALLING_TELECOM' : customRole === 'VIEWER' ? 'CUSTOMER_SERVICE' : 'OPERATIONS',
        lastLogin: new Date().toISOString()
      };

      onSignIn(authenticatedUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900">
      
      {/* Top Government Portal Branding Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-blue-950 font-sans">
                  {t('app.title', lang)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold border border-blue-200">
                  KMRL Internal Portal
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {t('app.subtitle', lang)}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded transition-colors ${
                lang === 'en'
                  ? 'bg-white text-blue-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
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
            >
              മലയാളം
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Visual / Institutional Context Panel (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white flex flex-col justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-100 text-xs font-semibold border border-blue-700/50">
                <TrainTrack className="w-3.5 h-3.5 text-amber-400" />
                <span>Kochi Metro Rail Limited</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Operational Document Intelligence System
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                  Automated incident log correlation, weak-signal degradation monitoring, and silent risk detection across KMRL lines.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs text-blue-100">
                  <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Bilingual support (English & Malayalam OCR log extraction)</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-blue-100">
                  <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Deterministic cosine similarity & time-span correlation</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-blue-100">
                  <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Human-in-the-loop verification & audit traceability</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-blue-800/60 mt-6 text-[11px] text-blue-300">
              Authorized Personnel Only • Government of Kerala & GoI Joint Venture
            </div>
          </div>

          {/* Right Authentication Form Panel (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header inside form */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Secure Operational Sign-In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate with your KMRL institutional credentials or select an active shift role.
                </p>
              </div>

              {/* Toggle: Quick Shift Access vs Official SSO Credentials */}
              <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthTab('quick')}
                  className={`flex-1 py-2 text-center rounded-md transition-colors ${
                    authTab === 'quick'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shift Role Selection (1-Click)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('credentials')}
                  className={`flex-1 py-2 text-center rounded-md transition-colors ${
                    authTab === 'credentials'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  KMRL SSO Credentials
                </button>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Mode A: 1-Click Institutional Shift Profiles */}
              {authTab === 'quick' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-600">
                    Select an Authorized Operational Shift Profile:
                  </div>

                  <div className="space-y-2.5">
                    {DEFAULT_DEMO_USERS.map((user) => {
                      const isSelected = selectedDemoUser.id === user.id;
                      const roleBadgeColor = 
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-900 border-purple-200' 
                          : user.role === 'VIEWER' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                          : 'bg-blue-100 text-blue-900 border-blue-200';

                      return (
                        <div
                          key={user.id}
                          onClick={() => setSelectedDemoUser(user)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-700 bg-blue-50/50 ring-2 ring-blue-700/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{user.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${roleBadgeColor}`}>
                                  {user.role}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{user.stationName}</span>
                                <span>•</span>
                                <span className="font-mono">{user.badgeNumber}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickSignIn(selectedDemoUser)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 active:bg-blue-900 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span>Authenticating Session...</span>
                    ) : (
                      <>
                        <span>Enter Portal as {selectedDemoUser.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mode B: KMRL SSO Credentials Form */}
              {authTab === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official KMRL Email
                    </label>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. officer.menon@kochimetro.org"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password / Security PIN
                    </label>
                    <input
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designated Role Level
                    </label>
                    <select
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white"
                    >
                      <option value="OPERATOR">Station Operations Officer (Operator)</option>
                      <option value="ADMIN">System & Telecommunications Administrator</option>
                      <option value="VIEWER">Safety & Compliance Auditor (Read-Only)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Sign In to MetroLens AI</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>

            {/* Bottom Security Notice */}
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Protected by KMRL Access Control • Session active for 8 hours on duty
            </div>
          </div>

        </div>
      </div>

      {/* Institutional Footer */}
      <div className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        MetroLens AI Operational Platform • Kochi Metro Rail Limited
      </div>

    </div>
  );
};
