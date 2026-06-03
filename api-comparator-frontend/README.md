# API Comparator Frontend

Futuristic React + Vite + Tailwind CSS frontend for the API Specification Comparator backend.

## Tech Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- YAML parser for JSON/YAML/OpenAPI ingestion

## Features
- Dark neon/glassmorphism dashboard
- Drag-and-drop uploads for base and comparator API files
- Split and unified diff views
- Endpoint hierarchy sidebar with filters
- Summary cards and method distribution chart
- Terminal-style error prompt for upload/parse/backend failures

## Local Setup
```bash
cd "/home/tanmay/Desktop/API comparartor/api-comparator-frontend"
cp .env.example .env
npm install
npm run dev
```

By default, the app expects the backend at:
```bash
http://127.0.0.1:8000/api/v1
```

If your backend runs on a different host or port, update `VITE_API_BASE_URL` in `.env`.
