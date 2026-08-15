# METROLENS AI — UI SIMPLIFICATION AUDIT & REFACTORING PLAN

**Project:** MetroLens AI — Operational Document Intelligence  
**Target Environment:** Kerala Public-Sector / Government Digital Services  
**Compliance Standard:** WCAG 2.1 AA, Government of India / Kerala Digital Portal Design Principles  
**Languages:** English (`en`) & Malayalam (`ml`) Only (Tamil removed completely)  
**Date:** August 2026

---

## 1. Executive Summary & Design Rationale

The previous prototype was functionally capable but suffered from visual clutter, hackathon/demo-specific terminology, overwhelming multi-tab sidebars (9 tabs), dual metric sliders, and complex jargon (e.g., "cosine vector math", "NLP schema extraction", "3-min demo sandbox").

The new architecture refactors MetroLens AI into a **clean, institutional, trustworthy 4-section government portal** where an ordinary public-sector employee can understand their tasks within **10 seconds**.

---

## 2. Screen-by-Screen UI Audit & Transformation Matrix

| Screen / Area | Current State & Clutter | Elements to Remove / Suppress | Elements to Keep & Simplify | New Simplified Structure (4 Core Tabs) |
|---|---|---|---|---|
| **Global Navigation & Header** | 9-item sidebar, dark mode toggle, Tamil switcher, "3-Min Demo", "Seed Data", "SIH Problem" badges | Hackathon badges, Tamil (`ta`), Demo tour modal, redundant tabs (`why`, `demo`, `silentRisk`, `timelines`, `xai`) | MetroLens AI Wordmark, Institutional sub-title, Language switcher (English \| മലയാളം), User badge | Top institutional header with **Home**, **Documents**, **Issues**, **Reports** + simple mobile navigation drawer. |
| **Home (Dashboard)** | 6 large KPI cards, 3 complex graphs, Hackathon tour buttons, excessive color badges | Flashy glow effects, hackathon buttons, overcomplicated graphs | Core metrics (4 simple numbers), primary call-to-action buttons, high-priority issues alert list | Clean header with 10-second explanation, 2 primary action buttons (`Upload Document`, `View Issues`), 4 key metric cards, list of issues needing immediate attention. |
| **Documents (Document Intelligence)** | Complex entity JSON view, multiple raw buttons per row (Analyze, Edit, Verify), hackathon sample pills | Duplicate row buttons, raw JSON dumps, technical confidence gauges | Document upload dropzone, search & filter (Station, Type, Status), clean tabular list, single primary action `[View]` | Single clean table with `[View]`. Document Details view with Summary, Key Info, Related Reports, Recommended Action, and human-readable explanation on a single clean page. |
| **Issues & Risk (Merged from Recurring, SilentRisk, Timelines, XAI)** | Fragmented across 4 separate tabs (`recurring`, `silentRisk`, `timelines`, `xai`) with formula sliders, cosine similarity inputs, and technical metrics | Cosine similarity sliders, mathematical formula playground, complex radar jargon | Recurring issue detection, silent/emerging risk identification, chronological timeline scrubber, Gemini technical synthesis, action status updating | Unified **Issues** section with filter (`All`, `High Priority`, `Recurring`, `Emerging Risks`). Issue card with ONE primary button: `[View Details]`. Comprehensive details view showing timeline, related reports, recommended action, and clear human explanation. |
| **Reports (Analytics)** | Scattered telemetry charts with cluttered axes | Decorative charts, redundant telemetry graphs | Meaningful charts: Issues by Station, Issues by Category, Issue Trend, Department Status | Clean, official **Reports** page featuring 4 clear, accessible charts and a downloadable operational summary. |

---

## 3. Localization Architecture

- **Supported Languages:**
  1. `en` — English
  2. `ml` — മലയാളം (Malayalam)
- **Removed:** Tamil (`ta.json`, `தமிழ்`) completely eliminated from codebase, types, and switcher.
- **Language Switcher:** Accessible, standard government format: `English | മലയാളം`.

---

## 4. Visual & Accessibility Guidelines Applied

- **Primary Color:** Deep Institutional Navy (`#0f3d68` / `#1e3a8a`)
- **Secondary Accent:** Muted Forest Teal (`#0d9488` / `#059669`)
- **Background:** Crisp Light Neutral (`#f8fafc` / `#ffffff`)
- **Typography:** High-legibility sans-serif with natural Malayalam script font support.
- **Accessibility:** Text + Icon status indicators (Green `Resolved`, Amber `Medium / Under Review`, Red `High / Critical Alert`), full keyboard focus states, WCAG AA contrast ratio compliance.
