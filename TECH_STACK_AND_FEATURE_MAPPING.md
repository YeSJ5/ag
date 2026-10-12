# AirGuard — Tech Stack & Feature Mapping Guide

A simple, clear explanation of **every technology used in the AirGuard project**, **why we used it**, and **which specific project features it powers**.

---

## 1. Quick Summary Table: Which Tech Powers Which Feature?

| Project Feature | Tech Stack Used | What This Tech Does for This Feature |
| :--- | :--- | :--- |
| **3D Tactical Globe & Airspace Visualization** | `CesiumJS`, `Resium`, `React 18`, `TailwindCSS` | Renders a realistic 3D Earth globe with 3D flight paths, accurate aircraft altitudes, pitch/roll angles, and geofences. |
| **2D Radar & Fallback Map** | `Leaflet`, `React 18` | Provides a fast, lightweight 2D tactical map view for low-spec machines and rapid 2D situational overviews. |
| **Real-Time ADS-B Telemetry Ingestion** | `Redis Streams`, `FastAPI`, `Pydantic v2`, `asyncpg` | Validates high-speed incoming flight telemetry from live ADS-B networks and buffers thousands of updates per second with zero delay. |
| **Live WebSocket Streaming to Frontend** | `WebSockets (websockets)`, `FastAPI`, `Zustand` | Pushes live aircraft positions and risk scores instantly to the browser without page refreshing or polling. |
| **Live Anomaly & Threat Detection Engine** | `PyTorch`, `Scikit-Learn`, `NumPy`, `SciPy` | Runs machine learning models and physics checks in a background worker to detect GPS spoofing, ghost aircraft, transponder tampering, and sudden altitude/speed jumps. |
| **Explainable AI (XAI) Feature Attribution** | `SHAP (SHapley Additive exPlanations)`, `Recharts` | Explains *why* an aircraft was flagged by calculating mathematical feature contributions (e.g. "Abnormal climb rate +42%, Velocity spike +38%"). |
| **Cross-Airframe Comparison (Differential Analysis)** | `FastAPI`, `Haversine formula (math)`, `React 18`, `TailwindCSS` | Compares a suspicious aircraft against nearby flights to distinguish between a single-plane spoofing attack vs sector-wide GPS jamming. |
| **High-Density Aircraft List & Live Filtering** | `React-Window`, `Zustand`, `TypeScript` | Virtualizes the flight table list so thousands of live aircraft can be searched and filtered without lagging the browser. |
| **Forensic Incident Audit Dossiers (PDF Export)** | `ReportLab`, `FastAPI`, `SQLAlchemy` | Generates official, downloadable defense-grade PDF threat intelligence reports with timestamps, coordinates, and detector evidence. |
| **Historical Playback & Flight Investigation** | `PostgreSQL`, `SQLAlchemy 2.0 (AsyncIO)`, `Recharts` | Persists millions of flight records and allows defense evaluators to replay past flight routes and review exact alert timelines. |
| **Authentication & Operator Access Control** | `python-jose (JWT)`, `bcrypt`, `FastAPI HTTPBearer` | Enforces secure login, password hashing, and role-based permissions (Viewer, Analyst, Admin). |
| **System Health & Observability Metrics** | `Prometheus Client`, `OpenTelemetry` | Tracks backend throughput, API response latency, and detector processing times. |

---

## 2. Layer-by-Layer Tech Stack Breakdown (In Plain English)

### A. Frontend (UI & Visualization)

1. **React 18 (`react`, `react-dom`):**
   - *Why we used it:* Builds modular, reactive UI components. Its concurrent rendering ensures smooth 60fps updates while live flight data streams continuously.
2. **TypeScript (`typescript`):**
   - *Why we used it:* Adds type safety to prevent bugs when handling complex flight telemetry structures (coordinates, velocity, heading, risk scores, detector flags).
3. **CesiumJS & Resium (`cesium`, `resium`, `vite-plugin-cesium`):**
   - *Why we used it:* Industry-standard 3D geospatial engine. Standard 2D maps cannot accurately represent 3D aircraft altitude ribbons, spatial separation, or terrain elevation.
4. **Leaflet (`leaflet`, `@types/leaflet`):**
   - *Why we used it:* Fast, lightweight 2D map fallback for devices with lower GPU capabilities.
5. **Zustand (`zustand`):**
   - *Why we used it:* A lightweight (~1KB) state management library. Unlike Redux, it requires almost no boilerplate and only re-renders the specific UI components that rely on updated flight data.
6. **TailwindCSS (`tailwindcss`, `postcss`, `autoprefixer`):**
   - *Why we used it:* Provides rapid, clean utility-first styling for our dark-mode tactical defense theme without writing thousands of lines of messy CSS.
7. **Recharts (`recharts`):**
   - *Why we used it:* Composable charting library to render interactive risk trend curves, telemetry timelines, and ML feature attribution graphs.
8. **React-Window (`react-window`, `@types/react-window`):**
   - *Why we used it:* Virtualized list rendering. When 5,000 aircraft are in the airspace, it only renders the ~15 rows visible in the viewport, preventing browser freezing.
9. **Vite (`vite`, `@vitejs/plugin-react`):**
   - *Why we used it:* Next-generation build tool that starts in milliseconds and hot-reloads instantly during development.

---

### B. Backend (APIs, Server & Logic)

1. **Python 3.11+:**
   - *Why we used it:* The core language for AI/ML and scientific data pipelines, offering up to 25% faster execution compared to older Python versions.
2. **FastAPI (`fastapi`):**
   - *Why we used it:* High-performance, asynchronous (`asyncio`) web framework. Perfect for handling hundreds of incoming telemetry requests and live WebSockets simultaneously.
3. **Uvicorn (`uvicorn`):**
   - *Why we used it:* High-speed ASGI web server that powers FastAPI with asynchronous I/O workers.
4. **Pydantic v2 (`pydantic`, `pydantic-settings`):**
   - *Why we used it:* Ultra-fast data validation (implemented in Rust) that validates and parses incoming ADS-B messages in microseconds.
5. **SlowAPI (`slowapi`):**
   - *Why we used it:* Protects API endpoints against rate-limit abuse and brute-force attacks.
6. **ReportLab (`reportlab`):**
   - *Why we used it:* Programmatically generates downloadable, formatted forensic PDF threat investigation reports.

---

### C. Database, Streaming & Persistence

1. **PostgreSQL:**
   - *Why we used it:* Enterprise-grade, ACID-compliant relational database for storing long-term flight histories, incident alerts, and audit logs.
2. **SQLAlchemy 2.0 (`sqlalchemy` with `asyncio`):**
   - *Why we used it:* Asynchronous Object-Relational Mapper (ORM). Allows database reads and writes to happen in the background without blocking real-time API responses.
3. **asyncpg (`asyncpg`):**
   - *Why we used it:* The fastest asynchronous PostgreSQL driver for Python.
4. **Alembic (`alembic`):**
   - *Why we used it:* Automated database migration and version control tool for database schemas.
5. **Redis & Redis Streams (`redis`):**
   - *Why we used it:* Ultra-fast in-memory data store. Redis Streams buffers raw incoming telemetry and distributes it to detection workers with sub-millisecond latency.

---

### D. Machine Learning, AI & Mathematics

1. **PyTorch (`torch`):**
   - *Why we used it:* Deep learning framework used for complex trajectory anomaly detection and temporal pattern recognition.
2. **Scikit-Learn (`scikit-learn`):**
   - *Why we used it:* Powers rule-enhanced machine learning models (Isolation Forests, classifiers, and clustering) for anomaly detection.
3. **SHAP (`shap`):**
   - *Why we used it:* Explainable AI (XAI). Provides mathematical proof (SHapley values) explaining *which* exact telemetry inputs caused an alert.
4. **NumPy & SciPy (`numpy`, `scipy`):**
   - *Why we used it:* Fast vector operations, geodesic distance (Haversine) formulas, and kinematic physics validation (speed, acceleration, turn rate).

---

### E. Security, Authentication & Observability

1. **python-jose & bcrypt (`python-jose`, `bcrypt`):**
   - *Why we used it:* Implements secure JSON Web Token (JWT) authentication and salted password hashing.
2. **OpenTelemetry & Prometheus (`opentelemetry-*`, `prometheus-client`):**
   - *Why we used it:* Measures backend performance, API response latency, and detection pipeline health.

---

### F. DevOps & Testing

1. **Docker & Docker Compose:**
   - *Why we used it:* Bundles Frontend, Backend, Redis, and PostgreSQL into portable containers for one-command deployment.
2. **Pytest & Pytest-Asyncio (`pytest`, `pytest-asyncio`, `pytest-cov`):**
   - *Why we used it:* Automated test suite covering API endpoints, async background workers, and machine learning detectors.
3. **Locust (`locust`):**
   - *Why we used it:* Load-testing tool that simulates thousands of simultaneous aircraft transmitting telemetry.
4. **Ruff & Black (`ruff`, `black`):**
   - *Why we used it:* Enforces clean, high-performance, standardized Python code formatting.
