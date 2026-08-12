# LinkSnap - Production-Grade Serverless URL Shortener & Analytics

LinkSnap is a modern, serverless URL shortening and real-time analytics application built with AWS Serverless (Node.js/TypeScript Lambdas, Amazon API Gateway, Amazon MongoDB, AWS SAM IaC) and React 18+ (Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Leaflet).

---

## Technical Stack & Architecture

### Backend (AWS Serverless)
- **AWS SAM (Serverless Application Model)**: IaC defining API Gateway, Lambda handlers, MongoDB tables, and IAM policies.
- **Node.js 20.x / TypeScript**: Compiled Lambda handlers using AWS SDK v3 (`@aws-sdk/client-MongoDB`, `@aws-sdk/lib-MongoDB`).
- **Amazon MongoDB**:
  - `LinkSnap_URLs`: PK `url_id`, stores original URL, creator ID, created_at, expires_at, total_clicks, custom_slug.
  - `LinkSnap_Clicks`: PK `click_id`, SK `timestamp`, GSI1PK `url_id`, SK `timestamp`, stores anonymized IP, country, city, device type, browser, referer.
- **Amazon API Gateway**: REST API endpoints with full CORS support (`/api/v1/shorten`, `/{shortCode}`, `/api/v1/analytics/{shortCode}`).

### Frontend
- **React 18+ & TypeScript**: Built with Vite for instant HMR.
- **Tailwind CSS**: Sleek dark-mode aesthetic with custom brand palettes, glassmorphism blur, and glow effects.
- **Recharts**: Time-series click volume area chart, device distribution donut pie charts, browser breakdown.
- **Leaflet & React-Leaflet**: Geographic heat map with dark CartoDB tiles and interactive click pins.
- **QRCode**: SVG/PNG canvas QR code generator with instant download options.

---

## Project Structure

```
.
├── backend/                        # AWS Serverless Backend
│   ├── template.yaml               # AWS SAM Infrastructure as Code Template
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── handlers/
│       │   ├── shortenUrl.ts       # POST /api/v1/shorten
│       │   ├── redirectUrl.ts      # GET /{shortCode} (301/302 Redirect + Telemetry)
│       │   └── getAnalytics.ts     # GET /api/v1/analytics/{shortCode}
│       ├── utils/
│       │   ├── MongoDB.ts
│       │   ├── geoip.ts
│       │   ├── userAgent.ts
│       │   └── response.ts
│       └── types/
│           └── index.ts
├── src/                            # Frontend React Application
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── UrlShortenerForm.tsx
│   │   ├── QrCodeModal.tsx
│   │   ├── LinkTable.tsx
│   │   ├── EditSlugModal.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── MetricsChart.tsx
│   │   ├── GeoHeatMap.tsx
│   │   └── BreakdownCharts.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── mockData.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Local Development & Setup

### Prerequisites
- **Node.js**: v18 or later
- **npm**: v9 or later
- **AWS CLI & SAM CLI**: (Optional, for AWS deployment)

### Step 1: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Run Local Dev Server
```bash
npm run dev
```
The React frontend will start at `http://localhost:3000`. By default, it runs in **Interactive Demo Mode** pre-loaded with realistic URL analytics data. You can toggle to **Live AWS** in the top navigation bar.

---

## AWS Serverless Deployment Instructions

### 1. Build Backend Lambdas
```bash
cd backend
npm run build
```

### 2. Validate & Deploy SAM Stack
```bash
sam validate
sam deploy --guided
```
SAM will deploy the stack and output your API Gateway base endpoint URL (e.g. `https://xyz.execute-api.us-east-1.amazonaws.com/Prod`).

### 3. Connect Frontend to Live AWS Backend
Create a `.env.local` file in the root directory:
```env
VITE_API_ENDPOINT=https://xyz.execute-api.us-east-1.amazonaws.com/Prod
```
Rebuild and launch the frontend (`npm run dev` / `npm run build`).

---

## API Endpoints Specification

### 1. `POST /api/v1/shorten`
Creates a shortened link.
- **Request Body**:
  ```json
  {
    "originalUrl": "https://github.com/aws/aws-sam-cli",
    "customSlug": "sam-cli-repo",
    "expiresAt": "2026-12-31T23:59:59Z",
    "title": "AWS SAM CLI Repository"
  }
  ```
- **Response** (HTTP 201 Created):
  ```json
  {
    "shortCode": "sam-cli-repo",
    "shortUrl": "https://lsnap.link/sam-cli-repo",
    "originalUrl": "https://github.com/aws/aws-sam-cli",
    "createdAt": "2026-07-27T22:58:00.000Z",
    "expiresAt": "2026-12-31T23:59:59Z",
    "totalClicks": 0
  }
  ```

### 2. `GET /{shortCode}`
URL Redirection handler.
- Performs a 301/302 HTTP Redirect to the destination URL.
- Atomically increments `total_clicks` in `LinkSnap_URLs`.
- Logs anonymized telemetry (`ip_address`, `country`, `city`, `device_type`, `browser`, `referer`) to `LinkSnap_Clicks`.

### 3. `GET /api/v1/analytics/{shortCode}`
Queries analytics for a link.
- **Query Params**: `timeframe` (`24h`, `7d`, `30d`, `all`).
- **Response** (HTTP 200 OK):
  ```json
  {
    "shortCode": "sam-cli-repo",
    "originalUrl": "https://github.com/aws/aws-sam-cli",
    "totalClicks": 1482,
    "timeframe": "7d",
    "timeSeriesData": [...],
    "geoDistribution": [...],
    "deviceBreakdown": [...],
    "topReferrers": [...],
    "browserBreakdown": [...]
  }
  ```
