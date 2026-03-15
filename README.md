# AI-EVENTMANG

This repository is deployed as two separate Vercel projects:

- Frontend (Next.js): `frontend`
- Backend (Vercel Serverless Functions): `frontend/backend`

## Live URLs

- Frontend: https://frontend-one-jet-62.vercel.app
- Backend: https://backend-gold-one-92.vercel.app
- Backend health endpoint: https://backend-gold-one-92.vercel.app/api/health

## Project Structure

AI-EVENTMANG/
- frontend/
	- app/
	- components/
	- public/
	- package.json
	- backend/
		- api/
		- package.json
		- vercel.json
- README.md

## Run Locally

### Frontend

1. Go to frontend folder.
2. Install dependencies.
3. Run dev server.

```bash
cd frontend
npm install
npm run dev
```

Optional environment variable for frontend:

```bash
NEXT_PUBLIC_BACKEND_URL=https://backend-gold-one-92.vercel.app
```

### Backend

```bash
cd frontend/backend
npx vercel dev
```

## Deploy

### Frontend deploy

```bash
cd frontend
npx vercel --prod --yes
```

### Backend deploy

```bash
cd frontend/backend
npx vercel --prod --yes
```
