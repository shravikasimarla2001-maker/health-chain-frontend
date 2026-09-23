# Health Supply Chain Platform — Web Frontend

Interactive React 19 + TypeScript + Vite web application for the Multi-tenant Health Supply Chain Platform.

Provides role-specific interactive workspaces for System Admins, National, State, District Health Officers, and PHC Pharmacists with visual workflow management, RBAC access checks, and federated supply insights.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x+

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` (optional, for configuring external backend URL):
```bash
cp .env.example .env
```

`VITE_BACKEND_URL` defaults to the production cloud backend API URL, but can also be overridden inside the UI settings or via `.env`.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Scripts

- **`npm run dev`**: Launch local Vite development server with HMR.
- **`npm run build`**: Build production distribution bundle in `dist/`.
- **`npm run preview`**: Locally preview production build.
- **`npm run lint`**: Run TypeScript type-checking (`tsc --noEmit`).

---

## 🐳 Docker Containerization

To build and run the frontend in a container using Nginx:

```bash
docker build -t health-chain-frontend .
docker run -p 8080:8080 health-chain-frontend
```
Then access the application at [http://localhost:8080](http://localhost:8080).

---

## 📂 Project Structuree

```
├── public/              # Static assets
├── src/
│   ├── components/      # UI components & role-specific dashboards
│   ├── context/         # React Context (Auth, Theme, Loggers)
│   ├── data/            # Seed accounts & mock datasets
│   ├── services/        # API service layer (authApi.ts, geminiApi.ts)
│   ├── types.ts         # TypeScript interfaces & types
│   ├── App.tsx          # Main Application component
│   └── main.tsx         # React root entry point
├── Dockerfile           # Multi-stage Docker build with Nginx
├── nginx.conf           # Nginx server configuration
├── index.html           # HTML template
├── package.json         # Dependencies and npm scripts
└── vite.config.ts       # Vite configuration
```
