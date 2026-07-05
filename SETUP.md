# Painting App - Technical Setup Guide

This guide walks you through getting the painting visualization tool running locally.

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **npm 9+** (comes with Node.js)
- **Replicate API key** (free account)

## Step 1: Get Replicate API Key

1. Go to [replicate.com](https://replicate.com)
2. Sign up for a free account
3. Copy your API key from Settings → API Token
4. Save it somewhere safe

## Step 2: Set Up Environment

Create `.env.local` in the `backend` folder:

```bash
cd backend
cp .env.example .env.local
```

Edit `.env.local` and add your Replicate API key:

```
REPLICATE_API_KEY=your_replicate_key_here
NODE_ENV=development
PORT=5000
MAX_FILE_SIZE=10485760
INFERENCE_TIMEOUT=60000
```

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
✨ Painting App Backend running at http://localhost:5000
📝 API endpoint: /api/painting
```

Keep this terminal open.

## Step 5: Install Frontend Dependencies

In a **new terminal**:

```bash
cd frontend
npm install
```

## Step 6: Start Frontend Development Server

```bash
cd frontend
npm start
```

The app will automatically open at `http://localhost:3000`

## Testing the Full Flow

1. **Upload Image**: Click or drag an image into the upload box
2. **Generate Styles**: The backend will call Replicate API
3. **Wait**: First generation takes 1-2 minutes (API processes in parallel)
4. **Download**: Click "Download" button on each style

## Troubleshooting

### "REPLICATE_API_KEY not configured"
- Check `.env.local` has correct key
- Verify key is copied exactly (no spaces)
- Restart backend: `npm run dev`

### "Failed to visualize image"
- Check backend console for detailed error
- Verify API key is active and has credits
- Try a different image file

### CORS errors
- Backend runs on port 5000
- Frontend proxy is configured in `package.json`
- Keep both servers running

### Image upload fails
- Max file size: 10MB
- Supported formats: JPG, PNG, WebP, GIF
- Try a different image

## File Structure

```
painting-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── routes/painting.ts     # API endpoints
│   │   ├── services/stableDiffusion.ts  # Replicate integration
│   │   └── types/index.ts         # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local                 # Your API keys (gitignored)
│
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── index.tsx              # React entry
│   │   ├── App.tsx                # Main component
│   │   └── components/
│   │       ├── Visualizer.tsx     # Main UI logic
│   │       ├── ImageUpload.tsx    # Upload & preview
│   │       └── StyleResults.tsx   # Results grid
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── README.md                       # Project overview
└── SETUP.md                        # This file
```

## API Endpoints

### POST `/api/painting/visualize`
Generate 4 painting styles

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "styles": [
    {
      "id": "watercolor",
      "label": "Watercolor",
      "imageUrl": "https://..."
    },
    {
      "id": "oil",
      "label": "Oil Painting",
      "imageUrl": "https://..."
    },
    {
      "id": "ink",
      "label": "Ink Drawing",
      "imageUrl": "https://..."
    },
    {
      "id": "acrylic",
      "label": "Acrylic Canvas",
      "imageUrl": "https://..."
    }
  ],
  "processingTime": 125000
}
```

### GET `/api/painting/styles`
List available painting styles

## Cost Tracking

- Replicate charges ~$0.01-0.05 per image
- 4 styles = ~$0.04-0.20 per upload
- Budget: $50-100/month for validation

Check your usage at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

## Next Steps

1. ✅ Tech setup complete
2. 📝 Test with your own paintings
3. 🎨 Refine prompts for better style matching
4. 📱 Add mobile optimization
5. 🚀 Deploy to Vercel (Week 4-5)

## Deployment (Later)

When ready to launch:

```bash
# Frontend to Vercel
cd frontend
npm install -g vercel
vercel

# Backend to Vercel
cd backend
vercel
```

Connect environment variables in Vercel dashboard.

## Support

- **Replicate Docs**: [replicate.com/docs](https://replicate.com/docs)
- **React Docs**: [react.dev](https://react.dev)
- **Express Docs**: [expressjs.com](https://expressjs.com)
