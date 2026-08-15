# MetroLens AI — Database & Storage Architecture

## 1. Schema Overview
MetroLens AI utilizes a structured in-memory and file-persisted data architecture ready for direct PostgreSQL / SQLite ORM integration.

### Core Entities:
- **`AuthUser`**: User identity, role (`ADMIN`, `OPERATOR`, `VIEWER`), badge number, station assignment, and timestamp.
- **`OperationalDocument`**: Document metadata, raw text content, station ID, department, category, and OCR processing status.
- **`ExtractedIncident`**: Granular entity extraction records including asset, subsystem, severity, symptom keywords, and human verification flags.
- **`RecurringIssueCluster`**: Grouped defect clusters with similarity matrices, degradation timelines, and explainability factors.
- **`OperationalAction`**: Mitigation tasks, priority levels, assignment department, due dates, and lifecycle states.
- **`AuditEvent`**: Human overrides, status updates, and verification audit trail.
