# MetroLens AI — Explainable Risk Scoring

## 1. Objective
Provide transit controllers with an intuitive, explainable metric (0–100) representing operational urgency and failure likelihood.

---

## 2. Risk Score Formulation

$$\text{Risk Score} = \min(100, (\text{Base Severity} \times 0.35) + (\text{Frequency Multiplier} \times 0.30) + (\text{Asset Criticality} \times 0.20) + (\text{Temporal Acceleration} \times 0.15))$$

### Factor Weights:
1. **Base Severity (0–100)**:
   - `CRITICAL` = 95
   - `HIGH` = 75
   - `MEDIUM` = 45
   - `LOW` = 20
2. **Frequency Multiplier**:
   - Number of related document logs in the trailing 30-day window ($\text{Count} \times 12$).
3. **Asset Criticality**:
   - Signaling / Traction = 90
   - Rolling Stock = 85
   - Escalators / Lifts = 70
   - Fare Gates / AFC = 55
4. **Temporal Acceleration**:
   - Shortening interval between consecutive incident logs.

---

## 3. Tier Classification
- **Critical (80–100)**: Immediate supervisor intervention required; automatic P1 action dispatch.
- **High (60–79)**: Priority inspection scheduled within 24 hours.
- **Medium (40–59)**: Monitored in active shift logs; routine maintenance sheet created.
- **Low (0–39)**: Informational observation recorded.
