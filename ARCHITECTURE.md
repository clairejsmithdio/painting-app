# Palette Architecture (v1 → v2)

## Project Structure

```
Painting app/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── services/     # Painting generation, color mixing
│   │   ├── routes/       # API endpoints
│   │   └── index.ts      # Server setup
│   └── .env.local        # HF_API_KEY, MOCK_API
│
├── frontend/             # OLD frontend (deprecated)
│
├── frontend-v2/          # NEW Lovable frontend
│   ├── src/
│   │   ├── routes/       # Home, Visualise, Mix, Inspire, Community
│   │   ├── components/   # React components
│   │   └── integrations/ # Supabase client
│   └── .env.local        # VITE_API_URL, Supabase keys
│
└── ARCHITECTURE.md
```

## Next: Set up Supabase

You need a Supabase account for:
- User authentication
- Community boards database
- Comments & likes storage

Go to https://supabase.com → Sign up (free tier) → Create new project

Then share your SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY and I'll:
1. Set up database tables
2. Configure the backend for boards/comments/likes
3. Wire everything together
