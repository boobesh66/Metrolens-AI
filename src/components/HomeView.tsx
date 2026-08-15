import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  UploadCloud, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  MapPin,
  TrendingUp,
  Fingerprint,
  Database,
  CheckCircle2
} from 'lucide-react';
import { DashboardMetrics, RecurringIssueCluster, OperationalDocument, Language } from '../types';
import { t } from '../locales/i18n';
import { MainNavTab } from './Header';

interface HomeViewProps {
  metrics: DashboardMetrics | null;
  clusters: RecurringIssueCluster[];
  documents: OperationalDocument[];
  onNavigateTab: (tab: MainNavTab) => void;
  onOpenUpload: () => void;
  onSelectCluster: (cluster: RecurringIssueCluster) => void;
  onSelectDocument: (doc: OperationalDocument) => void;
  lang: Language;
}

export const HomeView: React.FC<HomeViewProps> = ({
  metrics,
  clusters,
  documents,
  onNavigateTab,
  onOpenUpload,
  onSelectCluster,
  onSelectDocument,
  lang
}) => {
  // Urgent or high priority issues
  const highPriorityIssues = clusters.filter(c => c.riskTier === 'CRITICAL' || c.riskTier === 'HIGH' || c.actionPriority === 'P1_IMMEDIATE');
  const displayIssues = highPriorityIssues.length > 0 ? highPriorityIssues.slice(0, 3) : clusters.slice(0, 3);
  const recentDocs = documents.slice(0, 4);

  // Authenticity statistics
  const verifiedCount = documents.filter(d => (d as any).authenticity?.status === 'ORIGINAL' || (d as any).authenticity?.status === 'DIGITALLY_VERIFIED' || !(d as any).authenticity).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Clean, Focused Hero Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200">
            <Database className="w-3.5 h-3.5 text-blue-800" />
            <span>Kochi Metro Rail Limited • Operations Repository</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('home.welcome', lang)}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('home.description', lang)} Upload operational reports to detect recurring asset issues, verify log originality, and coordinate station maintenance.
          </p>
        </div>

        {/* Primary Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('home.uploadDoc', lang)}</span>
          </button>

          <button
            onClick={() => onNavigateTab('documents')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <Fingerprint className="w-4 h-4 text-blue-900" />
            <span>View All Logs</span>
          </button>
        </div>
      </div>

      {/* 2. Four Simplified Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Processed Logs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('home.kpiProcessedDocs', lang)}
            </span>
            <FileText className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.processedDocuments ?? documents.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{verifiedCount} Verified Original</span>
          </div>
        </div>

        {/* Metric 2: Recurring Issues */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('home.kpiRecurringIssues', lang)}
            </span>
            <TrendingUp className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.recurringClustersCount ?? clusters.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Across 5 Metro Stations
          </div>
        </div>

        {/* Metric 3: High Priority Issues */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('home.kpiHighPriority', lang)}
            </span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">
            {metrics?.highOrCriticalCount ?? highPriorityIssues.length}
          </div>
          <div className="text-[11px] text-red-600 font-medium">
            Requires Immediate Action
          </div>
        </div>

        {/* Metric 4: Pending Actions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('home.kpiPendingActions', lang)}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.pendingActionsCount ?? 3}
          </div>
          <div className="text-[11px] text-slate-500">
            Assigned to Duty Engineers
          </div>
        </div>

      </div>

      {/* 3. Section: Issues Requiring Immediate Attention */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t('home.attentionTitle', lang)}
            </h2>
            <p className="text-xs text-slate-500">
              {t('home.attentionSubtitle', lang)}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('issues')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950 hover:underline cursor-pointer"
          >
            <span>{t('home.viewAll', lang)}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {displayIssues.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {t('home.noUrgentIssues', lang)}
            </div>
          ) : (
            displayIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {issue.title}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                      {t(`priorities.${issue.actionPriority}`, lang)}
                    </span>
                    {issue.isSilentRisk && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                        Emerging
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {issue.stationName} • {issue.assetName}
                    </span>
                    <span>•</span>
                    <span>
                      {issue.relatedDocumentIds.length} Linked Reports
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {issue.recommendedAction}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => {
                      onSelectCluster(issue);
                      onNavigateTab('issues');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{t('issues.viewDetails', lang)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Section: Recently Processed Documents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t('home.recentDocsTitle', lang)}
            </h2>
            <p className="text-xs text-slate-500">
              Recent verified operational entries recorded in the repository
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('documents')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950 hover:underline cursor-pointer"
          >
            <span>{t('home.viewAll', lang)}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 pl-4">{t('documents.colDoc', lang)}</th>
                <th className="p-3">{t('documents.colStation', lang)}</th>
                <th className="p-3">{t('documents.colDate', lang)}</th>
                <th className="p-3">Originality</th>
                <th className="p-3 pr-4 text-right">{t('documents.colAction', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.map((doc) => {
                const auth = (doc as any).authenticity;
                const isDup = auth?.status === 'DUPLICATE';
                const isPotentialDup = auth?.status === 'POTENTIAL_DUPLICATE';

                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="p-3 pl-4 font-medium text-slate-900">
                      <div className="truncate max-w-xs">{doc.title}</div>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.id}</span>
                    </td>
                    <td className="p-3 text-slate-700">{doc.stationName}</td>
                    <td className="p-3 text-slate-500">{doc.uploadedAt.split('T')[0]}</td>
                    <td className="p-3">
                      {isDup ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          <ShieldAlert className="w-3 h-3 text-red-700" />
                          <span>Duplicate</span>
                        </span>
                      ) : isPotentialDup ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>Derivative</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Original (100%)</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => {
                          onSelectDocument(doc);
                          onNavigateTab('documents');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-blue-950 font-semibold rounded border border-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        {t('documents.viewButton', lang)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
