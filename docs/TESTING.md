# MetroLens AI — Testing & Verification Guide

This document outlines the testing strategy, test commands, end-to-end user journey verification, and test coverage for the MetroLens AI operational document intelligence platform.

---

## 1. Automated Test Suite

MetroLens AI includes an automated end-to-end and unit testing pipeline implemented in TypeScript (`tests/test_metrolens_pipeline.ts`).

### Running the Test Suite:
```bash
npm test
```

### Coverage Breakdown:
1. **Database & Persistence Storage**: Verifies JSON/SQLite-compatible database initialization, document retrieval, record counters, and SHA-256 integrity ledger.
2. **Authentication & RBAC**: Verifies multi-role authorization (ADMIN, OPERATOR, VIEWER), session state persistence, and token issuance.
3. **File Integrity & Template Validation**: Validates PDF/DOCX magic bytes, structural integrity, and authorization against recognized KMRL operational templates (`KMRL-STN-LOG-V2`, `KMRL-MAINT-F04`, etc.).
4. **Transit NLP Entity Extraction**: Tests extraction of station name, asset category, department, severity, and hardware symptoms.
5. **Cross-Document TF-IDF Cosine Similarity**: Verifies similarity calculation between related escalator logs vs unrelated ticketing logs.
6. **Graph Clustering, Recurring Issues & Risk Scoring**: Verifies automated grouping of multiple reports regarding the same asset, velocity calculation, mathematical risk formula, and silent risk identification.
7. **Bilingual Localization (English & Malayalam)**: Verifies 100% key parity between English and Malayalam locale files and confirms complete removal of Tamil.

---

## 2. Manual End-to-End User Journey Checklist

Follow this procedure to test the complete user journey in the live application:

| Step | Action | Expected Outcome | Status |
|---|---|---|---|
| **1. Open Application** | Access root URL | Sign-in portal loads immediately with KMRL credentials | Verified |
| **2. Login** | Select Shift Officer (Operator/Admin) and click "Sign In" | Authenticates session without blank screen; navigates to Home Dashboard | Verified |
| **3. Home Dashboard** | Review summary metrics (Documents Processed, Recurring Issues, etc.) | High-priority issues highlighted, KPI cards render actual data | Verified |
| **4. Documents Repository** | Click "Documents" tab | Searchable table displays all ingested documents, station filters, and template authorization status | Verified |
| **5. Upload Document** | Click "Upload Document", select authorized template or sample text | Real-time file integrity check runs; shows format validation and SHA-256 hash | Verified |
| **6. Process Document** | Click "Process Document" | Document stored in database; NLP extractor automatically parses station, asset, severity, symptoms | Verified |
| **7. Cross-Document Intelligence** | Open "Issues" tab | Cross-document clustering links related reports; calculates frequency trend and transparent risk score | Verified |
| **8. View Issue Details & Explanation** | Select an issue cluster (e.g. Aluva Escalator 03) | Displays timeline, related documents, mathematical risk breakdown, and recommended action | Verified |
| **9. Update Action Status** | Change action status (e.g. ASSIGNED → IN_PROGRESS → RESOLVED) | Updated status persists in database and reflects on dashboard KPIs | Verified |
| **10. View Reports & Analytics** | Click "Reports" tab | Displays 4 charts (Category distribution, Station workload, Monthly trend, Department allocation) | Verified |
| **11. Language Toggle** | Switch language: `English` ↔ `മലയാളം` | All navigation, buttons, headings, and labels switch to Malayalam without text clipping | Verified |
| **12. Logout** | Click user badge in header and select "Sign Out" | Clears session securely and returns to the Sign-In view | Verified |

---

## 3. Zero Blank Screen Verification

The application implements a zero-blank-screen architecture:
- React Error Boundary at the root in `src/main.tsx` and `src/components/ErrorBoundary.tsx`.
- Safe `getInitialSession()` with `try-catch` and fallback to idle state.
- Graceful API degradation ensuring standard operational mock data displays if the backend server is temporarily paused.
- No unhandled null/undefined states in rendering pipeline.

---

## 4. Build & Lint Validation Commands

```bash
# Type-check and Lint
npm run lint

# Production Build (Vite + esbuild bundle)
npm run build

# Start Production Server
npm start
```
