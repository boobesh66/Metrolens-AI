# MetroLens AI — Troubleshooting Guide

## 1. Resolved Issues

### Issue A: Blank Screen After Login
- **Root Cause**: Missing route fallback and undefined user state in component tree.
- **Resolution**: Added deterministic fallback routing to `HomeView` and safe session hydration with default shift officers. Wrapped root in `ErrorBoundary`.

### Issue B: Undefined Explanation Factors
- **Root Cause**: Defensive array chaining was missing on `selectedCluster.explanation.factors`.
- **Resolution**: Added null-safe operators and chronological timeline derivation from related document dates.

---

## 2. Common Scenarios

### Blank / White Screen Recovery
1. MetroLens AI includes a global React `ErrorBoundary`.
2. Click **Try Again** to reload or **Return to Home** to reset navigation state.

### Document Upload Failure
1. Verify file size is within 10MB limit.
2. Supported formats: `.pdf`, `.txt`, `.docx`, `.csv`.
3. Use the quick-template selectors for immediate sample loading during demonstrations.
