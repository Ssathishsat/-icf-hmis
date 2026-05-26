# ICF HMIS – Sick/Fit Monitoring Dashboard

**Principal Chief Medical Officer – Workforce Health Analytics System**  
Integral Coach Factory, Indian Railways

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + Recharts |
| Backend   | Node.js + Express                   |
| Database  | MySQL 8.0                           |
| Auth      | JWT (jsonwebtoken + bcryptjs)       |
| Export    | ExcelJS + PDFKit                    |

---

## Quick Start

### 1. Database Setup

```sql
-- Run in MySQL:
SOURCE icf-hmis/backend/database/schema.sql;
SOURCE icf-hmis/backend/database/seed.sql;
SOURCE icf-hmis/backend/database/stored_procedures.sql;
```

### 2. Backend

```bash
cd icf-hmis/backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend

```bash
cd icf-hmis/frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

---

## Demo Login Credentials

| Username  | Password   | Role  | Access         |
|-----------|------------|-------|----------------|
| admin     | Admin@123  | Admin | Full access    |
| pcmo      | Admin@123  | Admin | Full access    |
| sse_cmc   | Admin@123  | SSE   | CMC shop only  |
| sse_wrs   | Admin@123  | SSE   | WRS shop only  |
| sse_els   | Admin@123  | SSE   | ELS shop only  |

---

## Features

### Dashboard
- 8 KPI summary cards with glassmorphism effects
- Day-wise Sick/Fit trend (Area chart)
- Weekly analysis (Composed chart)
- Monthly trend (Line chart)
- Shop-wise distribution (Bar chart) — click to drilldown
- Supervisory vs Non-Supervisory (Pie chart)
- Department-wise trends (Horizontal bar)
- Risk Heatmap (Shop × Week)
- AI-based trend prediction (7-day forecast)
- SSE Performance table

### Monitoring Pages
- Sick Monitoring — filtered employee list
- Fit Monitoring — recovered employees
- Weekly Reports — new/recovered/pending/recurring tabs
- Shop Analytics — shop cards with risk levels + drilldown modal
- SSE Monitoring — contact directory + performance
- Employee Search — full search with history timeline

### Export Center
- Excel export (formatted with ICF branding)
- PDF export (landscape, printable)
- Print support

### Security
- JWT authentication (8h expiry)
- Role-based access (Admin / SSE / Viewer)
- SSE users restricted to their assigned shop
- Rate limiting (500 req/15min, 20 login/15min)
- Audit logging for all actions
- Helmet.js security headers

---

## Project Structure

```
icf-hmis/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── stored_procedures.sql
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/auth.js, rbac.js, auditLog.js
│   │   ├── routes/auth, dashboard, employees, shops,
│   │   │         analytics, sseMonitoring, reports, notifications
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/Sidebar, Navbar, Layout
    │   │   ├── dashboard/KPICard, charts (8 types)
    │   │   ├── modals/ShopDrilldownModal
    │   │   ├── filters/AdvancedFilters
    │   │   └── tables/EmployeeTable
    │   ├── pages/ (9 pages)
    │   ├── context/AuthContext, ThemeContext
    │   ├── hooks/useRealtime
    │   └── utils/api, helpers
    ├── tailwind.config.js
    └── package.json
```

---

## API Endpoints

| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| POST   | /api/auth/login                       | Login                    |
| GET    | /api/auth/me                          | Current user             |
| GET    | /api/dashboard/kpi                    | KPI summary cards        |
| GET    | /api/dashboard/daywise-trend          | Day-wise trend data      |
| GET    | /api/dashboard/shop-distribution      | Shop distribution        |
| GET    | /api/dashboard/category-distribution  | Supervisory breakdown    |
| GET    | /api/employees                        | Employee list (paginated)|
| GET    | /api/employees/:emis                  | Employee detail + history|
| GET    | /api/shops                            | Shop master list         |
| GET    | /api/shops/:code/drilldown            | Shop drilldown detail    |
| GET    | /api/analytics/weekly                 | Weekly trend             |
| GET    | /api/analytics/monthly                | Monthly trend            |
| GET    | /api/analytics/department-trends      | Department breakdown     |
| GET    | /api/analytics/sse-performance        | SSE performance          |
| GET    | /api/analytics/heatmap                | Risk heatmap data        |
| GET    | /api/analytics/predictions            | AI trend prediction      |
| GET    | /api/sse-monitoring/weekly            | Weekly monitoring module |
| GET    | /api/sse-monitoring/contacts          | SSE contact directory    |
| GET    | /api/reports/export/excel             | Export to Excel          |
| GET    | /api/reports/export/pdf               | Export to PDF            |
| GET    | /api/notifications                    | Notifications list       |

---

© 2024 Integral Coach Factory · Indian Railways
