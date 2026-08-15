import { GoogleGenAI } from "@google/genai";
import { 
  OperationalDocument, 
  ExtractedIncident, 
  RecurringIssueCluster, 
  Severity, 
  TrendDirection,
  Department,
  AssetCategory,
  SimilarityLink
} from "../src/types.js";

// Helper for Gemini AI client (lazy initialization with security best practices)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.warn("Failed to initialize Gemini AI Client:", e);
      aiClient = null;
    }
  }
  return aiClient;
}

// Stop words for transit operational NLP
const TRANSIT_STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", 
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", 
  "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", 
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", 
  "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", 
  "now", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", 
  "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", 
  "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", 
  "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", 
  "why", "with", "would", "you", "your", "yours", "yourself", "yourselves", "station", "report", "noted",
  "observed", "during", "regarding", "logged", "stated", "due", "approx"
]);

// Tokenizer & N-gram builder
export function tokenizeText(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 2 && !TRANSIT_STOPWORDS.has(t));
  return tokens;
}

// Compute Term Frequency (TF)
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length || 1;
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  for (const [k, v] of tf.entries()) {
    tf.set(k, v / total);
  }
  return tf;
}

// Cosine Similarity between two TF vectors
export function calculateCosineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenizeText(textA);
  const tokensB = tokenizeText(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const tfA = computeTF(tokensA);
  const tfB = computeTF(tokensB);

  const allWords = new Set([...tfA.keys(), ...tfB.keys()]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word of allWords) {
    const valA = tfA.get(word) || 0;
    const valB = tfB.get(word) || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1.0, Math.max(0.0, Number(similarity.toFixed(4))));
}

// Known KMRL Stations
const KMRL_STATIONS: { id: string; name: string; aliases: string[] }[] = [
  { id: "STN-ALUVA", name: "Aluva", aliases: ["aluva", "alv"] },
  { id: "STN-KALAMASSERY", name: "Kalamassery", aliases: ["kalamassery", "klm"] },
  { id: "STN-EDAPALLY", name: "Edapally", aliases: ["edapally", "edappally", "edp", "lulu"] },
  { id: "STN-JLN-STADIUM", name: "JLN Stadium", aliases: ["jln", "stadium", "jawaharlal"] },
  { id: "STN-MG-ROAD", name: "MG Road", aliases: ["mg road", "mgr", "mahatma gandhi"] },
  { id: "STN-PETTA", name: "Petta", aliases: ["petta", "pettah", "pta"] },
  { id: "STN-PALARIVATTOM", name: "Palarivattom", aliases: ["palarivattom", "plv"] },
  { id: "STN-MUTTOM", name: "Muttom Depot", aliases: ["muttom", "depot", "mtm"] },
  { id: "STN-MAHARAJAS", name: "Maharajas College", aliases: ["maharajas", "mhc"] }
];

// NLP Entity Extractor
export function extractEntitiesFromText(
  text: string, 
  title: string = "", 
  fallbackDept: Department = "OPERATIONS"
): {
  stationId: string;
  stationName: string;
  assetId: string;
  assetName: string;
  assetCategory: AssetCategory;
  department: Department;
  severity: Severity;
  symptoms: string[];
  suggestedAction: string;
} {
  const combined = `${title} ${text}`.toLowerCase();

  // 1. Station Extraction
  let stationId = "STN-ALUVA";
  let stationName = "Aluva";
  for (const stn of KMRL_STATIONS) {
    if (stn.aliases.some(alias => combined.includes(alias))) {
      stationId = stn.id;
      stationName = stn.name;
      break;
    }
  }

  // 2. Asset & Category Extraction
  let assetCategory: AssetCategory = "ESCALATOR";
  let assetName = "General Station Asset";
  let assetId = `AST-GEN-${Math.floor(Math.random() * 89 + 10)}`;

  if (combined.includes("escalator 03") || combined.includes("esc 03") || combined.includes("esc-03")) {
    assetCategory = "ESCALATOR";
    assetName = "Escalator 03 (Concourse to Platform 1)";
    assetId = "AST-ESC-03";
  } else if (combined.includes("escalator") || combined.includes("step comb")) {
    assetCategory = "ESCALATOR";
    assetName = "Escalator 01";
    assetId = "AST-ESC-01";
  } else if (combined.includes("afc") || combined.includes("smartcard") || combined.includes("flap gate") || combined.includes("gate b2") || combined.includes("gate array")) {
    assetCategory = "AFC_GATE";
    assetName = "AFC Gate Array B2 (Lane 4 Flap)";
    assetId = "AST-AFC-B2";
  } else if (combined.includes("point machine") || combined.includes("crossover") || combined.includes("pm-104") || combined.includes("pm 104") || combined.includes("switch rail")) {
    assetCategory = "SIGNALLING";
    assetName = "Point Machine PM-104 (Up Track Crossover)";
    assetId = "AST-SIG-PM104";
  } else if (combined.includes("chiller") || combined.includes("hvac") || combined.includes("cooling") || combined.includes("suction pressure") || combined.includes("refrigerant")) {
    assetCategory = "HVAC";
    assetName = "Platform Chiller Unit 01";
    assetId = "AST-HVAC-CH01";
  } else if (combined.includes("lift") || combined.includes("elevator")) {
    assetCategory = "ELEVATOR";
    assetName = "Passenger Elevator 02";
    assetId = "AST-ELV-02";
  } else if (combined.includes("door") || combined.includes("train door") || combined.includes("rolling stock")) {
    assetCategory = "TRAIN_DOOR";
    assetName = "Train Set #04 Door B3";
    assetId = "AST-TRN-DR04";
  }

  // 3. Department Extraction
  let department: Department = fallbackDept;
  if (assetCategory === "ESCALATOR" || assetCategory === "ELEVATOR" || assetCategory === "HVAC" || combined.includes("electrical") || combined.includes("bearing") || combined.includes("motor")) {
    department = "ELECTRICAL_MAINTENANCE";
  } else if (assetCategory === "AFC_GATE" || assetCategory === "SIGNALLING" || combined.includes("telecom") || combined.includes("optical") || combined.includes("sensor")) {
    department = "SIGNALLING_TELECOM";
  } else if (combined.includes("p-way") || combined.includes("track") || combined.includes("rail gap") || combined.includes("slide chair")) {
    department = "CIVIL_PWAY";
  } else if (combined.includes("passenger") || combined.includes("complaint") || combined.includes("grievance") || combined.includes("commuter")) {
    department = "CUSTOMER_SERVICE";
  }

  // 4. Severity Assessment
  let severity: Severity = "LOW";
  if (combined.includes("emergency") || combined.includes("seizure") || combined.includes("halt") || combined.includes("trip") || combined.includes("detection loss") || combined.includes("over-current") || combined.includes("screeching")) {
    severity = "HIGH";
  } else if (combined.includes("friction") || combined.includes("variance") || combined.includes("degradation") || combined.includes("warning") || combined.includes("gap") || combined.includes("delay")) {
    severity = "MEDIUM";
  }

  // 5. Symptom Recognition
  const potentialSymptoms = [
    { key: "vibration", label: "harmonic vibration" },
    { key: "jerk", label: "step jerking motion" },
    { key: "clicking", label: "step clicking noise" },
    { key: "bearing", label: "bearing wear/friction" },
    { key: "seizure", label: "bearing seizure" },
    { key: "screech", label: "metal screeching" },
    { key: "trip", label: "over-current trip" },
    { key: "smartcard", label: "smartcard tap latency" },
    { key: "latency", label: "flap gate response delay" },
    { key: "premature", label: "premature flap closure" },
    { key: "optical", label: "optical transceiver dust" },
    { key: "photon", label: "photon reception loss" },
    { key: "throw time", label: "throw time drift" },
    { key: "rail gap", label: "switch rail clearance gap" },
    { key: "detection loss", label: "detection loss alarm" },
    { key: "suction pressure", label: "low suction pressure" },
    { key: "oil weep", label: "refrigerant oil weep" },
    { key: "temp", label: "ambient temperature rise" }
  ];

  const extractedSymptoms = potentialSymptoms
    .filter(s => combined.includes(s.key))
    .map(s => s.label);

  if (extractedSymptoms.length === 0) {
    extractedSymptoms.push("operational variance observed");
  }

  // 6. Action Recommendation
  let suggestedAction = `Perform inspection on ${assetName} and record telemetry parameters.`;
  if (assetCategory === "ESCALATOR") {
    suggestedAction = "Overhaul main drive bearing, align step carriage rollers and lubricate drive chain.";
  } else if (assetCategory === "AFC_GATE") {
    suggestedAction = "Clean optical acrylic sensors and calibrate gate reader firmware timeout.";
  } else if (assetCategory === "SIGNALLING") {
    suggestedAction = "Inspect point machine motor draw, clean slide chairs, and check lock bar tolerance.";
  } else if (assetCategory === "HVAC") {
    suggestedAction = "Perform nitrogen micro-leak test, tighten flare fittings, and top up refrigerant.";
  }

  return {
    stationId,
    stationName,
    assetId,
    assetName,
    assetCategory,
    department,
    severity,
    symptoms: extractedSymptoms,
    suggestedAction
  };
}

// Compute Prototype AI Risk Score
export function calculatePrototypeRiskScore(params: {
  reportCount: number;
  recentCount14Days: number;
  maxSeverity: Severity;
  assetCategory: AssetCategory;
  averageCosineSim: number;
  isSilentRisk: boolean;
}): {
  score: number;
  riskTier: Severity;
  breakdown: {
    frequencyPoints: number;
    velocityPoints: number;
    severityPoints: number;
    assetCriticalityPoints: number;
    similarityPoints: number;
  };
  factors: string[];
  formulaCalculation: string;
} {
  const { reportCount, recentCount14Days, maxSeverity, assetCategory, averageCosineSim, isSilentRisk } = params;

  // 1. Frequency Score (up to 30 pts)
  const frequencyPoints = Math.min(30, reportCount * 7);

  // 2. Velocity Score (up to 20 pts)
  let velocityPoints = 0;
  if (recentCount14Days >= 2) velocityPoints = 20;
  else if (recentCount14Days === 1) velocityPoints = 10;
  else velocityPoints = 5;

  if (isSilentRisk) {
    velocityPoints = Math.min(25, velocityPoints + 10);
  }

  // 3. Peak Severity Score (up to 25 pts)
  let severityPoints = 5;
  if (maxSeverity === "CRITICAL") severityPoints = 25;
  else if (maxSeverity === "HIGH") severityPoints = 20;
  else if (maxSeverity === "MEDIUM") severityPoints = 12;
  else severityPoints = 6;

  // 4. Asset Criticality (up to 20 pts)
  let assetCriticalityPoints = 10;
  if (assetCategory === "SIGNALLING" || assetCategory === "TRAIN_DOOR") assetCriticalityPoints = 20;
  else if (assetCategory === "ESCALATOR" || assetCategory === "ELEVATOR") assetCriticalityPoints = 15;
  else if (assetCategory === "AFC_GATE" || assetCategory === "HVAC") assetCriticalityPoints = 12;

  // 5. Similarity Boost (up to 20 pts)
  const similarityPoints = Math.round(averageCosineSim * 20);

  const rawScore = frequencyPoints + velocityPoints + severityPoints + assetCriticalityPoints + similarityPoints;
  const score = Math.min(100, Math.max(10, rawScore));

  let riskTier: Severity = "LOW";
  if (score >= 80) riskTier = "CRITICAL";
  else if (score >= 60) riskTier = "HIGH";
  else if (score >= 35) riskTier = "MEDIUM";
  else riskTier = "LOW";

  const factors: string[] = [
    `${reportCount} correlated operational reports logged for this asset`,
    `Velocity: ${recentCount14Days} reports recorded in recent 14-day operational window`,
    `Asset Criticality: ${assetCategory} rated at ${assetCriticalityPoints}/20 operational weight`,
    `Semantic textual consistency measured at ${(averageCosineSim * 100).toFixed(0)}% average cosine similarity`
  ];

  if (isSilentRisk) {
    factors.unshift("🚨 SILENT RISK: Multiple low-severity chits aggregating into an emerging operational hazard");
  }

  const formulaCalculation = `Formula: Frequency(${frequencyPoints}) + Velocity(${velocityPoints}) + Severity(${severityPoints}) + AssetCrit(${assetCriticalityPoints}) + Similarity(${similarityPoints}) = ${rawScore} -> Prototype AI Risk: ${score}/100`;

  return {
    score,
    riskTier,
    breakdown: {
      frequencyPoints,
      velocityPoints,
      severityPoints,
      assetCriticalityPoints,
      similarityPoints
    },
    factors,
    formulaCalculation
  };
}

// Cross-Document Graph Clustering Engine
export function clusterIncidents(
  documents: OperationalDocument[],
  incidents: ExtractedIncident[],
  cosineThreshold: number = 0.65
): {
  clusters: RecurringIssueCluster[];
  similarityLinks: SimilarityLink[];
} {
  const similarityLinks: SimilarityLink[] = [];
  const docMap = new Map(documents.map(d => [d.id, d]));

  // 1. Calculate pairwise similarity across all documents
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const docA = documents[i];
      const docB = documents[j];
      const sim = calculateCosineSimilarity(docA.rawText, docB.rawText);

      if (sim >= 0.3) {
        const tokensA = new Set(tokenizeText(docA.rawText));
        const tokensB = new Set(tokenizeText(docB.rawText));
        const shared = [...tokensA].filter(t => tokensB.has(t)).slice(0, 5);

        const dateA = new Date(docA.uploadedAt).getTime();
        const dateB = new Date(docB.uploadedAt).getTime();
        const daysDiff = Math.abs(Math.round((dateA - dateB) / (1000 * 60 * 60 * 24)));

        similarityLinks.push({
          sourceDocId: docA.id,
          targetDocId: docB.id,
          sourceTitle: docA.title,
          targetTitle: docB.title,
          cosineSimilarity: sim,
          sharedKeywords: shared,
          sharedAsset: docA.stationName === docB.stationName ? docA.stationName : "Cross-Station",
          daysDifference: daysDiff
        });
      }
    }
  }

  // 2. Group incidents by Asset & Station
  const assetGroups = new Map<string, ExtractedIncident[]>();
  for (const inc of incidents) {
    const key = `${inc.stationId}::${inc.assetId}`;
    if (!assetGroups.has(key)) {
      assetGroups.set(key, []);
    }
    assetGroups.get(key)!.push(inc);
  }

  const clusters: RecurringIssueCluster[] = [];
  let clusterIdx = 1;

  const nowMs = Date.now();

  for (const [key, groupIncidents] of assetGroups.entries()) {
    if (groupIncidents.length < 2) continue; // Must be at least 2 reports to form a recurring cluster

    // Sort chronologically
    groupIncidents.sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());

    const firstReport = groupIncidents[0];
    const lastReport = groupIncidents[groupIncidents.length - 1];

    const firstDate = new Date(firstReport.incidentDate);
    const lastDate = new Date(lastReport.incidentDate);
    const timeSpanDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Count reports in last 14 days
    const recentCount = groupIncidents.filter(inc => {
      const incMs = new Date(inc.incidentDate).getTime();
      return (nowMs - incMs) <= (14 * 24 * 60 * 60 * 1000);
    }).length;

    // Trend analysis
    let frequencyTrend: TrendDirection = "STABLE";
    if (groupIncidents.length >= 3) {
      const mid = Math.floor(groupIncidents.length / 2);
      const firstHalfSpan = new Date(groupIncidents[mid].incidentDate).getTime() - firstDate.getTime();
      const secondHalfSpan = lastDate.getTime() - new Date(groupIncidents[mid].incidentDate).getTime();
      if (secondHalfSpan < firstHalfSpan || recentCount >= 2) {
        frequencyTrend = "INCREASING";
      } else if (secondHalfSpan > firstHalfSpan * 1.5) {
        frequencyTrend = "DECREASING";
      }
    }

    // Average similarity among group documents
    const docIds = groupIncidents.map(i => i.documentId);
    let totalSim = 0;
    let simPairs = 0;
    for (let i = 0; i < docIds.length; i++) {
      for (let j = i + 1; j < docIds.length; j++) {
        const d1 = docMap.get(docIds[i]);
        const d2 = docMap.get(docIds[j]);
        if (d1 && d2) {
          totalSim += calculateCosineSimilarity(d1.rawText, d2.rawText);
          simPairs++;
        }
      }
    }
    const avgCosine = simPairs > 0 ? Number((totalSim / simPairs).toFixed(2)) : 0.75;

    // Peak severity
    let maxSeverity: Severity = "LOW";
    const severities = groupIncidents.map(i => i.reportedSeverity);
    if (severities.includes("CRITICAL")) maxSeverity = "CRITICAL";
    else if (severities.includes("HIGH")) maxSeverity = "HIGH";
    else if (severities.includes("MEDIUM")) maxSeverity = "MEDIUM";

    // Silent Risk Detection: multiple low/medium severity reports with high frequency
    const isSilentRisk = severities.every(s => s === "LOW" || s === "MEDIUM") && groupIncidents.length >= 3;

    // Compute Risk Score
    const riskData = calculatePrototypeRiskScore({
      reportCount: groupIncidents.length,
      recentCount14Days: recentCount,
      maxSeverity,
      assetCategory: firstReport.assetCategory,
      averageCosineSim: avgCosine,
      isSilentRisk
    });

    const allSymptoms = Array.from(new Set(groupIncidents.flatMap(i => i.symptoms)));
    const keyTerms = Array.from(new Set(groupIncidents.map(i => i.assetName).concat(allSymptoms.slice(0, 4))));

    let actionPriority: 'P1_IMMEDIATE' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE' = 'P3_MEDIUM';
    if (riskData.riskTier === 'CRITICAL') actionPriority = 'P1_IMMEDIATE';
    else if (riskData.riskTier === 'HIGH') actionPriority = 'P2_HIGH';
    else if (riskData.riskTier === 'MEDIUM') actionPriority = 'P3_MEDIUM';
    else actionPriority = 'P4_ROUTINE';

    clusters.push({
      id: `CLS-KMRL-${String(clusterIdx++).padStart(2, '0')}`,
      title: `${firstReport.assetName} Recurring Anomaly Cluster`,
      stationId: firstReport.stationId,
      stationName: firstReport.stationName,
      assetId: firstReport.assetId,
      assetName: firstReport.assetName,
      assetCategory: firstReport.assetCategory,
      department: firstReport.department,
      relatedDocumentIds: docIds,
      relatedIncidentIds: groupIncidents.map(i => i.id),
      reportCount: groupIncidents.length,
      firstReportedDate: firstReport.incidentDate,
      lastReportedDate: lastReport.incidentDate,
      timeSpanDays,
      frequencyTrend,
      averageCosineSimilarity: avgCosine,
      prototypeRiskScore: riskData.score,
      riskTier: riskData.riskTier,
      isSilentRisk,
      symptoms: allSymptoms,
      explanation: {
        factors: riskData.factors,
        formulaCalculation: riskData.formulaCalculation,
        keyTermsMatched: keyTerms,
        riskBreakdown: riskData.breakdown
      },
      recommendedAction: lastReport.suggestedAction || `Deploy maintenance taskforce to overhaul ${firstReport.assetName}.`,
      actionPriority,
      isVerifiedByHuman: groupIncidents.some(i => i.isVerifiedByHuman),
      verifiedBy: groupIncidents.find(i => i.verifiedBy)?.verifiedBy,
      actionId: `ACT-KMRL-${String(clusterIdx - 1).padStart(2, '0')}`,
      actionStatus: riskData.riskTier === 'CRITICAL' ? 'IN_PROGRESS' : 'ASSIGNED'
    });
  }

  // Sort clusters by risk score descending
  clusters.sort((a, b) => b.prototypeRiskScore - a.prototypeRiskScore);

  return { clusters, similarityLinks };
}

// Server-Side Gemini Root Cause Explainer
export async function generateGeminiRootCauseAnalysis(cluster: RecurringIssueCluster, rawTexts: string[]): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    // Fallback deterministic explanation for second-year ADS students
    return `Root-Cause Synthesis for ${cluster.assetName} (${cluster.stationName}):\n` +
      `• Primary Failure Mode: ${cluster.symptoms.slice(0, 3).join(", ")}.\n` +
      `• Cross-Report Analysis: ${cluster.reportCount} documents indicate progressive hardware degradation rather than an isolated incident.\n` +
      `• Immediate Remediation: ${cluster.recommendedAction}`;
  }

  try {
    const prompt = `You are the Chief Reliability Engineer at Kochi Metro Rail Limited (KMRL).
Analyze the following recurring incident reports regarding ${cluster.assetName} at ${cluster.stationName} Station.
Synthesize the cross-document evidence and provide a 3-bullet technical root cause explanation and preventive action for maintenance crews.

Document Excerpts:
${rawTexts.map((t, idx) => `[Doc ${idx + 1}]: ${t}`).join("\n\n")}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return response.text || "AI root cause synthesis complete.";
  } catch (err) {
    console.error("Gemini API call error in explain engine:", err);
    return `Root-Cause Synthesis for ${cluster.assetName} (${cluster.stationName}):\n` +
      `• Primary Failure Mode: ${cluster.symptoms.slice(0, 3).join(", ")}.\n` +
      `• Cross-Report Analysis: ${cluster.reportCount} reports demonstrate cumulative wear.\n` +
      `• Recommended Work Order: ${cluster.recommendedAction}`;
  }
}
