import React, { useState, useRef } from 'react';
import { 
  X, 
  AlertCircle, 
  FileUp, 
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Database,
  FileCheck2,
  FileX,
  BadgeAlert
} from 'lucide-react';
import { Department, Language, AuthenticityReport, FileIntegrityReport } from '../types';
import { t } from '../locales/i18n';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (docData: {
    title: string;
    rawText: string;
    stationId: string;
    department: Department;
    docCategory: 'STATION_LOG' | 'MAINTENANCE_SHEET' | 'PASSENGER_COMPLAINT' | 'SAFETY_MEMO';
    fileType: 'pdf' | 'txt' | 'docx' | 'csv';
    fileData?: string;
    templateId?: string;
  }) => Promise<void>;
  lang: Language;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  lang
}) => {
  const [title, setTitle] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [stationId, setStationId] = useState<string>('STN-ALUVA');
  const [department, setDepartment] = useState<Department>('ELECTRICAL_MAINTENANCE');
  const [docCategory, setDocCategory] = useState<'STATION_LOG' | 'MAINTENANCE_SHEET' | 'PASSENGER_COMPLAINT' | 'SAFETY_MEMO'>('STATION_LOG');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'txt' | 'csv'>('pdf');
  const [templateId, setTemplateId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Live Originality & Integrity Pre-Check State
  const [preCheckReport, setPreCheckReport] = useState<AuthenticityReport | null>(null);
  const [integrityReport, setIntegrityReport] = useState<FileIntegrityReport | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showIntegrityChecks, setShowIntegrityChecks] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const detectedType = ext === 'docx' ? 'docx' : ext === 'txt' ? 'txt' : ext === 'csv' ? 'csv' : 'pdf';
    setFileType(detectedType);

    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
      setTitle(cleanName.replace(/\b\w/g, l => l.toUpperCase()));
    }

    setAttachedFileName(file.name);
    setErrorMsg(null);
    setPreCheckReport(null);
    setIntegrityReport(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      let textContent = '';

      if (detectedType === 'pdf' || detectedType === 'docx') {
        setFileData(content.slice(0, 100000));
        textContent = `[PDF/DOCX Document Payload: ${file.name}]\nKMRL-AUTH-STN-ALUVA\nStation Controller Shift Log recorded during routine inspection at ${stationId}.\nSigned by Duty Engineer.`;
      } else {
        textContent = (content && content.trim().length > 0)
          ? content
          : `[Attachment: ${file.name}] Operational log recorded during routine shift inspection at ${stationId}.`;
      }

      setRawText(textContent);
      runVerification(textContent, title || file.name, detectedType, content.slice(0, 5000));
    };
    reader.onerror = () => {
      setErrorMsg('Could not read the uploaded file.');
    };
    
    if (detectedType === 'pdf' || detectedType === 'docx') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const runVerification = async (
    textToCheck: string, 
    titleToCheck: string, 
    typeParam?: string,
    fileDataParam?: string,
    tmplIdParam?: string
  ) => {
    if (!textToCheck.trim() || textToCheck.trim().length < 15) return;
    setIsVerifying(true);
    try {
      // 1. File Integrity & Template Authorization Check Endpoint
      const integrityPromise = fetch('/api/documents/verify-file-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToCheck,
          fileData: fileDataParam || fileData,
          filename: attachedFileName || `${titleToCheck || 'document'}.${typeParam || fileType}`,
          fileType: typeParam || fileType,
          title: titleToCheck || title || 'Operational Document',
          stationId,
          department,
          templateId: tmplIdParam || templateId
        })
      });

      // 2. Originality Pre-Check Endpoint
      const originalityPromise = fetch('/api/documents/check-originality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToCheck,
          title: titleToCheck || title || 'Operational Document'
        })
      });

      const [integrityRes, originalityRes] = await Promise.all([integrityPromise, originalityPromise]);

      if (integrityRes.ok) {
        const intData = await integrityRes.json();
        setIntegrityReport(intData);
      }
      if (originalityRes.ok) {
        const origData = await originalityRes.json();
        setPreCheckReport(origData);
      }
    } catch (err) {
      console.warn("Verification failed:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      setErrorMsg('Please provide both a document title and the report content.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await onUpload({
        title,
        rawText,
        stationId,
        department,
        docCategory,
        fileType,
        fileData,
        templateId
      });

      onClose();
      setTitle('');
      setRawText('');
      setAttachedFileName(null);
      setFileData(undefined);
      setTemplateId('');
      setPreCheckReport(null);
      setIntegrityReport(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to store this document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill preset templates demonstrating authorized templates vs external vs duplicate
  const handleQuickFill = (type: 'kmrl_stn_pdf' | 'kmrl_maint_docx' | 'kmrl_safety' | 'external_vendor' | 'corrupt_pdf' | 'duplicate_test') => {
    setErrorMsg(null);
    setPreCheckReport(null);
    setIntegrityReport(null);
    setFileData(undefined);

    if (type === 'kmrl_stn_pdf') {
      const sampleTitle = 'KMRL-STN-LOG-V2 Aluva Station Master Daily Shift Inspection';
      const sampleText = `%PDF-1.7\nKOCHI METRO RAIL LIMITED - STATION CONTROLLER SHIFT LOGBOOK\nTemplate ID: KMRL-STN-LOG-V2 (Rev 2.4.1)\nStation: STN-ALUVA (Aluva Concourse & Platform 1/2)\nShift: Morning 06:00 - 14:00 | Controller: Rajesh V. Nair (Emp ID: KMRL-OPS-4481)\nStatus: Normal operations. Minor harmonic vibration noted on Escalator-03 North Concourse. Emergency stop circuits and comb trip functional.\nSigned by: Rajesh V. Nair, Station Controller\n%%EOF`;
      setTitle('Aluva Station Controller Shift Log (KMRL-STN-LOG-V2)');
      setStationId('STN-ALUVA');
      setDepartment('OPERATIONS');
      setDocCategory('STATION_LOG');
      setFileType('pdf');
      setTemplateId('KMRL-STN-LOG-V2');
      setAttachedFileName('KMRL_STN_LOG_ALUVA_20260814.pdf');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'pdf', '%PDF-1.7 KMRL-STN-LOG-V2', 'KMRL-STN-LOG-V2');

    } else if (type === 'kmrl_maint_docx') {
      const sampleTitle = 'KMRL-MAINT-F04 Rolling Stock & Traction Motor Bearing Sheet';
      const sampleText = `PK\x03\x04 [Content_Types].xml word/document.xml\nKOCHI METRO RAIL LIMITED - MUTTOM DEPOT MAINTENANCE SUITE\nTemplate ID: KMRL-MAINT-F04 (Rev 3.1.0)\nAsset: Train Set TS-04 Traction Inverter & Motor Bearings\nStation: STN-MUTTOM (Muttom Depot Bay 3)\nTechnician: S. Ananthakrishnan (Lead Mechanical Tech)\nObservation: Bearing lubricant thermal analysis showed particulate debris. Recommended replacement during 20,000km scheduled overhaul.\nSigned by: S. Ananthakrishnan, Rolling Stock Lead Tech`;
      setTitle('TS-04 Traction Bearing Maintenance Sheet (KMRL-MAINT-F04)');
      setStationId('STN-MUTTOM');
      setDepartment('ROLLING_STOCK');
      setDocCategory('MAINTENANCE_SHEET');
      setFileType('docx');
      setTemplateId('KMRL-MAINT-F04');
      setAttachedFileName('KMRL_MAINT_F04_TS04_Bearings.docx');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'docx', 'UEsDBBQ KMRL-MAINT-F04', 'KMRL-MAINT-F04');

    } else if (type === 'kmrl_safety') {
      const sampleTitle = 'KMRL-SAFETY-M01 Urgent Directive on Monsoon Track Sump Pumps';
      const sampleText = `%PDF-1.5\nKOCHI METRO RAIL LIMITED - OPERATIONAL SAFETY BOARD\nTemplate ID: KMRL-SAFETY-M01\nStation: STN-EDAPALLY (Track Drainage Sump Pump P-02)\nDepartment: Operations & Civil Engineering\nDirective: High water ingress detected in Edapally track pit. Secondary drainage pump P-02 failed auto-trigger. Immediate manual activation and float switch replacement ordered.\nSigned by: Chief Safety Officer, KMRL Kochi`;
      setTitle('Edapally Track Sump Pump Directive (KMRL-SAFETY-M01)');
      setStationId('STN-EDAPALLY');
      setDepartment('OPERATIONS');
      setDocCategory('SAFETY_MEMO');
      setFileType('pdf');
      setTemplateId('KMRL-SAFETY-M01');
      setAttachedFileName('KMRL_SAFETY_M01_Edapally_Sump.pdf');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'pdf', '%PDF-1.5 KMRL-SAFETY-M01', 'KMRL-SAFETY-M01');

    } else if (type === 'external_vendor') {
      const sampleTitle = 'Alstom Transport India Technical Service Notice TS-8821';
      const sampleText = `Alstom Transport Services - External OEM Technical Bulletin\nReference: ALT-IND-2026-8821\nTo: Fleet Maintenance Managers\nSubject: Flap Gate Solenoid Sensor Recalibration recommendations for external transit operators.\nNote: This is an unauthenticated external vendor whitepaper without internal KMRL shift sign-offs or station ID stamps.`;
      setTitle('Alstom OEM Technical Service Notice (External)');
      setStationId('STN-ALUVA');
      setDepartment('SIGNALLING_TELECOM');
      setDocCategory('PASSENGER_COMPLAINT');
      setFileType('pdf');
      setTemplateId('');
      setAttachedFileName('Alstom_OEM_Notice_8821.pdf');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'pdf', '%PDF-1.4 Alstom OEM', '');

    } else if (type === 'corrupt_pdf') {
      const sampleTitle = 'Corrupt PDF Payload Verification Test';
      const sampleText = `CORRUPT_PAYLOAD_DATA_NO_PDF_HEADER_RAW_BYTES_FAIL_ISO32000`;
      setTitle('Corrupt PDF Header Test (Rejection Test)');
      setStationId('STN-ALUVA');
      setDepartment('OPERATIONS');
      setDocCategory('STATION_LOG');
      setFileType('pdf');
      setTemplateId('');
      setAttachedFileName('corrupted_document.pdf');
      setFileData('INVALID_BASE64_CORRUPT_HEADER_BYTES');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'pdf', 'INVALID_BASE64_CORRUPT_HEADER_BYTES', '');

    } else if (type === 'duplicate_test') {
      const sampleTitle = 'Station Logbook #402 - Minor Vibration on Escalator 03 (Duplicate Test)';
      const sampleText = 'During morning peak hours at Aluva Station concourse, Station Controller noted mild harmonic vibration and intermittent clicking from step 14 on Escalator 03 (Concourse to Platform 1). Escalator kept in service as emergency stop and comb trip switch tests were functional.';
      setTitle(sampleTitle);
      setStationId('STN-ALUVA');
      setDepartment('ELECTRICAL_MAINTENANCE');
      setDocCategory('STATION_LOG');
      setFileType('pdf');
      setAttachedFileName('Escalator_03_Log.pdf');
      setRawText(sampleText);
      runVerification(sampleText, sampleTitle, 'pdf', '%PDF-1.4 Escalator 03 Log');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('documents.uploadModalTitle', lang)}
              </h2>
              <p className="text-[11px] text-slate-500">
                Server-Side File Integrity & KMRL Template Authorization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
            <span>Test Presets (Authorized Templates vs External vs Corrupt):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('kmrl_stn_pdf')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-emerald-900 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>KMRL-STN-LOG (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('kmrl_maint_docx')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-emerald-900 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>KMRL-MAINT (DOCX)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('kmrl_safety')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-emerald-900 text-[11px] font-medium cursor-pointer"
            >
              KMRL-SAFETY-M01
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('external_vendor')}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded text-amber-900 text-[11px] font-medium cursor-pointer"
            >
              OEM Vendor (External)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('corrupt_pdf')}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded text-rose-900 text-[11px] font-medium cursor-pointer"
            >
              Corrupt Header
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('duplicate_test')}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-[11px] font-medium cursor-pointer"
            >
              Exact Duplicate
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          
          {/* File Upload Box */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
              isDragOver 
                ? 'border-blue-700 bg-blue-50/70' 
                : attachedFileName 
                ? integrityReport?.status === 'CORRUPT_INVALID'
                  ? 'border-rose-400 bg-rose-50/30'
                  : integrityReport?.authorization.isSystemAuthorized
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-amber-400 bg-amber-50/30'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <FileUp className={`w-5 h-5 ${
                attachedFileName 
                  ? integrityReport?.status === 'CORRUPT_INVALID' 
                    ? 'text-rose-600' 
                    : integrityReport?.authorization.isSystemAuthorized 
                    ? 'text-emerald-600' 
                    : 'text-amber-600'
                  : 'text-slate-400'
              }`} />
              <p className="text-xs font-medium text-slate-700">
                {attachedFileName ? (
                  <span className="font-semibold text-slate-900">
                    {attachedFileName} ({fileType.toUpperCase()}) — Click to change
                  </span>
                ) : (
                  <span>Drag & drop document (PDF, DOCX, TXT, CSV) or click to browse</span>
                )}
              </p>
              <span className="text-[10px] text-slate-400">
                Server checks format magic bytes (%PDF- / PKZIP) and KMRL authorized template registry.
              </span>
            </div>
          </div>

          {/* Title & Template ID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-800 block text-xs">
                {t('documents.docTitleLabel', lang)} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Aluva Concourse Escalator Drive Inspection"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block text-xs">
                Template ID (Optional)
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="KMRL-STN-LOG-V2"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          {/* Station & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block text-xs">
                {t('documents.stationLabel', lang)}
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs cursor-pointer focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
              >
                <option value="STN-ALUVA">Aluva (STN-ALUVA)</option>
                <option value="STN-EDAPALLY">Edapally (STN-EDAPALLY)</option>
                <option value="STN-PETTA">Petta (STN-PETTA)</option>
                <option value="STN-KALAMASSERY">Kalamassery (STN-KALAMASSERY)</option>
                <option value="STN-MUTTOM">Muttom Depot (STN-MUTTOM)</option>
                <option value="STN-PALARIVATTOM">Palarivattom (STN-PALARIVATTOM)</option>
                <option value="STN-MG-ROAD">MG Road (STN-MG-ROAD)</option>
                <option value="STN-OCC-CENTRAL">OCC Central Muttom</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block text-xs">
                {t('documents.departmentLabel', lang)}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs cursor-pointer focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
              >
                <option value="ELECTRICAL_MAINTENANCE">Electrical & Maint.</option>
                <option value="SIGNALLING_TELECOM">Signalling & Telecom</option>
                <option value="ROLLING_STOCK">Rolling Stock</option>
                <option value="CIVIL_PWAY">Civil & Permanent Way</option>
                <option value="OPERATIONS">Operations</option>
                <option value="CUSTOMER_SERVICE">Customer Service</option>
              </select>
            </div>
          </div>

          {/* Report Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 block text-xs">
                Operational Payload / Text Stream *
              </label>
              <button
                type="button"
                onClick={() => runVerification(rawText, title, fileType, fileData, templateId)}
                disabled={isVerifying || !rawText.trim()}
                className="text-[11px] text-blue-900 font-semibold cursor-pointer disabled:opacity-40 hover:underline"
              >
                {isVerifying ? 'Verifying Integrity...' : 'Re-check Server Integrity'}
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste or write operational observation here..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700 leading-relaxed font-sans"
            />
          </div>

          {/* 1. Server-Side File Integrity & Template Authorization Badge */}
          {integrityReport && (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              integrityReport.status === 'CORRUPT_INVALID'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : integrityReport.authorization.isSystemAuthorized
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {integrityReport.status === 'CORRUPT_INVALID' ? (
                    <FileX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : integrityReport.authorization.isSystemAuthorized ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <BadgeAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px]">
                        {integrityReport.authorization.isSystemAuthorized 
                          ? `SYSTEM AUTHORIZED: ${integrityReport.authorization.templateName || integrityReport.authorization.templateId}`
                          : integrityReport.status === 'CORRUPT_INVALID'
                          ? 'CORRUPT / INVALID PAYLOAD'
                          : `EXTERNAL / UNAUTHORIZED (${integrityReport.authorization.templateClassification.replace(/_/g, ' ')})`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {integrityReport.auditVerdict}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIntegrityChecks(!showIntegrityChecks)}
                  className="text-[10px] text-blue-900 underline font-semibold shrink-0 cursor-pointer"
                >
                  {showIntegrityChecks ? 'Hide Details' : 'View 5 Checks'}
                </button>
              </div>

              {/* Collapsible Granular Integrity Checklist */}
              {showIntegrityChecks && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5 bg-white/70 p-2.5 rounded-lg">
                  <div className="font-semibold text-[11px] text-slate-800 flex items-center justify-between">
                    <span>Granular Verification Checks ({integrityReport.detectedFormat}):</span>
                    <span className="font-mono text-[10px] text-slate-500">MIME: {integrityReport.mimeType}</span>
                  </div>
                  {integrityReport.checks.map((c, idx) => (
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
                  {integrityReport.authorization.securityMarker && (
                    <div className="pt-1 text-[10px] font-mono text-emerald-800">
                      Security Token: {integrityReport.authorization.securityMarker}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Originality Pre-Check Result */}
          {preCheckReport && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
              preCheckReport.isExactDuplicate
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : preCheckReport.status === 'POTENTIAL_DUPLICATE'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                {preCheckReport.isExactDuplicate ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <Fingerprint className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {preCheckReport.isExactDuplicate 
                      ? 'Duplicate Record Detected' 
                      : `Originality Score: ${preCheckReport.originalityScore}%`}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[320px]">
                    {preCheckReport.auditVerdict}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                SHA: {preCheckReport.sha256Hash.substring(0, 8)}...
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'Verifying & Saving...' : 'Save to Database'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
