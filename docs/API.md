# MetroLens AI — API Reference

## Base URL
`/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user session via KMRL credentials or active shift profile selection.

**Request Body:**
```json
{
  "email": "ramesh.menon@kochimetro.org",
  "role": "OPERATOR",
  "userId": "USR-KMRL-101"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "kmrl_jwt_...",
  "user": {
    "id": "USR-KMRL-101",
    "name": "Ramesh Kumar Menon",
    "email": "ramesh.menon@kochimetro.org",
    "role": "OPERATOR",
    "badgeNumber": "KMRL-OPS-4092",
    "stationName": "Aluva Station",
    "stationId": "STN-ALUVA",
    "department": "OPERATIONS",
    "lastLogin": "2026-08-14T08:30:00Z"
  }
}
```

### `POST /api/auth/logout`
Terminates the active user session.

### `GET /api/auth/me`
Retrieves current session context.

---

## 2. Document Ingestion & Processing

### `GET /api/documents`
Returns all ingested operational documents with filtering parameters.

### `POST /api/documents/upload`
Uploads and triggers real-time NLP analysis on a new operational log.

**Request Body:**
```json
{
  "title": "Aluva Station Escalator-03 Drive Bearing Inspection",
  "rawText": "Observed metallic scraping and heavy rhythmic vibration...",
  "stationId": "STN-ALUVA",
  "department": "ELECTRICAL_MAINTENANCE",
  "docCategory": "MAINTENANCE_SHEET",
  "fileType": "pdf"
}
```

### `POST /api/documents/:id/analyze`
Forces re-analysis of a document with updated ML parameters.

---

## 3. Recurring Issues & Clustering

### `GET /api/issues/recurring`
Retrieves all computed recurring issue clusters and emerging risks.

### `POST /api/issues/:id/verify`
Records human-in-the-loop verification or parameter correction for an extracted incident.

---

## 4. Operational Actions & Analytics

### `GET /api/actions`
Fetches all mitigation tasks and assigned work orders.

### `PATCH /api/actions/:id/status`
Updates action status (`NEW`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`).

### `GET /api/reports`
Generates cross-station analytics and department workload breakdowns.

### `GET /api/dashboard`
Returns high-level KPI aggregations for the primary dashboard.
