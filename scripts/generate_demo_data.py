#!/usr/bin/env python3
"""
MetroLens AI — KMRL Operational Synthetic Data Generator
SIH Hackathon Problem SIH25080 (Document Overload at Kochi Metro Rail Limited)

NOTICE: All generated data is SYNTHETIC and designed solely for demonstrating 
cross-document recurring issue clustering, silent risk detection, and NLP extraction.
Never claim synthetic data as actual KMRL confidential records.
"""

import json
import random
from datetime import datetime, timedelta

STATIONS = [
    {"id": "STN-ALUVA", "name": "Aluva"},
    {"id": "STN-KALAMASSERY", "name": "Kalamassery"},
    {"id": "STN-EDAPALLY", "name": "Edapally"},
    {"id": "STN-JLN-STADIUM", "name": "JLN Stadium"},
    {"id": "STN-MG-ROAD", "name": "MG Road"},
    {"id": "STN-PETTA", "name": "Petta"}
]

DEPARTMENTS = [
    "ELECTRICAL_MAINTENANCE",
    "SIGNALLING_TELECOM",
    "ROLLING_STOCK",
    "CIVIL_PWAY",
    "OPERATIONS",
    "CUSTOMER_SERVICE"
]

ASSET_TEMPLATES = [
    {
        "category": "ESCALATOR",
        "name": "Escalator 03 (Concourse to Platform 1)",
        "station": "STN-ALUVA",
        "department": "ELECTRICAL_MAINTENANCE",
        "recurring_scenario": "Bearing degradation & step comb vibration chain",
        "reports": [
            {
                "title": "Station Logbook - Minor vibration on Escalator 03",
                "days_ago": 42,
                "severity": "LOW",
                "text": "During morning peak hours, Station Controller noted mild harmonic vibration and intermittent clicking from step 14 on Escalator 03 concourse. Escalator kept in service as safety trip switch remained normal.",
                "symptoms": ["vibration", "clicking noise", "step misalignment"]
            },
            {
                "title": "Passenger Complaint - Escalator jerking motion at Aluva",
                "days_ago": 28,
                "severity": "LOW",
                "text": "Commuter reported discomfort while boarding Escalator 03, stating sudden step jerk near upper landing comb plate. No passenger injury. Forwarded to electrical wing.",
                "symptoms": ["jerking motion", "step vibration", "comb plate"]
            },
            {
                "title": "Technician Routine Chit - Drive chain lubrication on Escalator 03",
                "days_ago": 14,
                "severity": "MEDIUM",
                "text": "Routine bi-weekly inspection of Escalator 03 drive mechanism. High friction detected on main drive bearing housing. Squeaking noise under load. Re-greased chain and recommended deep bearing ultrasonic inspection.",
                "symptoms": ["high friction", "bearing noise", "drive chain squeak"]
            },
            {
                "title": "Supervisor Incident Memo - Emergency Halt of Escalator 03",
                "days_ago": 2,
                "severity": "HIGH",
                "text": "Escalator 03 tripped automatically on over-current protection due to severe bearing seizure in lower roller carriage. Heavy metal screeching prior to trip. Escalator barricaded. Urgent replacement needed.",
                "symptoms": ["bearing seizure", "over-current trip", "metal screeching", "emergency halt"]
            }
        ]
    },
    {
        "category": "AFC_GATE",
        "name": "AFC Gate Array B2 (SmartCard Reader Flap 4)",
        "station": "STN-EDAPALLY",
        "department": "SIGNALLING_TELECOM",
        "recurring_scenario": "Silent Risk: Optical sensor desync causing passenger queue bottleneck",
        "reports": [
            {
                "title": "Customer Helpdesk Slip - Smartcard double tap error at Edapally Gate B2",
                "days_ago": 30,
                "severity": "LOW",
                "text": "Passenger Kochi1 card took 3 attempts to read on Gate B2 flap 4. Green LED blinked slowly. Gate allowed exit after reboot.",
                "symptoms": ["card read latency", "flashing LED", "tap error"]
            },
            {
                "title": "Station Master Diary - Commuter queue build-up at Edapally Exit",
                "days_ago": 21,
                "severity": "LOW",
                "text": "Slow throughput observed on AFC Gate B2 lane 4 during LuLu Mall shopping rush. Flap gate latency approx 1.8 seconds higher than baseline 0.3s.",
                "symptoms": ["throughput drop", "flap gate latency", "queue bottleneck"]
            },
            {
                "title": "Customer Service Log - 4 passenger complaints regarding Gate B2 gate retraction",
                "days_ago": 10,
                "severity": "LOW",
                "text": "Multiple passengers flagged that Gate B2 flap closed prematurely while passing with luggage. Scanner delay identified as root factor.",
                "symptoms": ["premature flap closure", "scanner delay", "sensor misalignment"]
            },
            {
                "title": "Telecom Work Chit - Diagnostic optical sensor calibration Gate B2",
                "days_ago": 3,
                "severity": "MEDIUM",
                "text": "Telecom technician ran diagnostic on AFC Gate B2. Infrared beam receiver 3 exhibiting 24% photon degradation due to acrylic dust accumulation. Firmware timeout triggering reader retry loops.",
                "symptoms": ["photon degradation", "infrared sensor dust", "reader retry loop"]
            }
        ]
    },
    {
        "category": "SIGNALLING",
        "name": "Point Machine PM-104 (Up Track Crossover)",
        "station": "STN-PETTA",
        "department": "SIGNALLING_TELECOM",
        "recurring_scenario": "Point machine micro-stall and switch rail gap anomaly",
        "reports": [
            {
                "title": "Signalling Log - Point Machine 104 throw time variance",
                "days_ago": 25,
                "severity": "LOW",
                "text": "Automatic signalling telemetry recorded 3.8s throw time on Point Machine 104 crossover at Petta, standard is 2.5s. Micro-stall detected during reverse-to-normal cycle.",
                "symptoms": ["throw time variance", "point machine stall", "switch resistance"]
            },
            {
                "title": "P-Way Track Walk Memo - Switch rail gap near PM-104",
                "days_ago": 12,
                "severity": "MEDIUM",
                "text": "Track inspection team noted 1.5mm gap on stock-rail lock bar during manual visual audit. Slight debris in slide chair pocket.",
                "symptoms": ["rail gap", "slide chair friction", "lock bar clearance"]
            },
            {
                "title": "OCC Night Log - Point 104 detection fail alarm during loop test",
                "days_ago": 4,
                "severity": "HIGH",
                "text": "During night maintenance loop testing, OCC received intermittent Point 104 detection loss alarm under heavy damp weather. Point motor draw spike observed.",
                "symptoms": ["detection loss alarm", "point motor spike", "switch failure"]
            }
        ]
    },
    {
        "category": "HVAC",
        "name": "Platform Chiller Unit 01",
        "station": "STN-MG-ROAD",
        "department": "ELECTRICAL_MAINTENANCE",
        "recurring_scenario": "Refrigerant pressure drop & compressor thermal cycle",
        "reports": [
            {
                "title": "Facility Log - Ambient temperature alert MG Road concourse",
                "days_ago": 18,
                "severity": "LOW",
                "text": "Concourse temperature logged at 28.5C (target 24C). Chiller Unit 01 running continuously without cycling into eco mode.",
                "symptoms": ["ambient temp rise", "continuous running", "compressor cycle"]
            },
            {
                "title": "Technician Sheet - Chiller Unit 01 low suction pressure warning",
                "days_ago": 5,
                "severity": "MEDIUM",
                "text": "Pressure gauge inspection on Chiller 01 revealed low suction pressure (42 psi vs 60 psi nominal). Slight oil residue near expansion valve.",
                "symptoms": ["low suction pressure", "expansion valve oil", "refrigerant leak"]
            }
        ]
    }
]

def generate_dataset():
    documents = []
    incidents = []
    
    doc_id = 1
    inc_id = 1
    
    now = datetime.now()
    
    for asset in ASSET_TEMPLATES:
        station_info = next(s for s in STATIONS if s["id"] == asset["station"])
        for rep in asset["reports"]:
            uploaded_date = now - timedelta(days=rep["days_ago"])
            date_str = uploaded_date.strftime("%Y-%m-%d")
            
            doc = {
                "id": f"DOC-{doc_id:04d}",
                "title": rep["title"],
                "filename": f"{rep['title'].lower().replace(' ', '_')[:30]}.pdf",
                "fileType": "pdf",
                "fileSize": random.randint(450000, 2400000),
                "uploadedAt": uploaded_date.isoformat(),
                "uploadedBy": "KMRL Station Automation Agent",
                "stationId": asset["station"],
                "stationName": station_info["name"],
                "department": asset["department"],
                "rawText": rep["text"],
                "status": "PROCESSED",
                "isSyntheticDemo": True,
                "docCategory": "STATION_LOG" if "Log" in rep["title"] else ("MAINTENANCE_SHEET" if "Chit" in rep["title"] else "PASSENGER_COMPLAINT")
            }
            documents.append(doc)
            
            inc = {
                "id": f"INC-{inc_id:04d}",
                "documentId": doc["id"],
                "documentTitle": doc["title"],
                "stationId": asset["station"],
                "stationName": station_info["name"],
                "assetId": f"AST-{asset['category'][:3]}-{doc_id:02d}",
                "assetName": asset["name"],
                "assetCategory": asset["category"],
                "incidentDate": date_str,
                "reportedSeverity": rep["severity"],
                "department": asset["department"],
                "description": rep["text"],
                "symptoms": rep["symptoms"],
                "suggestedAction": f"Inspect {asset['name']} mechanism and calibrate safety switches.",
                "extractedConfidence": round(random.uniform(0.91, 0.98), 2),
                "isVerifiedByHuman": True if rep["days_ago"] > 10 else False
            }
            incidents.append(inc)
            
            doc_id += 1
            inc_id += 1
            
    print(f"Generated {len(documents)} synthetic KMRL documents and {len(incidents)} incidents.")
    
    with open("synthetic_kmrl_data.json", "w") as f:
        json.dump({"documents": documents, "incidents": incidents}, f, indent=2)

if __name__ == "__main__":
    generate_dataset()
