# MGNREGA District Performance Dashboard

A production-ready web application that allows rural citizens to view and understand monthly MGNREGA district performance data in an accessible, low-literacy-friendly format.

## Features

- 📊 Simple visualizations and trend analysis
- 📱 Mobile-first, low-bandwidth optimized UI
- 🗺️ Geolocation-based district auto-detection
- ⚡ Redis caching for fast performance
- 🔄 Automated ETL with cron jobs
- 📈 Comparative insights (district vs state, current vs past)

## Tech Stack

- **Frontend & API**: Next.js 14 (TypeScript)
- **Database**: MongoDB
- **Cache**: Redis
- **ETL**: Cron jobs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

3. Run MongoDB and Redis locally (or use cloud services)

4. Start development server:
```bash
npm run dev
```

5. Run ETL to fetch initial data:
```bash
npm run etl
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `DATA_GOV_API_KEY`: API key from data.gov.in
- `NEXT_PUBLIC_APP_URL`: Application URL

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Set up cron jobs for ETL (use PM2, systemd, or cloud scheduler)

## License

MIT
