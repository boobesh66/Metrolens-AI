import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header, 
  MainNavTab 
} from './components/Header';
import { 
  HomeView 
} from './components/HomeView';
import { 
  DocumentsView 
} from './components/DocumentsView';
import { 
  IssuesView 
} from './components/IssuesView';
import { 
  ReportsView 
} from './components/ReportsView';
import { 
  UploadDocumentModal 
} from './components/UploadDocumentModal';
import { 
  SignInView 
} from './components/SignInView';

import { 
  OperationalDocument, 
  ExtractedIncident, 
  RecurringIssueCluster, 
  OperationalAction, 
  DashboardMetrics, 
  UserRole, 
  Language, 
  ActionStatus,
  AuthUser,
  AuthStatus
} from './types';
import { 
  INITIAL_DEMO_DOCUMENTS, 
  INITIAL_EXTRACTED_INCIDENTS, 
  INITIAL_RECURRING_CLUSTERS, 
  INITIAL_OPERATIONAL_ACTIONS,
  DEFAULT_DEMO_USERS 
} from './data/syntheticDemoData';

const AUTH_STORAGE_KEY = 'kmrl_metrolens_auth_session';

interface SessionState {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
}

const getInitialSession = (): SessionState => {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) {
      // Default to initial authorized shift officer for instant preview access
      return {
        user: DEFAULT_DEMO_USERS[0],
        status: 'authenticated',
        isAuthenticated: true
      };
    }
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.name && parsed.role) {
      return {
        user: parsed as AuthUser,
        status: 'authenticated',
        isAuthenticated: true
      };
    }
    // If parsed object is invalid structure, reset storage and fall back to idle
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      user: null,
      status: 'idle',
      isAuthenticated: false
    };
  } catch (error) {
    console.warn("Could not retrieve or parse session from localStorage. Setting default 'idle' state.", error);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    return {
      user: null,
      status: 'idle',
      isAuthenticated: false
    };
  }
};

export function App() {
  // 1. Authentication State Management & Synchronization
  const [initialSession] = useState<SessionState>(() => getInitialSession());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialSession.user);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(initialSession.status);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession.isAuthenticated);

  // 2. Navigation & User Preferences
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser?.role || 'OPERATOR');
  const [lang, setLang] = useState<Language>('en');

  // 3. Modals & Selection State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<OperationalDocument | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<RecurringIssueCluster | null>(null);

  // 4. Core Operational Data Stores
  const [documents, setDocuments] = useState<OperationalDocument[]>(INITIAL_DEMO_DOCUMENTS);
  const [incidents, setIncidents] = useState<ExtractedIncident[]>(INITIAL_EXTRACTED_INCIDENTS);
  const [clusters, setClusters] = useState<RecurringIssueCluster[]>(INITIAL_RECURRING_CLUSTERS);
  const [actions, setActions] = useState<OperationalAction[]>(INITIAL_OPERATIONAL_ACTIONS);
  
  // Safe default metrics so HomeView/Dashboard never fails to render
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDocuments: INITIAL_DEMO_DOCUMENTS.length,
    processedDocuments: INITIAL_DEMO_DOCUMENTS.length,
    recurringClustersCount: INITIAL_RECURRING_CLUSTERS.length,
    silentRisksCount: INITIAL_RECURRING_CLUSTERS.filter(c => c.isSilentRisk).length,
    pendingActionsCount: INITIAL_OPERATIONAL_ACTIONS.filter(a => a.status !== 'RESOLVED').length,
    highOrCriticalCount: INITIAL_RECURRING_CLUSTERS.filter(c => c.riskTier === 'CRITICAL' || c.riskTier === 'HIGH').length,
    averageRiskScore: 68,
    stationStats: [
      { stationName: 'Aluva', totalReports: 5, activeClusters: 1, riskScore: 88 },
      { stationName: 'Edapally', totalReports: 4, activeClusters: 1, riskScore: 78 },
      { stationName: 'Petta', totalReports: 3, activeClusters: 1, riskScore: 72 },
      { stationName: 'Kalamassery', totalReports: 2, activeClusters: 1, riskScore: 40 }
    ],
    departmentStats: [
      { department: 'ELECTRICAL_MAINTENANCE', count: 6 },
      { department: 'SIGNALLING_TELECOM', count: 4 },
      { department: 'OPERATIONS', count: 4 }
    ],
    temporalTrend: [
      { month: 'May 2026', totalIncidents: 8, recurringClusters: 1, silentRisks: 0 },
      { month: 'Jun 2026', totalIncidents: 14, recurringClusters: 2, silentRisks: 1 },
      { month: 'Jul 2026', totalIncidents: 22, recurringClusters: 3, silentRisks: 1 },
      { month: 'Aug 2026', totalIncidents: 31, recurringClusters: 4, silentRisks: 1 }
    ],
    recentClusters: INITIAL_RECURRING_CLUSTERS.slice(0, 4)
  });

  // Fetch data from Express backend API
  const refreshData = useCallback(async () => {
    try {
      const [mRes, dRes, cRes, aRes] = await Promise.allSettled([
        fetch('/api/dashboard'),
        fetch('/api/documents'),
        fetch('/api/issues/recurring'),
        fetch('/api/actions')
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        const mData = await mRes.value.json();
        if (mData && typeof mData === 'object') setMetrics(mData);
      }

      if (dRes.status === 'fulfilled' && dRes.value.ok) {
        const dData = await dRes.value.json();
        if (dData.documents) setDocuments(dData.documents);
      }

      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const cData = await cRes.value.json();
        if (cData.clusters) setClusters(cData.clusters);
      }

      if (aRes.status === 'fulfilled' && aRes.value.ok) {
        const aData = await aRes.value.json();
        if (aData.actions) setActions(aData.actions);
      }
    } catch (err) {
      console.warn("Backend API notice: Operating with local dataset.", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auth Action Handlers
  const handleSignIn = (user: AuthUser) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Could not save session to localStorage", e);
    }
    setCurrentUser(user);
    setAuthStatus('authenticated');
    setIsAuthenticated(true);
    setCurrentRole(user.role);
    // Explicitly guarantee routing lands directly onto the home dashboard view
    setActiveTab('home');
    refreshData();
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn("Could not remove session from localStorage", e);
    }
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
    setIsAuthenticated(false);
    setActiveTab('home');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      const updatedUser: AuthUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (e) {
        // ignore
      }
    }
  };

  // Document Upload handler
  const handleUploadDocument = async (docData: any) => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.document) setDocuments(prev => [data.document, ...prev]);
        if (data.incident) setIncidents(prev => [data.incident, ...prev]);
        await refreshData();
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // Human Verification handler
  const handleVerifyIncident = async (incidentId: string, correctedFields?: any) => {
    try {
      const verifierName = currentUser?.name || 'Station Operations Officer';
      const res = await fetch(`/api/issues/${incidentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedBy: verifierName,
          correctedFields
        })
      });
      if (res.ok) {
        setIncidents(prev => prev.map(inc => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              isVerifiedByHuman: true,
              verifiedBy: verifierName,
              ...(correctedFields || {})
            };
          }
          return inc;
        }));
      }
    } catch (e) {
      console.error("Verification error:", e);
    }
  };

  // Update Action Status handler
  const handleUpdateActionStatus = async (actionId: string, status: ActionStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  // Unauthenticated Route Guard: If not signed in or idle, display the KMRL Sign In View
  if (!isAuthenticated || !currentUser || authStatus !== 'authenticated') {
    return (
      <SignInView
        onSignIn={handleSignIn}
        lang={lang}
        onLanguageChange={setLang}
      />
    );
  }

  const pendingIssuesCount = clusters.filter(c => c.actionPriority === 'P1_IMMEDIATE' || c.actionPriority === 'P2_HIGH').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Institutional Portal Header with Profile & Role Switching */}
      <Header
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        lang={lang}
        onLanguageChange={setLang}
        currentRole={currentRole}
        user={currentUser}
        onSignOut={handleSignOut}
        onRoleChange={handleRoleChange}
        pendingIssuesCount={pendingIssuesCount}
      />

      {/* Main Workspace Body with Protected Tab Routing */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Home Dashboard View (Default & Fallback) */}
        {(activeTab === 'home' || !['documents', 'issues', 'reports'].includes(activeTab)) && (
          <HomeView
            metrics={metrics}
            clusters={clusters}
            documents={documents}
            onNavigateTab={setActiveTab}
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectCluster={(cl) => {
              setSelectedCluster(cl);
              setActiveTab('issues');
            }}
            onSelectDocument={(doc) => {
              setSelectedDocument(doc);
              setActiveTab('documents');
            }}
            lang={lang}
          />
        )}

        {/* Operational Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            incidents={incidents}
            selectedDocument={selectedDocument}
            onSelectDocument={setSelectedDocument}
            onOpenUpload={() => setIsUploadOpen(true)}
            onVerifyIncident={handleVerifyIncident}
            lang={lang}
          />
        )}

        {/* Issues & Emerging Risks Tab */}
        {activeTab === 'issues' && (
          <IssuesView
            clusters={clusters}
            documents={documents}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            onUpdateActionStatus={handleUpdateActionStatus}
            lang={lang}
          />
        )}

        {/* Reports & Statistical Analytics Tab */}
        {activeTab === 'reports' && (
          <ReportsView
            metrics={metrics}
            clusters={clusters}
            documents={documents}
            lang={lang}
          />
        )}

      </main>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadDocument}
        lang={lang}
      />

      {/* Standard Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-700">MetroLens AI</span> — Operational Document Intelligence System
          </div>
          <div className="flex items-center gap-2">
            <span>Kochi Metro Rail Limited</span>
            <span>•</span>
            <span>Active Session: <strong className="text-slate-700 font-semibold">{currentUser.name}</strong> ({currentRole})</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
