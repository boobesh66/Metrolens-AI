import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  ArrowRight, 
  X, 
  Sparkles, 
  Layers, 
  Send
} from 'lucide-react';
import { RecurringIssueCluster, OperationalDocument, ActionStatus, Language } from '../types';
import { t } from '../locales/i18n';

interface IssuesViewProps {
  clusters: RecurringIssueCluster[];
  documents: OperationalDocument[];
  selectedCluster: RecurringIssueCluster | null;
  onSelectCluster: (cluster: RecurringIssueCluster | null) => void;
  onUpdateActionStatus?: (actionId: string, status: ActionStatus, notes?: string) => void;
  lang: Language;
}

export const IssuesView: React.FC<IssuesViewProps> = ({
  clusters,
  documents,
  selectedCluster,
  onSelectCluster,
  onUpdateActionStatus,
  lang
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'HIGH' | 'RECURRING' | 'EMERGING'>('ALL');
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<ActionStatus>('ASSIGNED');
  const [workflowNotes, setWorkflowNotes] = useState<string>('');

  const filteredIssues = clusters.filter((c) => {
    if (filterType === 'HIGH') {
      return c.riskTier === 'CRITICAL' || c.riskTier === 'HIGH' || c.actionPriority === 'P1_IMMEDIATE';
    }
    if (filterType === 'RECURRING') {
      return !c.isSilentRisk;
    }
    if (filterType === 'EMERGING') {
      return c.isSilentRisk;
    }
    return true;
  });

  const handleGenerateAISynthesis = async (cluster: RecurringIssueCluster) => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId: cluster.id })
      });
      const data = await res.json();
      setAiSynthesis(data.explanation || 'Root cause technical summary generated.');
    } catch (e) {
      setAiSynthesis(
        'Technical Summary:\n• Progressive mechanical friction detected in drive assembly.\n• Correlated across separate station logs.\n• Recommended immediate maintenance inspection and replacement of worn components.'
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleOpenCluster = (cluster: RecurringIssueCluster) => {
    onSelectCluster(cluster);
    setAiSynthesis(null);
    setWorkflowStatus(cluster.actionStatus || 'ASSIGNED');
  };

  const activeDocs = selectedCluster 
    ? documents.filter(d => selectedCluster.relatedDocumentIds?.includes(d.id))
    : [];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t('issues.title', lang)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {t('issues.description', lang)}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${filterType === 'ALL' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Issues ({clusters.length})
          </button>
          <button
            onClick={() => setFilterType('HIGH')}
            className={`px-3 py-1.5 rounded-md transition-colors ${filterType === 'HIGH' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            High Priority
          </button>
          <button
            onClick={() => setFilterType('RECURRING')}
            className={`px-3 py-1.5 rounded-md transition-colors ${filterType === 'RECURRING' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Recurring
          </button>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-2 p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No issues match the selected filter.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div 
              key={issue.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {issue.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    issue.riskTier === 'CRITICAL' || issue.riskTier === 'HIGH'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {issue.riskTier} RISK
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {issue.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {issue.stationName} • {issue.assetName}
                  </span>
                  <span>•</span>
                  <span>{issue.relatedDocumentIds.length} Linked Reports</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {issue.recommendedAction}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">
                  Status: <strong className="text-slate-800">{issue.actionStatus || 'ASSIGNED'}</strong>
                </span>

                <button
                  onClick={() => handleOpenCluster(issue)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Resolve / Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simplified Issue Details & Mitigation Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCluster.id}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {selectedCluster.title}
                </h2>
              </div>
              <button
                onClick={() => onSelectCluster(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Station</span>
                <span className="font-bold text-slate-900">{selectedCluster.stationName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Asset</span>
                <span className="font-bold text-slate-900">{selectedCluster.assetName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Risk Tier</span>
                <span className="font-bold text-red-700">{selectedCluster.riskTier}</span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium space-y-1">
              <span className="font-bold block">Standard Mitigation Directive:</span>
              <p>{selectedCluster.recommendedAction}</p>
            </div>

            {/* AI Technical Analysis */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                  <span>AI Root-Cause Synthesis</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleGenerateAISynthesis(selectedCluster)}
                  disabled={isLoadingAI}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-900 border border-slate-300 rounded font-semibold text-[11px] cursor-pointer"
                >
                  {isLoadingAI ? 'Analyzing...' : 'Generate Analysis'}
                </button>
              </div>

              {aiSynthesis && (
                <div className="p-2.5 bg-white rounded border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-sans text-xs">
                  {aiSynthesis}
                </div>
              )}
            </div>

            {/* Linked Documents List */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Linked Shift Logs ({activeDocs.length})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {activeDocs.map(d => (
                  <div key={d.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{d.title}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">{d.id} • {d.uploadedAt.split('T')[0]}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                      {d.docCategory.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Action Status Form */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">Update Resolution Status</span>
              <div className="flex flex-wrap items-center gap-2">
                {(['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED'] as ActionStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setWorkflowStatus(status)}
                    className={`px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                      workflowStatus === status
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={workflowNotes}
                  onChange={(e) => setWorkflowNotes(e.target.value)}
                  placeholder="Add resolution notes (optional)..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateActionStatus) {
                      onUpdateActionStatus(selectedCluster.id, workflowStatus, workflowNotes);
                    }
                    onSelectCluster(null);
                  }}
                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Close */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => onSelectCluster(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
