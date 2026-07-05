# Architecture & Technical Decisions

## System Design

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **State Management**: React Query (for API data)
- **Styling**: Tailwind CSS (utility-first)
- **HTTP Client**: Axios (promise-based)

**Why React Query?**
- Handles loading/error states automatically
- Caches API responses
- Retry logic built-in
- Simpler than Redux for this project

**Why Tailwind?**
- No CSS files to maintain
- Consistent design system
- Easy responsive design
- Faster development

### Backend (Node.js + Express)
- **Framework**: Express.js (minimal web framework)
- **Language**: TypeScript (type safety)
- **API Integration**: Axios (HTTP requests)
- **File Handling**: Base64 encoding (simpler than multipart)

**Why Express?**
- Lightweight, unopinionated
- Large ecosystem
- Easy middleware setup
- Perfect for simple APIs

**Why Base64 for images?**
- No need for multipart form data
- Easier to serialize/store
- Simpler CORS handling
- Works well with frontend fetch

### API Choice: Replicate vs Stability AI

**Replicate** (chosen for MVP):
✅ Simpler authentication (API key)
✅ Better polling/async handling
✅ Lower latency
✅ Free tier generous
✅ Comprehensive docs

**Stability AI** (future option):
- More models available
- Faster inference sometimes
- Different pricing model

## Data Flow

### Image Upload → Visualization

```
1. User selects image in browser
2. Frontend reads file as Base64
3. POST to /api/painting/visualize
4. Backend receives Base64 string
5. For each style:
   a. Create Replicate prediction
   b. Poll until complete (5s intervals)
   c. Return image URL from Replicate
6. Frontend receives all URLs
7. Display 4-style grid
8. User downloads individual images
```

### Response Format

```json
{
  "styles": [
    {
      "id": "watercolor",
      "label": "Watercolor",
      "imageUrl": "https://replicate.delivery/..."
    }
  ],
  "processingTime": 125000
}
```

## File Organization

### Backend Structure
```
backend/src/
├── index.ts                    # Server entry, middleware setup
├── routes/
│   └── painting.ts             # POST /visualize, GET /styles
├── services/
│   └── stableDiffusion.ts       # Replicate API calls
└── types/
    └── index.ts                # TypeScript interfaces
```

**Separation of concerns:**
- `routes/` = HTTP handling
- `services/` = Business logic
- `types/` = Type definitions

### Frontend Structure
```
frontend/src/
├── index.tsx                   # React entry point
├── App.tsx                     # Main layout
└── components/
    ├── Visualizer.tsx          # Container (state + logic)
    ├── ImageUpload.tsx         # Upload UI
    └── StyleResults.tsx        # Results grid
```

**Component hierarchy:**
- `App` → Page layout
- `Visualizer` → Feature container (handles state)
- `ImageUpload` → Child (upload UI)
- `StyleResults` → Child (results display)

## API Endpoints

### POST /api/painting/visualize
**Purpose**: Generate 4 painting style variations

**Request body:**
```typescript
{
  imageBase64: string;      // Required
  imageUrl?: string;        // Alternative (not yet implemented)
}
```

**Response:**
```typescript
{
  styles: [
    {
      id: string;
      label: string;
      imageUrl?: string;    // Replicate-hosted URL
      error?: string;       // Error message if failed
    }
  ];
  processingTime?: number;  // Milliseconds
}
```

**Timeout**: 60 seconds per style (configurable)

**Rate limiting**: None in MVP (add later if needed)

### GET /api/painting/styles
**Purpose**: List available painting styles and their prompts

**Response:**
```typescript
{
  styles: [
    {
      id: string;
      label: string;
      prompt: string;      // Used for Stable Diffusion
    }
  ];
}
```

## Performance Considerations

### Frontend
- **Image preview**: Show Base64 preview immediately (no upload needed)
- **Loading state**: Spinner during API call (~1-2 minutes)
- **Lazy loading**: Could defer ResultsStyle rendering
- **Image caching**: React Query handles response caching

### Backend
- **Parallel requests**: Generate all 4 styles simultaneously
- **Polling interval**: 5 seconds (balance between speed & rate limits)
- **Timeout**: 60 seconds (Stable Diffusion typically completes in 30-45s)
- **Error handling**: Individual styles can fail without blocking others

### API (Replicate)
- **Async inference**: Queue-based, not immediate
- **Cost**: ~$0.01-0.05 per image × 4 styles = ~$0.04-0.20 per upload
- **Rate limit**: Depends on account tier (typically 100+ concurrent)

## Security Considerations

### Input Validation
- File type check: Only image/* MIME types
- File size limit: 10MB max
- No filename stored on server

### API Security
- No authentication needed for MVP (stateless)
- CORS enabled for localhost (restrict in production)
- No sensitive data logged
- API keys never sent to frontend

### Output Safety
- Images served from Replicate CDN (trusted source)
- No user-generated code execution
- Sanitized error messages (don't leak stack traces to frontend)

## Error Handling Strategy

### Frontend Errors
```
User sees → What to do
"File too large" → Compress image, retry
"Generation failed" → Try different image, check API key
"Network error" → Check internet connection, retry
```

### Backend Errors
```
Error type → Handling
No API key → Return 500 with helpful message
API rate limit → Return 429, suggest retry later
Image decode error → Return 400, invalid image format
Timeout on prediction → Return 504, suggest retry
```

## Scaling Limitations (MVP)

**Current:**
- Single request at a time per user
- No persistence (stateless)
- No user tracking
- Basic error handling

**Future improvements:**
- Job queue (Bull.js)
- Database for history
- User accounts
- Better error recovery
- Caching layer (Redis)
- CDN for image hosting
- Monitoring & logging (Sentry)

## Technology Rationale

| Decision | Why | Alternative |
|----------|-----|--------------|
| React | Popular, fast, large ecosystem | Vue, Svelte |
| TypeScript | Catch errors early, better DX | JavaScript |
| Tailwind | Fast styling, consistent design | CSS modules, styled-components |
| Express | Minimal, flexible, lightweight | Fastify, Hapi |
| Replicate | Simple auth, good docs | Stability AI, Hugging Face |
| Base64 images | Simple, no file handling needed | Multipart form data |
| React Query | Automatic caching, retries | SWR, Axios interceptors |

## Browser Compatibility

- **Modern browsers only**: Chrome, Firefox, Safari (last 2 versions)
- **Mobile**: Responsive design (Tailwind handles this)
- **File API**: Requires FileReader API (IE 10+)

## Deployment Strategy (Future)

```
Frontend → Vercel (auto-deploy from git)
  ├── Builds: npm run build
  └── Serves: dist/ folder

Backend → Vercel Functions (serverless) or Node.js server
  ├── Runs: npm start (dist/index.js)
  └── Environment: .env from Vercel dashboard

Database → None yet (MVP is stateless)

CDN → Replicate serves images (already hosted)
```

## Cost Model

**Per image:**
- Replicate inference: $0.01-0.05 × 4 = $0.04-0.20
- Frontend hosting: $0 (Vercel free tier)
- Backend hosting: $0 (Vercel free tier)

**Monthly (rough estimate):**
- 100 users × 5 images/month = 500 images
- 500 × $0.10 avg = $50/month
- Budget: $100/month (validation phase)

## Monitoring & Analytics (Future)

```
Frontend:
  - Page views (Plausible)
  - User interaction (Segment)
  - Error tracking (Sentry)

Backend:
  - API latency (Cloud Monitoring)
  - Error rates (Sentry)
  - Request volume (Datadog)

Business:
  - Cost per image (Replicate usage)
  - User retention (custom)
  - Style preferences (analytics)
```
