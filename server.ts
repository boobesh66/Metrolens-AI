import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { 
  OperationalDocument, 
  ExtractedIncident, 
  RecurringIssueCluster, 
  OperationalAction,
  DashboardMetrics 
} from "./src/types.js";
import { 
  extractEntitiesFromText, 
  clusterIncidents, 
  generateGeminiRootCauseAnalysis 
} from "./server/mlEngine.js";
import { db } from "./server/database.js";
import { 
  verifyFileIntegrity, 
  KNOWN_KMRL_TEMPLATES, 
  VALID_STATION_CODES 
} from "./server/integrityEngine.js";

dotenv.config();

// Helper to recalculate clusters and persist to database
function refreshClusterData() {
  const docs = db.getDocuments();
  const incs = db.getIncidents();
  const result = clusterIncidents(docs, incs, 0.65);
  if (result.clusters.length > 0) {
    db.setClusters(result.clusters);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // --------------------------------------------------------------------------
  // REST API ROUTES
  // --------------------------------------------------------------------------

  // 1. Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      service: "MetroLens AI Core Engine", 
      version: "2.1.0-ADS",
      timestamp: new Date().toISOString() 
    });
  });

  // 1a. Database Status and Integrity Ledger
  app.get("/api/database/status", (_req: Request, res: Response) => {
    res.json(db.getDatabaseStatus());
  });

  // 1b. Server-Side File Integrity Check & Template Authorization Endpoint
  app.post("/api/documents/verify-file-integrity", (req: Request, res: Response) => {
    const { rawText, fileData, filename, fileType, title, stationId, department, templateId } = req.body;
    
    if (!rawText && !fileData) {
      return res.status(400).json({ 
        error: "Either rawText or fileData payload is required for file integrity verification." 
      });
    }

    const integrityReport = verifyFileIntegrity({
      rawText: rawText || '',
      fileData: fileData || '',
      filename: filename || (title ? `${title.toLowerCase().replace(/\s+/g, '_')}.${fileType || 'pdf'}` : 'operational_log.pdf'),
      fileType: fileType || 'pdf',
      title: title || 'Operational Document',
      stationId,
      department,
      templateId
    });

    res.json(integrityReport);
  });

  // Alias endpoint for checking integrity
  app.post("/api/documents/check-integrity", (req: Request, res: Response) => {
    const { rawText, fileData, filename, fileType, title, stationId, department, templateId } = req.body;
    const integrityReport = verifyFileIntegrity({
      rawText: rawText || '',
      fileData: fileData || '',
      filename: filename || (title ? `${title.toLowerCase().replace(/\s+/g, '_')}.${fileType || 'pdf'}` : 'operational_log.pdf'),
      fileType: fileType || 'pdf',
      title: title || 'Operational Document',
      stationId,
      department,
      templateId
    });
    res.json(integrityReport);
  });

  // 1c. Authorized Templates List & Specifications
  app.get("/api/templates/authorized", (_req: Request, res: Response) => {
    res.json({
      total: Object.keys(KNOWN_KMRL_TEMPLATES).length,
      templates: Object.values(KNOWN_KMRL_TEMPLATES),
      validStations: VALID_STATION_CODES
    });
  });

  // 1d. Document Originality & Authenticity Pre-Check
  app.post("/api/documents/check-originality", (req: Request, res: Response) => {
    const { rawText, title, docId } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "rawText is required for originality verification." });
    }
    const report = db.checkOriginality(rawText, title || "Operational Document", docId);
    res.json(report);
  });

  // 1c. Authentication Endpoints (KMRL SSO & Role Verification)
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, role, userId } = req.body;
    const users = db.getUsers();
    
    // Find matching demo user or construct session
    let authUser = users.find(u => 
      (userId && u.id === userId) || 
      (email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (!authUser) {
      const assignedRole = (role === "ADMIN" || role === "VIEWER" || role === "OPERATOR") ? role : "OPERATOR";
      const userName = email ? email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Shift Officer";
      authUser = {
        id: `USR-KMRL-${Math.floor(100 + Math.random() * 900)}`,
        name: userName,
        email: email || "officer@kochimetro.org",
        role: assignedRole,
        badgeNumber: `KMRL-${assignedRole.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
        stationName: "OCC Muttom / Kochi Metro",
        stationId: "STN-OCC-CENTRAL",
        department: assignedRole === "ADMIN" ? "SIGNALLING_TELECOM" : assignedRole === "VIEWER" ? "CUSTOMER_SERVICE" : "OPERATIONS",
        lastLogin: new Date().toISOString()
      };
    }

    res.json({
      success: true,
      token: `kmrl_jwt_${Buffer.from(authUser.id + ":" + Date.now()).toString("base64")}`,
      user: authUser
    });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ success: true, message: "Session terminated successfully." });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const users = db.getUsers();
    res.json({
      user: users[0],
      active: true
    });
  });

  // 1d. Analytics & Reports Endpoint
  app.get("/api/reports", (_req: Request, res: Response) => {
    const documentsStore = db.getDocuments();
    const incidentsStore = db.getIncidents();
    const clustersStore = db.getClusters();
    const actionsStore = db.getActions();

    const totalDocs = documentsStore.length;
    const recurringCount = clustersStore.length;
    const silentCount = clustersStore.filter(c => c.isSilentRisk).length;
    const resolvedActions = actionsStore.filter(a => a.status === "RESOLVED").length;

    // Station Breakdown
    const stationMap = new Map<string, number>();
    for (const doc of documentsStore) {
      stationMap.set(doc.stationName, (stationMap.get(doc.stationName) || 0) + 1);
    }
    const stationStats = Array.from(stationMap.entries()).map(([station, count]) => ({
      station,
      count
    }));

    // Department Workload Breakdown
    const deptMap = new Map<string, number>();
    for (const doc of documentsStore) {
      deptMap.set(doc.department, (deptMap.get(doc.department) || 0) + 1);
    }
    const departmentStats = Array.from(deptMap.entries()).map(([dept, count]) => ({
      department: dept,
      count
    }));

    // Asset Category Breakdown
    const catMap = new Map<string, number>();
    for (const inc of incidentsStore) {
      catMap.set(inc.assetCategory, (catMap.get(inc.assetCategory) || 0) + 1);
    }
    const categoryStats = Array.from(catMap.entries()).map(([category, count]) => ({
      category,
      count
    }));

    res.json({
      totalDocuments: totalDocs,
      totalIncidents: incidentsStore.length,
      recurringClusters: recurringCount,
      silentRisks: silentCount,
      resolvedActions,
      stationStats,
      departmentStats,
      categoryStats,
      recentClusters: clustersStore
    });
  });

  // 2. Dashboard KPIs & Aggregations
  app.get("/api/dashboard", (_req: Request, res: Response) => {
    const documentsStore = db.getDocuments();
    const clustersStore = db.getClusters();
    const actionsStore = db.getActions();

    const totalDocs = documentsStore.length;
    const processedDocs = documentsStore.filter(d => d.status === "PROCESSED").length;
    const recurringCount = clustersStore.length;
    const silentCount = clustersStore.filter(c => c.isSilentRisk).length;
    const pendingActions = actionsStore.filter(a => a.status !== "RESOLVED").length;
    const highOrCritical = clustersStore.filter(c => c.riskTier === "CRITICAL" || c.riskTier === "HIGH").length;

    const avgRisk = clustersStore.length > 0 
      ? Math.round(clustersStore.reduce((acc, c) => acc + c.prototypeRiskScore, 0) / clustersStore.length)
      : 42;

    // Station Distribution
    const stationMap = new Map<string, { totalReports: number; activeClusters: number; totalRisk: number }>();
    for (const doc of documentsStore) {
      if (!stationMap.has(doc.stationName)) {
        stationMap.set(doc.stationName, { totalReports: 0, activeClusters: 0, totalRisk: 0 });
      }
      stationMap.get(doc.stationName)!.totalReports += 1;
    }

    for (const cl of clustersStore) {
      if (stationMap.has(cl.stationName)) {
        const item = stationMap.get(cl.stationName)!;
        item.activeClusters += 1;
        item.totalRisk = Math.max(item.totalRisk, cl.prototypeRiskScore);
      }
    }

    const stationStats = Array.from(stationMap.entries()).map(([stationName, stat]) => ({
      stationName,
      totalReports: stat.totalReports,
      activeClusters: stat.activeClusters,
      riskScore: stat.totalRisk || 35
    }));

    // Department Distribution
    const deptMap = new Map<string, number>();
    for (const doc of documentsStore) {
      deptMap.set(doc.department, (deptMap.get(doc.department) || 0) + 1);
    }
    const departmentStats = Array.from(deptMap.entries()).map(([department, count]) => ({
      department: department as any,
      count
    }));

    // Temporal trend across last 4 months
    const temporalTrend = [
      { month: "May 2026", totalIncidents: 8, recurringClusters: 1, silentRisks: 0 },
      { month: "Jun 2026", totalIncidents: 14, recurringClusters: 2, silentRisks: 1 },
      { month: "Jul 2026", totalIncidents: 22, recurringClusters: 3, silentRisks: 1 },
      { month: "Aug 2026", totalIncidents: documentsStore.length, recurringClusters: recurringCount, silentRisks: silentCount }
    ];

    const metrics: DashboardMetrics = {
      totalDocuments: totalDocs,
      processedDocuments: processedDocs,
      recurringClustersCount: recurringCount,
      silentRisksCount: silentCount,
      pendingActionsCount: pendingActions,
      highOrCriticalCount: highOrCritical,
      averageRiskScore: avgRisk,
      stationStats,
      departmentStats,
      temporalTrend,
      recentClusters: clustersStore.slice(0, 4)
    };

    res.json(metrics);
  });

  // 3. List documents with search & filter
  app.get("/api/documents", (req: Request, res: Response) => {
    const { station, department, status, search, authenticity } = req.query;
    const documentsStore = db.getDocuments();
    let filtered = [...documentsStore];

    if (station && typeof station === "string" && station !== "ALL") {
      filtered = filtered.filter(d => d.stationId === station || d.stationName.toLowerCase() === station.toLowerCase());
    }
    if (department && typeof department === "string" && department !== "ALL") {
      filtered = filtered.filter(d => d.department === department);
    }
    if (status && typeof status === "string" && status !== "ALL") {
      filtered = filtered.filter(d => d.status === status);
    }
    if (authenticity && typeof authenticity === "string" && authenticity !== "ALL") {
      if (authenticity === "ORIGINAL_ONLY") {
        filtered = filtered.filter(d => d.authenticity?.status === 'ORIGINAL' || d.authenticity?.status === 'DIGITALLY_VERIFIED');
      } else if (authenticity === "FLAGGED_ONLY") {
        filtered = filtered.filter(d => d.authenticity?.status === 'POTENTIAL_DUPLICATE' || d.authenticity?.status === 'DUPLICATE');
      }
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.rawText.toLowerCase().includes(q) ||
        d.stationName.toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q) ||
        (d.authenticity?.sha256Hash && d.authenticity.sha256Hash.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.json({
      total: filtered.length,
      documents: filtered
    });
  });

  // 4. Get single document + its extracted incidents & authenticity certificate
  app.get("/api/documents/:id", (req: Request, res: Response) => {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }
    const incidents = db.getIncidents().filter(i => i.documentId === doc.id);
    res.json({ document: doc, incidents, authenticity: doc.authenticity });
  });

  // 4b. Re-verify authenticity and file integrity for an existing document
  app.post("/api/documents/:id/verify-authenticity", (req: Request, res: Response) => {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }
    const report = db.checkOriginality(doc.rawText, doc.title, doc.id);
    const integrity = verifyFileIntegrity({
      rawText: doc.rawText,
      title: doc.title,
      filename: doc.filename,
      fileType: doc.fileType,
      stationId: doc.stationId,
      department: doc.department
    });
    doc.authenticity = report;
    doc.integrity = integrity;
    db.persist();
    res.json({ document: doc, authenticity: report, integrity });
  });

  // 5. Upload document, check originality & file integrity vs database, and extract entities
  app.post("/api/documents/upload", (req: Request, res: Response) => {
    const { title, filename, fileType, fileData, rawText, stationId, department, docCategory, templateId } = req.body;

    if (!title || !rawText) {
      return res.status(400).json({ error: "Title and rawText content are required." });
    }

    const documentsStore = db.getDocuments();
    const docId = `DOC-KMRL-${String(documentsStore.length + 1).padStart(3, '0')}`;
    const entities = extractEntitiesFromText(rawText, title, department || "OPERATIONS");

    // Perform server-side file integrity and template authorization check
    const integrity = verifyFileIntegrity({
      rawText,
      fileData,
      filename: filename || `${title.toLowerCase().replace(/\s+/g, "_")}.${fileType || "pdf"}`,
      fileType: fileType || "pdf",
      title: title || "KMRL Operational Memo",
      stationId: entities.stationId || stationId || "STN-ALUVA",
      department: entities.department || department || "ELECTRICAL_MAINTENANCE",
      templateId
    });

    const newDoc: OperationalDocument = {
      id: docId,
      title: title || "KMRL Operational Memo",
      filename: filename || `${title.toLowerCase().replace(/\s+/g, "_")}.${fileType || "pdf"}`,
      fileType: fileType || "pdf",
      fileSize: fileData ? Math.floor(fileData.length * 0.75) : (rawText.length * 120) + 150000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Station Operator",
      stationId: entities.stationId || stationId || "STN-ALUVA",
      stationName: entities.stationName || "Aluva",
      department: entities.department || department || "ELECTRICAL_MAINTENANCE",
      rawText,
      status: "PROCESSED",
      isSyntheticDemo: false,
      docCategory: docCategory || "STATION_LOG",
      integrity
    };

    const incidentsStore = db.getIncidents();
    const incId = `INC-KMRL-${String(incidentsStore.length + 1).padStart(3, '0')}`;
    const newIncident: ExtractedIncident = {
      id: incId,
      documentId: newDoc.id,
      documentTitle: newDoc.title,
      stationId: newDoc.stationId,
      stationName: newDoc.stationName,
      assetId: entities.assetId,
      assetName: entities.assetName,
      assetCategory: entities.assetCategory,
      incidentDate: new Date().toISOString().split("T")[0],
      reportedSeverity: entities.severity,
      department: newDoc.department,
      description: rawText.slice(0, 300),
      symptoms: entities.symptoms,
      suggestedAction: entities.suggestedAction,
      extractedConfidence: 0.95,
      isVerifiedByHuman: false
    };

    // Save to persistent database with calculated originality report & integrity
    const { document: savedDoc, authenticity } = db.addDocument(newDoc, newIncident);

    // Refresh cross-document clusters
    refreshClusterData();

    res.status(201).json({
      document: savedDoc,
      incident: newIncident,
      authenticity,
      integrity,
      message: authenticity.isExactDuplicate 
        ? "Warning: Duplicate document identified and saved." 
        : integrity.authorization.isSystemAuthorized
        ? "Document uploaded, verified against authorized KMRL templates, and vectorized successfully."
        : "Document uploaded and flagged as external/unauthorized format."
    });
  });

  // 6. Analyze / Re-extract document
  app.post("/api/documents/:id/analyze", (req: Request, res: Response) => {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    const entities = extractEntitiesFromText(doc.rawText, doc.title, doc.department);
    doc.status = "PROCESSED";

    const incidentsStore = db.getIncidents();
    let inc = incidentsStore.find(i => i.documentId === doc.id);
    if (inc) {
      inc.assetName = entities.assetName;
      inc.assetCategory = entities.assetCategory;
      inc.symptoms = entities.symptoms;
      inc.reportedSeverity = entities.severity;
      inc.suggestedAction = entities.suggestedAction;
      db.updateIncident(inc);
    } else {
      inc = {
        id: `INC-KMRL-${String(incidentsStore.length + 1).padStart(3, '0')}`,
        documentId: doc.id,
        documentTitle: doc.title,
        stationId: doc.stationId,
        stationName: doc.stationName,
        assetId: entities.assetId,
        assetName: entities.assetName,
        assetCategory: entities.assetCategory,
        incidentDate: doc.uploadedAt.split("T")[0],
        reportedSeverity: entities.severity,
        department: doc.department,
        description: doc.rawText.slice(0, 300),
        symptoms: entities.symptoms,
        suggestedAction: entities.suggestedAction,
        extractedConfidence: 0.96,
        isVerifiedByHuman: false
      };
      incidentsStore.unshift(inc);
      db.persist();
    }

    refreshClusterData();

    res.json({ document: doc, incident: inc });
  });

  // 7. Get Recurring Issue Clusters & All Issues
  app.get("/api/issues", (_req: Request, res: Response) => {
    const documentsStore = db.getDocuments();
    const incidentsStore = db.getIncidents();
    const clusterResult = clusterIncidents(documentsStore, incidentsStore, 0.65);
    db.setClusters(clusterResult.clusters);

    res.json({
      issues: clusterResult.clusters,
      clusters: clusterResult.clusters,
      incidents: incidentsStore,
      similarityLinks: clusterResult.similarityLinks,
      total: clusterResult.clusters.length
    });
  });

  app.get("/api/issues/recurring", (_req: Request, res: Response) => {
    const documentsStore = db.getDocuments();
    const incidentsStore = db.getIncidents();
    const clusterResult = clusterIncidents(documentsStore, incidentsStore, 0.65);
    db.setClusters(clusterResult.clusters);

    res.json({
      clusters: clusterResult.clusters,
      similarityLinks: clusterResult.similarityLinks,
      total: clusterResult.clusters.length
    });
  });

  // 7b. Get Single Issue / Cluster by ID
  app.get("/api/issues/:id", (req: Request, res: Response) => {
    const clustersStore = db.getClusters();
    const incidentsStore = db.getIncidents();
    const cluster = clustersStore.find(c => c.id === req.params.id);
    if (cluster) {
      const clusterIncidents = incidentsStore.filter(i => cluster.relatedIncidentIds.includes(i.id));
      return res.json({ issue: cluster, cluster, incidents: clusterIncidents });
    }
    const incident = incidentsStore.find(i => i.id === req.params.id);
    if (incident) {
      return res.json({ issue: incident, incident });
    }
    res.status(404).json({ error: "Issue not found." });
  });

  // 7c. Post Action Order directly for an Issue Cluster
  app.post("/api/issues/:id/action", (req: Request, res: Response) => {
    const { title, department, priority, assignedTo, dueDate, notes } = req.body;
    const clusterId = req.params.id;
    const clustersStore = db.getClusters();
    const targetCluster = clustersStore.find(c => c.id === clusterId);

    const actionsStore = db.getActions();
    const newAction: OperationalAction = {
      id: `ACT-KMRL-${String(actionsStore.length + 1).padStart(2, '0')}`,
      clusterId,
      title: title || (targetCluster ? `Action Order for ${targetCluster.assetName}` : `Action Order ${clusterId}`),
      assetName: targetCluster?.assetName || "Station Asset",
      stationName: targetCluster?.stationName || "Aluva",
      department: department || targetCluster?.department || "ELECTRICAL_MAINTENANCE",
      priority: priority || targetCluster?.actionPriority || "P2_HIGH",
      status: "ASSIGNED",
      assignedTo: assignedTo || "Duty Technician",
      dueDate: dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: notes || "Dispatch preventive maintenance taskforce.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceDocumentIds: targetCluster?.relatedDocumentIds || []
    };

    actionsStore.unshift(newAction);
    if (targetCluster) {
      targetCluster.actionId = newAction.id;
      targetCluster.actionStatus = newAction.status;
    }
    db.persist();
    res.status(201).json({ action: newAction });
  });

  // 8. Get Issue Timeline for an Asset/Cluster
  app.get("/api/issues/:id/timeline", (req: Request, res: Response) => {
    const clustersStore = db.getClusters();
    const incidentsStore = db.getIncidents();
    const cluster = clustersStore.find(c => c.id === req.params.id);
    let assetId = req.params.id;
    let clusterIncidentsList: ExtractedIncident[] = [];

    if (cluster) {
      clusterIncidentsList = incidentsStore.filter(i => cluster.relatedIncidentIds.includes(i.id));
    } else {
      clusterIncidentsList = incidentsStore.filter(i => i.assetId === assetId || i.id === req.params.id);
    }

    // Sort chronologically
    clusterIncidentsList.sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());

    res.json({
      cluster,
      timeline: clusterIncidentsList
    });
  });

  // 9. Get Silent Risks
  app.get("/api/risks/silent", (_req: Request, res: Response) => {
    const clustersStore = db.getClusters();
    const silentRisks = clustersStore.filter(c => c.isSilentRisk);
    res.json({
      silentRisks,
      total: silentRisks.length
    });
  });

  // 10. Human Verification of AI Extraction / Cluster
  app.post("/api/issues/:id/verify", (req: Request, res: Response) => {
    const { verifiedBy, correctedFields } = req.body;
    const clustersStore = db.getClusters();
    const cluster = clustersStore.find(c => c.id === req.params.id);

    if (cluster) {
      cluster.isVerifiedByHuman = true;
      cluster.verifiedBy = verifiedBy || "KMRL Operations Officer";

      if (correctedFields) {
        if (correctedFields.recommendedAction) cluster.recommendedAction = correctedFields.recommendedAction;
        if (correctedFields.riskTier) cluster.riskTier = correctedFields.riskTier;
        if (correctedFields.actionPriority) cluster.actionPriority = correctedFields.actionPriority;
      }
      db.persist();
      return res.json({ cluster, success: true });
    }

    const incidentsStore = db.getIncidents();
    const incident = incidentsStore.find(i => i.id === req.params.id);
    if (incident) {
      incident.isVerifiedByHuman = true;
      incident.verifiedBy = verifiedBy || "KMRL Operations Officer";
      incident.verifiedAt = new Date().toISOString();
      if (correctedFields) {
        if (correctedFields.assetName) incident.assetName = correctedFields.assetName;
        if (correctedFields.reportedSeverity) incident.reportedSeverity = correctedFields.reportedSeverity;
        if (correctedFields.suggestedAction) incident.suggestedAction = correctedFields.suggestedAction;
      }
      db.updateIncident(incident);
      return res.json({ incident, success: true });
    }

    res.status(404).json({ error: "Cluster or incident not found." });
  });

  // 11. List Actions
  app.get("/api/actions", (_req: Request, res: Response) => {
    const actionsStore = db.getActions();
    res.json({
      actions: actionsStore,
      total: actionsStore.length
    });
  });

  // 12. Create Action
  app.post("/api/actions", (req: Request, res: Response) => {
    const { clusterId, title, assetName, stationName, department, priority, assignedTo, dueDate, notes, sourceDocumentIds } = req.body;
    const actionsStore = db.getActions();

    const newAction: OperationalAction = {
      id: `ACT-KMRL-${String(actionsStore.length + 1).padStart(2, '0')}`,
      clusterId: clusterId || `CLS-KMRL-01`,
      title: title || `Action Order for ${assetName || "Metro Asset"}`,
      assetName: assetName || "Station Asset",
      stationName: stationName || "Aluva",
      department: department || "ELECTRICAL_MAINTENANCE",
      priority: priority || "P2_HIGH",
      status: "ASSIGNED",
      assignedTo: assignedTo || "Duty Technician",
      dueDate: dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: notes || "Dispatch preventive inspection.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceDocumentIds: sourceDocumentIds || []
    };

    actionsStore.unshift(newAction);

    // Sync with cluster actionId
    const clustersStore = db.getClusters();
    const targetCluster = clustersStore.find(c => c.id === clusterId);
    if (targetCluster) {
      targetCluster.actionId = newAction.id;
      targetCluster.actionStatus = newAction.status;
    }

    db.persist();
    res.status(201).json({ action: newAction });
  });

  // 13. Update Action Workflow Status
  app.patch("/api/actions/:id/status", (req: Request, res: Response) => {
    const { status, notes, assignedTo } = req.body;
    const actionsStore = db.getActions();
    const action = actionsStore.find(a => a.id === req.params.id);

    if (!action) {
      return res.status(404).json({ error: "Action not found." });
    }

    action.status = status;
    action.updatedAt = new Date().toISOString();
    if (notes) action.notes = notes;
    if (assignedTo) action.assignedTo = assignedTo;
    if (status === "RESOLVED") action.resolvedAt = new Date().toISOString();

    const clustersStore = db.getClusters();
    const cluster = clustersStore.find(c => c.id === action.clusterId);
    if (cluster) {
      cluster.actionStatus = status;
    }

    db.persist();
    res.json({ action });
  });

  // 14. Seed / Reset Demo Data
  app.post("/api/demo/seed", (_req: Request, res: Response) => {
    db.initialize();
    refreshClusterData();

    res.json({
      message: "KMRL Synthetic Demo Dataset seeded successfully in database.",
      documentsCount: db.getDocuments().length,
      clustersCount: db.getClusters().length,
      actionsCount: db.getActions().length
    });
  });

  // 15. Server-side Explainable Root Cause with Gemini
  app.post("/api/gemini/explain", async (req: Request, res: Response) => {
    const { clusterId } = req.body;
    const clustersStore = db.getClusters();
    const cluster = clustersStore.find(c => c.id === clusterId);
    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found." });
    }

    const documentsStore = db.getDocuments();
    const relatedDocs = documentsStore.filter(d => cluster.relatedDocumentIds.includes(d.id));
    const rawTexts = relatedDocs.map(d => `${d.title}: ${d.rawText}`);

    try {
      const explanation = await generateGeminiRootCauseAnalysis(cluster, rawTexts);
      res.json({ explanation });
    } catch (err: any) {
      console.error("Gemini explain error:", err);
      res.status(500).json({ error: "Failed to generate AI explanation." });
    }
  });

  // --------------------------------------------------------------------------
  // VITE DEV MIDDLEWARE / STATIC SERVING
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MetroLens AI] Server running on http://localhost:${PORT}`);
  });
}

startServer();
