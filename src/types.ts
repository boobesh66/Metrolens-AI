export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  stationName: string;
  stationId: string;
  department: Department;
  lastLogin?: string;
}

export type Language = 'en' | 'ml';

export type Department = 
  | 'ELECTRICAL_MAINTENANCE' 
  | 'SIGNALLING_TELECOM' 
  | 'ROLLING_STOCK' 
  | 'CIVIL_PWAY' 
  | 'OPERATIONS' 
  | 'CUSTOMER_SERVICE';

export type AssetCategory = 
  | 'ESCALATOR' 
  | 'ELEVATOR' 
  | 'AFC_GATE' 
  | 'TRAIN_DOOR' 
  | 'SIGNALLING' 
  | 'HVAC' 
  | 'TRACK_PWAY'
  | 'POWER_SUPPLY';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionPriority = 'P1_IMMEDIATE' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE';
export type Priority = ActionPriority;

export type ActionStatus = 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export type TrendDirection = 'INCREASING' | 'STABLE' | 'DECREASING';

export type AuthenticityStatus = 
  | 'ORIGINAL' 
  | 'DIGITALLY_VERIFIED' 
  | 'POTENTIAL_DUPLICATE' 
  | 'DUPLICATE' 
  | 'TAMPERED_MODIFIED';

export type TemplateClassification = 
  | 'AUTHORIZED_KMRL_TEMPLATE' 
  | 'EXTERNAL_THIRD_PARTY' 
  | 'UNSTRUCTURED_GENERIC' 
  | 'UNAUTHORIZED_ANOMALY';

export type FileIntegrityStatus = 
  | 'AUTHORIZED' 
  | 'EXTERNAL_UNAUTHORIZED' 
  | 'CORRUPT_INVALID' 
  | 'FORMAT_WARNING';

export interface IntegrityCheckItem {
  checkName: string;
  passed: boolean;
  category: 'FILE_HEADER' | 'STRUCTURE' | 'METADATA_AUTH' | 'STATION_COMPLIANCE' | 'SIGNATURE';
  details: string;
}

export interface FileIntegrityReport {
  status: FileIntegrityStatus;
  isValidFormat: boolean;
  detectedFormat: 'PDF' | 'DOCX' | 'TXT' | 'CSV' | 'UNKNOWN';
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  authorization: {
    isSystemAuthorized: boolean;
    templateClassification: TemplateClassification;
    templateId?: string;
    templateName?: string;
    templateVersion?: string;
    issuingAuthority?: string;
    securityMarker?: string;
  };
  metadata: {
    title?: string;
    authorOrSignoff?: string;
    creatorTool?: string;
    stationCode?: string;
    stationName?: string;
    department?: string;
    creationDate?: string;
    pageOrSectionCount?: number;
    hasDigitalSignature?: boolean;
  };
  checks: IntegrityCheckItem[];
  warnings: string[];
  auditVerdict: string;
  checkedAt: string;
}

export interface AuthenticityReport {
  status: AuthenticityStatus;
  originalityScore: number; // 0 - 100
  sha256Hash: string;
  isExactDuplicate: boolean;
  duplicateOfDocId?: string;
  duplicateOfTitle?: string;
  highestSimilarity: number; // 0.0 - 1.0
  matchedDocId?: string;
  matchedDocTitle?: string;
  overlapHighlights?: string[];
  provenanceCheck: {
    hasValidLogHeader: boolean;
    hasAuthorSignoff: boolean;
    hasValidStationRef: boolean;
    hasTimestampAudit: boolean;
  };
  auditVerdict: string;
  checkedAt: string;
}

export interface OperationalDocument {
  id: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'txt' | 'docx' | 'csv';
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  stationId: string;
  stationName: string;
  department: Department;
  rawText: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  isSyntheticDemo: boolean;
  docCategory: 'STATION_LOG' | 'MAINTENANCE_SHEET' | 'PASSENGER_COMPLAINT' | 'SAFETY_MEMO' | 'VENDOR_REPORT';
  authenticity?: AuthenticityReport;
  integrity?: FileIntegrityReport;
}

export interface ExtractedIncident {
  id: string;
  documentId: string;
  documentTitle?: string;
  stationId: string;
  stationName: string;
  assetId: string;
  assetName: string;
  assetCategory: AssetCategory;
  incidentDate: string;
  reportedSeverity: Severity;
  department: Department;
  description: string;
  symptoms: string[];
  suggestedAction: string;
  extractedConfidence: number; // 0.0 - 1.0
  isVerifiedByHuman: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface SimilarityLink {
  sourceDocId: string;
  targetDocId: string;
  sourceTitle: string;
  targetTitle: string;
  cosineSimilarity: number;
  sharedKeywords: string[];
  sharedAsset: string;
  daysDifference: number;
}

export interface RecurringIssueCluster {
  id: string;
  title: string;
  stationId: string;
  stationName: string;
  assetId: string;
  assetName: string;
  assetCategory: AssetCategory;
  department: Department;
  relatedDocumentIds: string[];
  relatedIncidentIds: string[];
  reportCount: number;
  firstReportedDate: string;
  lastReportedDate: string;
  timeSpanDays: number;
  frequencyTrend: TrendDirection;
  averageCosineSimilarity: number;
  prototypeRiskScore: number; // 0 - 100
  riskTier: Severity;
  isSilentRisk: boolean; // Flagged if low individual severity + accelerating frequency
  symptoms: string[];
  explanation: {
    factors: string[];
    formulaCalculation: string;
    keyTermsMatched: string[];
    riskBreakdown: {
      frequencyPoints: number;
      velocityPoints: number;
      severityPoints: number;
      assetCriticalityPoints: number;
      similarityPoints: number;
    };
  };
  recommendedAction: string;
  actionPriority: ActionPriority;
  isVerifiedByHuman: boolean;
  verifiedBy?: string;
  actionId?: string;
  actionStatus?: ActionStatus;
}

export interface OperationalAction {
  id: string;
  clusterId: string;
  title: string;
  assetName: string;
  stationName: string;
  department: Department;
  priority: ActionPriority;
  status: ActionStatus;
  assignedTo: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  sourceDocumentIds: string[];
  resolvedAt?: string;
}

export interface DashboardMetrics {
  totalDocuments: number;
  processedDocuments: number;
  recurringClustersCount: number;
  silentRisksCount: number;
  pendingActionsCount: number;
  highOrCriticalCount: number;
  averageRiskScore: number;
  stationStats: {
    stationName: string;
    totalReports: number;
    activeClusters: number;
    riskScore: number;
  }[];
  departmentStats: {
    department: Department;
    count: number;
  }[];
  temporalTrend: {
    month: string;
    totalIncidents: number;
    recurringClusters: number;
    silentRisks: number;
  }[];
  recentClusters: RecurringIssueCluster[];
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  station: string;
  asset: string;
  documentCount: number;
  expectedOutcome: string;
  documents: {
    title: string;
    filename: string;
    docCategory: OperationalDocument['docCategory'];
    department: Department;
    date: string;
    text: string;
    severity: Severity;
  }[];
}
