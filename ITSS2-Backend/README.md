# ITSS2 Backend

Express + TypeScript API for the ITSS2 job application.

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Required environment variables:

- `PORT`: API port, defaults to `8080`.
- `MONGO_URL`: MongoDB connection string.
- `CORS_ORIGINS`: comma-separated frontend origins, for example `http://localhost:5173,https://itss2.vercel.app`.

Never commit real MongoDB credentials. If a credential has been shared publicly, rotate it in MongoDB Atlas before deploying.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## API

- `GET /healthz`
- `GET /api/v1/jobs`
- `GET /api/v1/jobs/detail/:id`
- `GET /api/v1/address`
- `GET /api/v1/users/:id`
- `POST /api/v1/users/:id`
- `GET /api/v1/users/:id/suggested-jobs`
- `GET /api/v1/users/:id/get-category-list`

Common job query parameters include `keyword`, `address`, `category`, `jobForm`, `jobType`, `minSalary`, `maxSalary`, `days`, `available`, `sortKey`, `sortValue`, `page`, and `limit`.
