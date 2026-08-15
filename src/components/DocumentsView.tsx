import React, { useState } from 'react';
import { 
  Search, 
  UploadCloud, 
  Eye, 
  CheckCircle, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle,
  Copy,
  RotateCcw,
  FileCheck2,
  FileX,
  BadgeAlert,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { OperationalDocument, ExtractedIncident, Language, AuthenticityReport, FileIntegrityReport } from '../types';
import { t } from '../locales/i18n';

interface DocumentsViewProps {
  documents: (OperationalDocument & { authenticity?: AuthenticityReport; integrity?: FileIntegrityReport })[];
  incidents: ExtractedIncident[];
  selectedDocument: (OperationalDocument & { authenticity?: AuthenticityReport; integrity?: FileIntegrityReport }) | null;
  onSelectDocument: (doc: (OperationalDocument & { authenticity?: AuthenticityReport; integrity?: FileIntegrityReport }) | null) => void;
  onOpenUpload: () => void;
  onVerifyIncident: (incidentId: string, correctedFields?: any) => void;
  lang: Language;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  incidents,
  selectedDocument,
  onSelectDocument,
  onOpenUpload,
  onVerifyIncident,
  lang
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAuthFilter, setSelectedAuthFilter] = useState<'ALL' | 'AUTHORIZED' | 'EXTERNAL' | 'DUPLICATE'>('ALL');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isReverifying, setIsReverifying] = useState<boolean>(false);
  const [showFullIntegrity, setShowFullIntegrity] = useState<boolean>(false);

  const stations = Array.from(new Set(documents.map(d => d.stationName))).sort();

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.rawText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStation = selectedStation === 'ALL' || doc.stationName === selectedStation;
    const matchesCategory = selectedCategory === 'ALL' || doc.docCategory === selectedCategory;

    let matchesAuth = true;
    if (selectedAuthFilter === 'AUTHORIZED') {
      matchesAuth = !!doc.integrity?.authorization?.isSystemAuthorized;
    } else if (selectedAuthFilter === 'EXTERNAL') {
      matchesAuth = doc.integrity?.authorization?.isSystemAuthorized === false;
    } else if (selectedAuthFilter === 'DUPLICATE') {
      matchesAuth = doc.authenticity?.status === 'DUPLICATE' || doc.authenticity?.status === 'POTENTIAL_DUPLICATE';
    }

    return matchesSearch && matchesStation && matchesCategory && matchesAuth;
  });

  const activeIncident = selectedDocument 
    ? incidents.find(i => i.documentId === selectedDocument.id) 
    : null;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleReverify = async (docId: string) => {
    setIsReverifying(true);
    try {
      const res = await fetch(`/api/documents/${docId}/verify-authenticity`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (selectedDocument && selectedDocument.id === docId) {
          onSelectDocument({ 
            ...selectedDocument, 
            authenticity: data.authenticity,
            integrity: data.integrity 
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReverifying(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t('documents.title', lang)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {t('documents.description', lang)} — Verified repository of transit shift logs, integrity audits, and defect sheets.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t('documents.uploadButton', lang)}</span>
        </button>
      </div>

      {/* Simplified Search & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap sm:flex-nowrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by title, station, or text..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          />
        </div>

        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700 cursor-pointer"
        >
          <option value="ALL">All Stations</option>
          {stations.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700 cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="STATION_LOG">Station Log</option>
          <option value="MAINTENANCE_SHEET">Maintenance Sheet</option>
          <option value="PASSENGER_COMPLAINT">Passenger Complaint</option>
          <option value="SAFETY_MEMO">Safety Memo</option>
        </select>

        <select
          value={selectedAuthFilter}
          onChange={(e) => setSelectedAuthFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700 cursor-pointer font-medium"
        >
          <option value="ALL">All Integrity States</option>
          <option value="AUTHORIZED">Authorized KMRL Template</option>
          <option value="EXTERNAL">External / Third-Party</option>
          <option value="DUPLICATE">Duplicates</option>
        </select>
      </div>

      {/* Clean Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-4">{t('documents.colDoc', lang)}</th>
                <th className="p-3.5">{t('documents.colStation', lang)}</th>
                <th className="p-3.5">{t('documents.colType', lang)}</th>
                <th className="p-3.5">Integrity & Template</th>
                <th className="p-3.5">Originality</th>
                <th className="p-3.5 pr-4 text-right">{t('documents.colAction', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No documents matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const auth = doc.authenticity;
                  const intg = doc.integrity;
                  const isDup = auth?.status === 'DUPLICATE';
                  const isPotentialDup = auth?.status === 'POTENTIAL_DUPLICATE';
                  const isAuthorized = intg?.authorization?.isSystemAuthorized;
                  const isCorrupt = intg?.status === 'CORRUPT_INVALID';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 pl-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900">{doc.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>{doc.id}</span>
                          <span>•</span>
                          <span>{doc.uploadedAt.split('T')[0]}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700">{doc.stationName}</td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[11px]">
                          {doc.docCategory.replace('_', ' ')}
                        </span>
                      </td>
                      
                      {/* Integrity & Template Column */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isCorrupt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <FileX className="w-3 h-3 text-rose-700" />
                            <span>Corrupted Payload</span>
                          </span>
                        ) : isAuthorized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>{intg?.authorization?.templateId || 'Authorized Template'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <BadgeAlert className="w-3 h-3 text-slate-500" />
                            <span>External / Ad-hoc</span>
                          </span>
                        )}
                      </td>

                      {/* Originality Column */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isDup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <ShieldAlert className="w-3 h-3 text-red-700" />
                            <span>Duplicate (0%)</span>
                          </span>
                        ) : isPotentialDup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-700" />
                            <span>Derivative ({auth?.originalityScore || 30}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Original ({auth?.originalityScore || 100}%)</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-950 font-semibold rounded border border-slate-300 text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-blue-900" />
                          <span>{t('documents.viewButton', lang)}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clean Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedDocument.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedDocument.fileType.toUpperCase()} Format
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {selectedDocument.title}
                </h2>
              </div>
              <button
                onClick={() => onSelectDocument(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Server-Side File Integrity & Template Authorization Card */}
            {selectedDocument.integrity && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                selectedDocument.integrity.status === 'CORRUPT_INVALID'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : selectedDocument.integrity.authorization.isSystemAuthorized
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {selectedDocument.integrity.authorization.isSystemAuthorized ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : selectedDocument.integrity.status === 'CORRUPT_INVALID' ? (
                      <FileX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <BadgeAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-[12px] block">
                        {selectedDocument.integrity.authorization.isSystemAuthorized
                          ? `SYSTEM AUTHORIZED TEMPLATE: ${selectedDocument.integrity.authorization.templateName || selectedDocument.integrity.authorization.templateId}`
                          : selectedDocument.integrity.status === 'CORRUPT_INVALID'
                          ? 'CORRUPT FILE INTEGRITY'
                          : `EXTERNAL / UNAUTHORIZED TEMPLATE (${selectedDocument.integrity.authorization.templateClassification.replace(/_/g, ' ')})`}
                      </span>
                      <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                        {selectedDocument.integrity.auditVerdict}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFullIntegrity(!showFullIntegrity)}
                    className="text-[11px] text-blue-900 underline font-semibold shrink-0 cursor-pointer"
                  >
                    {showFullIntegrity ? 'Hide Details' : 'View Audit Checks'}
                  </button>
                </div>

                {/* Granular Audit Checklist */}
                {showFullIntegrity && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 bg-white/70 p-2.5 rounded-lg">
                    <div className="font-semibold text-[11px] text-slate-800 flex items-center justify-between">
                      <span>Verification Audit Log ({selectedDocument.integrity.detectedFormat}):</span>
                      <span className="font-mono text-[10px] text-slate-500">{selectedDocument.integrity.mimeType}</span>
                    </div>
                    {selectedDocument.integrity.checks.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                        {c.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800">{c.checkName}: </span>
                          <span className="text-slate-600">{c.details}</span>
                        </div>
                      </div>
                    ))}
                    {selectedDocument.integrity.authorization.securityMarker && (
                      <div className="pt-1 text-[10px] font-mono text-emerald-800">
                        Security Token: {selectedDocument.integrity.authorization.securityMarker}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Originality Check Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">
                    Originality Score: {selectedDocument.authenticity?.originalityScore ?? 100}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReverify(selectedDocument.id)}
                  disabled={isReverifying}
                  className="text-blue-900 hover:text-blue-950 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className={`w-3 h-3 ${isReverifying ? 'animate-spin' : ''}`} />
                  <span>{isReverifying ? 'Verifying...' : 'Re-verify'}</span>
                </button>
              </div>

              {selectedDocument.authenticity?.sha256Hash && (
                <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-600">
                  <span className="truncate max-w-[340px]">SHA-256: {selectedDocument.authenticity.sha256Hash}</span>
                  <button
                    onClick={() => selectedDocument.authenticity?.sha256Hash && copyHash(selectedDocument.authenticity.sha256Hash)}
                    className="text-blue-900 hover:text-blue-950 font-sans font-semibold inline-flex items-center gap-0.5 cursor-pointer ml-2"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Report Content */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Content</span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-wrap">
                {selectedDocument.rawText}
              </div>
            </div>

            {/* Key Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Station</span>
                <span className="font-bold text-slate-900">{selectedDocument.stationName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Department</span>
                <span className="font-bold text-slate-900">{selectedDocument.department.replace('_', ' ')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Severity</span>
                <span className="font-bold text-slate-900">{activeIncident?.reportedSeverity || 'MEDIUM'}</span>
              </div>
            </div>

            {/* Recommended Action if present */}
            {activeIncident?.suggestedAction && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium">
                <span className="font-bold block mb-0.5">Recommended Action:</span>
                {activeIncident.suggestedAction}
              </div>
            )}

            {/* Close & Verify Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <CheckCircle className={`w-4 h-4 ${activeIncident?.isVerifiedByHuman ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{activeIncident?.isVerifiedByHuman ? 'Verified by Duty Officer' : 'Pending Duty Officer Verification'}</span>
              </div>

              <div className="flex items-center gap-2">
                {activeIncident && !activeIncident.isVerifiedByHuman && (
                  <button
                    onClick={() => onVerifyIncident(activeIncident.id)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                  >
                    Verify Log
                  </button>
                )}
                <button
                  onClick={() => onSelectDocument(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
