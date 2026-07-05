# Development Guide

## Architecture Overview

```
User Browser                Backend Server              Replicate API
    ↓                          ↓                            ↓
[Image Upload]  →  [POST /api/painting/visualize]  → [Call Stable Diffusion]
    ↓                          ↓                            ↓
[Show Results]  ←  [Returns 4 image URLs]           ← [Polls for completion]
```

## Development Workflow

### 1. Making Backend Changes

**Add new API endpoint:**

```typescript
// backend/src/routes/painting.ts
paintingRoutes.post('/new-feature', async (req: Request, res: Response) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Hot reload:** Changes auto-reload via `ts-node-dev`

### 2. Making Frontend Changes

**Add new component:**

```typescript
// frontend/src/components/MyComponent.tsx
import React from 'react';

export const MyComponent: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded">
      {/* Your component */}
    </div>
  );
};
```

**Import and use:**

```typescript
import { MyComponent } from './components/MyComponent';

// In your JSX
<MyComponent />
```

**Hot reload:** React dev server auto-refreshes on save

### 3. Styling

We use **Tailwind CSS** for all styling. No CSS files needed for most features.

**Common patterns:**
- Spacing: `p-4` (padding), `m-2` (margin), `gap-6` (grid gap)
- Colors: `bg-blue-600`, `text-slate-900`, `border-slate-200`
- Layout: `flex`, `grid`, `w-full`, `max-w-6xl`
- Responsive: `md:grid-cols-2` (medium screens and up)

**Example:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
  {/* 1 column on mobile, 2 on desktop */}
</div>
```

## Testing Locally

### 1. Image Test

Use any sketch/photo from your computer:
- Save a small test image (~500KB)
- Upload via browser
- Wait for processing
- Download results

### 2. API Test

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test styles endpoint
curl http://localhost:5000/api/painting/styles
```

### 3. Error Handling

Frontend shows:
- Loading spinner while processing
- Error message if API fails
- Empty state for failed individual styles

Backend logs:
- Request/response details
- API call timing
- Error stack traces

## Common Tasks

### Change Painting Styles

Edit `backend/src/services/stableDiffusion.ts`:

```typescript
const PAINTING_STYLES = [
  {
    id: 'my-style',
    label: 'My Custom Style',
    prompt: 'describe your custom style here',
  },
  // ...
];
```

**Tips for good prompts:**
- Be descriptive: "watercolor painting with soft washes"
- Include medium: "oil painting on canvas"
- Add quality: "high quality, artistic, professional"

### Adjust Image Size Limits

Backend: `backend/src/index.ts`
```typescript
app.use(express.json({ limit: '50mb' }));
```

Frontend: `frontend/src/components/ImageUpload.tsx`
```typescript
if (file.size > 20 * 1024 * 1024) { // 20MB
  alert('File too large');
}
```

### Add Loading State UI

Use React Query mutation status:
```typescript
const { isPending, isError, data } = visualizeMutation;

if (isPending) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
if (data) return <Results />;
```

### Debug API Issues

**Backend console:**
```
npm run dev
# Look for [styleId] messages
# Check response times
```

**Browser DevTools:**
- Network tab → See API calls
- Console → Check for JS errors
- Application → Check local storage

## Performance Tips

### Backend
- Image compression (in future phases)
- Request timeouts (60s default)
- Error retry logic (retry failed API calls)
- Caching (store processed images)

### Frontend
- Lazy load images
- Progressive image download
- Cancel requests on unmount
- Debounce file input

## Next Features (Phase 2+)

### Feature 2: Color Mixing
1. Add color extraction logic
2. Build paint database (JSON)
3. Implement Kubelka-Munk conversion
4. Add color picker UI
5. Display pigment recipes

### Enhancements
- Download all styles as ZIP
- Create project/save history
- Share results (generate short URLs)
- Side-by-side comparison
- Custom style parameters
- Batch processing
- Mobile app (React Native)

## Debugging Tips

### "Image processing never completes"
- Check Replicate API status
- Verify model version still exists
- Check API rate limits

### "Styles look bad"
- Tweak the prompts
- Try different base images
- Check if Stable Diffusion is having issues

### "Slow performance"
- Profile in DevTools
- Check network waterfall
- Monitor API response times
- Consider caching

## Code Quality

**TypeScript:** All code is typed. Use `any` only as last resort.

**Components:** Keep small and focused. One responsibility each.

**Naming:** Use clear, descriptive names. Avoid abbreviations.

**Error handling:** Always catch async errors. Provide user-friendly messages.

**Comments:** Only for non-obvious logic. Code should be self-documenting.

## Commit Strategy

```bash
# Feature work
git checkout -b feature/color-mixing

# Make changes, test
git add .
git commit -m "Add color mixing feature"

# Before merging
git push origin feature/color-mixing
# Create PR, get feedback, merge

# Release
git checkout main
git pull
npm run build
```

## Resources

- **React Query**: [tanstack.com/query](https://tanstack.com/query)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **Express.js**: [expressjs.com](https://expressjs.com)
- **Replicate API**: [replicate.com/docs](https://replicate.com/docs)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org)
