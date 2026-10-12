# AirGuard — Complete Tech Stack & Architecture Guide

This document explains **every technology used in the AirGuard project**, **why we chose it**, and **which specific features it powers**, written in simple, clear language.

---

## 1. High-Level Architecture Overview

AirGuard is an **Airspace Trust & Threat Intelligence Platform**. It ingests live and simulated ADS-B flight telemetry, analyzes the signals in real time using Machine Learning and rule-based detectors, flags anomalies (like GPS spoofing, ghost aircraft, altitude jumps, or route deviations), and displays the live airspace on an interactive 3D globe and tactical radar.

```
       [ Live ADS-B / OpenSky / Simulation Feeds ]
                           │
                           ▼
             [ Redis Streams (Message Broker) ]
                           │
                           ▼
          [ Detection Worker (PyTorch / Scikit / SHAP) ]
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   [ PostgreSQL Database ]        [ FastAPI (Async API) ]
                                          │
                     WebSocket / REST     │
                                          ▼
                      [ React + CesiumJS Frontend ]
```

---

## 2. Detailed Tech Stack Breakdown & Why We Used Them

### A. Frontend Technologies (User Interface & 3D Radar)

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **React 18** | Frontend UI Library | Builds interactive, component-based user interfaces. React 18's concurrent features handle fast, continuous UI re-renders without lagging. |
| **TypeScript** | Typed JavaScript | Adds strict type safety. Prevents runtime bugs when handling complex flight telemetry objects (coordinates, velocity, heading, risk scores). |
| **Vite** | Frontend Build Tool & Dev Server | Extremely fast bundling and Hot Module Replacement (HMR). Replaces older, slow tools like Webpack. |
| **CesiumJS & Resium** | 3D Geospatial Globe Engine & React Wrapper | Renders accurate, high-performance 3D Earth terrain and airspace. Displays aircraft in realistic 3D altitudes and 3D flight paths. |
| **Leaflet & `@types/leaflet`** | Lightweight 2D Map Library | Provides a fast, lightweight 2D fallback map view for low-spec devices or 2D overview modes. |
| **Zustand** | Lightweight State Management | Manages application state (selected aircraft, active filter presets, alert counters, live telemetry feeds) with minimal boilerplate and zero unnecessary re-renders. |
| **TailwindCSS** | Utility-First CSS Framework | Enables rapid, responsive UI styling with custom dark-mode tactical defense themes without bloated external CSS files. |
| **Recharts** | Composable Charting Library | Renders smooth, responsive risk-trend graphs, telemetry variance charts, and feature contribution graphs. |
| **React-Window** | Virtualized List Rendering | Renders thousands of aircraft in the flight list table smoothly by only rendering items currently visible on the screen. |

---

### B. Backend Technologies (Core Engine & APIs)

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **Python 3.11+** | Primary Backend Language | The industry standard for AI/ML and scientific computing. Version 3.11 provides significant execution speedups. |
| **FastAPI** | Modern, Asynchronous Web Framework | One of the fastest Python web frameworks. Native `async/await` support makes it ideal for high-throughput live telemetry APIs and WebSockets. |
| **Uvicorn** | Lightning-fast ASGI Web Server | Runs the FastAPI application with high concurrency and asynchronous worker processes. |
| **Pydantic v2** | Data Validation & Settings Management | Validates incoming ADS-B telemetry payloads and API requests with high speed (written in Rust under the hood). |
| **SlowAPI** | API Rate Limiting Middleware | Protects backend endpoints against denial-of-service (DoS) attacks and brute-force queries. |
| **ReportLab** | PDF Generation Engine | Generates downloadable, formatted forensic threat intelligence audit reports directly from backend data. |

---

### C. Database, Streaming & Persistence

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **PostgreSQL** | Robust Relational Database | Reliable, ACID-compliant database for persisting aircraft metadata, flight histories, alerts, and audit logs. |
| **SQLAlchemy 2.0 (AsyncIO)** | Python SQL Toolkit & ORM | Asynchronous database access so database operations never block incoming flight telemetry streams. |
| **asyncpg** | High-performance Async PostgreSQL Driver | Direct binary async driver for PostgreSQL in Python, providing low-latency database queries. |
| **Alembic** | Database Migration Tool | Manages database schema changes and version tracking reliably across development and production. |
| **Redis & Redis Streams** | In-Memory Data Store & Event Streaming | Buffers incoming high-frequency flight telemetry and queues jobs for detection workers with sub-millisecond latency. |

---

### D. Machine Learning, AI & Anomaly Detection

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **PyTorch** | Deep Learning Framework | Powers deep learning neural networks used for complex multi-variate trajectory anomaly detection and temporal pattern recognition. |
| **Scikit-Learn** | Machine Learning Library | Used for core anomaly detection models, isolation forests, classification, and statistical clustering algorithms. |
| **SHAP (SHapley Additive exPlanations)** | Explainable AI (XAI) Framework | Explains *why* an aircraft was flagged as suspicious by showing the exact contribution of each telemetry feature (speed, climb rate, signal strength). |
| **NumPy & SciPy** | Scientific Computing & Math Libraries | Computes fast vector math, geodesic distances (Haversine calculations), kinematic physics checks, and matrix operations. |

---

### E. Security, Authentication & Observability

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **python-jose & bcrypt** | JWT Token & Password Hashing | Secures the platform using JSON Web Tokens (JWT) and industry-standard salted password hashing. |
| **OpenTelemetry** | Distributed Tracing & Telemetry | Instruments requests across the backend to trace performance bottlenecks and track request lifecycles. |
| **Prometheus Client** | Metrics Collector | Exposes real-time system metrics (requests per second, detection latency, memory usage) for monitoring. |

---

### F. Testing, DevOps & Quality Control

| Technology | What it is | Why we chose it (In Simple Words) |
| :--- | :--- | :--- |
| **Docker & Docker Compose** | Containerization Platform | Packages the entire application (Frontend, Backend, Redis, PostgreSQL) into portable, reproducible containers. |
| **Pytest & Pytest-Asyncio** | Automated Testing Framework | Comprehensive unit and integration testing suite for backend routes, worker logic, and ML detectors. |
| **Locust** | Load & Performance Testing Tool | Simulates hundreds of simultaneous aircraft feeding data to verify system throughput under load. |
| **Schemathesis** | Property-Based API Testing | Automatically fuzz-tests OpenAPI endpoints to catch edge-case bugs and schema mismatches. |
| **Ruff & Black** | Python Linter & Code Formatter | Enforces clean, standardized, high-quality Python code across the entire codebase. |
| **ESLint & Prettier** | Frontend Linting & Formatting | Ensures clean TypeScript and React code conventions and catches bugs before runtime. |

---

## 3. Feature-to-Tech-Stack Mapping Matrix

Here is how each specific feature in AirGuard connects directly to the underlying technologies:

| Project Feature | Technologies Powering It | How It Works |
| :--- | :--- | :--- |
| **1. 3D Tactical Globe & Airspace Visualization** | CesiumJS, Resium, React, TailwindCSS | Renders full 3D Earth, aircraft positions, altitude ribbons, velocity vectors, and geofences. |
| **2. Real-Time Telemetry Ingestion Engine** | Redis Streams, FastAPI, Pydantic v2, asyncpg | Telemetry enters via REST or WebSocket, gets validated by Pydantic, buffered in Redis, and stored asynchronously. |
| **3. Live Threat & Anomaly Detection** | Python Worker, PyTorch, Scikit-learn, NumPy, SciPy | Background worker analyzes kinematics, flag jumps in altitude, speed discrepancies, spoofed transponders, and ghost signals. |
| **4. Explainable AI (XAI) Threat Breakdown** | SHAP, Recharts, React | Calculates exact SHAP values for anomaly scores so radar operators see human-readable explanations of why an alert triggered. |
| **5. High-Density Aircraft List & Filtering** | React-Window, Zustand, TypeScript | Displays hundreds of live aircraft smoothly without browser lag, filtering by risk level or altitude in real time. |
| **6. Real-Time Flight Data Streaming to Browser** | WebSockets (`websockets`), FastAPI, Zustand | Pushes live aircraft updates directly from server to browser without polling. |
| **7. Forensic Threat Audit & PDF Export** | ReportLab, FastAPI, SQLAlchemy | Generates defense-grade PDF threat dossiers with incident timestamps, flight coordinates, and detector evidence. |
| **8. Historical Telemetry Playback** | PostgreSQL, SQLAlchemy (AsyncIO), Recharts | Allows defense evaluators to replay past flight routes and review exact threat triggers frame-by-frame. |
| **9. Authentication & Role-Based Security** | python-jose, bcrypt, FastAPI HTTPBearer | Ensures only authorized defense operators can access sensitive controls, simulation triggers, and audit logs. |
| **10. System Health & Performance Monitoring** | Prometheus Client, OpenTelemetry | Tracks pipeline ingestion rate, detector inference time, and worker queue health. |

---

## 4. Key Architectural Choices (Why X instead of Y?)

1. **FastAPI instead of Django / Flask:**
   - *Reason:* FastAPI is asynchronous by default (`asyncio`), making it vastly superior for real-time WebSocket communication and handling hundreds of telemetry updates per second without getting blocked.

2. **CesiumJS instead of simple Google Maps / Leaflet alone:**
   - *Reason:* Airspace security requires 3D altitude visualization, pitch, roll, and elevation modeling. Standard 2D map libraries cannot visualize 3D flight paths accurately.

3. **Redis Streams instead of Heavy Kafka:**
   - *Reason:* Redis Streams provides low-latency event buffering and consumer groups with minimal memory footprint and zero operational overhead compared to running a multi-node Apache Kafka cluster for local and lightweight deployments.

4. **Zustand instead of Redux:**
   - *Reason:* Zustand is lightweight (~1KB), avoids excessive boilerplate actions and reducers, and allows direct selector subscriptions so only components displaying changing telemetry re-render.

5. **SHAP instead of Black-Box Predictions:**
   - *Reason:* In aviation and defense intelligence, operators cannot trust a black-box "Risk Score: 95%". SHAP provides mathematical proof of *which telemetry fields caused the suspicion*.
