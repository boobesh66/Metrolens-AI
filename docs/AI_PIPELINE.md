# MetroLens AI — AI & ML Pipeline

## 1. Pipeline Overview
MetroLens AI leverages Applied Data Science (ADS) techniques suited for operational transit text:
1. **Bilingual Text Preprocessing**: Tokenization, stop-word removal, and transliteration normalization for Malayalam and English.
2. **Entity & Incident Extraction**: Regex and heuristic parsing to extract Station, Asset Name, Sub-System, Symptom, and Severity.
3. **TF-IDF & Cosine Similarity Matrix**: Vector space model to calculate pairwise document similarity.
4. **Hierarchical Agglomerative Clustering (HAC)**: Grouping related reports into single defect trajectories based on asset alignment and symptom semantic overlap.
5. **Silent Risk & Degradation Detection**: Time-series frequency analysis to flag recurring low-severity anomalies that compound into critical hazards.

---

## 2. Mathematical Similarity Calculation

Given document vectors $\mathbf{u}$ and $\mathbf{v}$ computed via Term Frequency-Inverse Document Frequency (TF-IDF):

$$\text{Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|} = \frac{\sum_{i=1}^n u_i v_i}{\sqrt{\sum_{i=1}^n u_i^2} \sqrt{\sum_{i=1}^n v_i^2}}$$

When combined with station matching and temporal proximity:
$$\text{Composite Score} = 0.5 \times \text{Semantic Sim} + 0.3 \times \text{Asset Match} + 0.2 \times \text{Temporal Proximity}$$
