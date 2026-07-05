# Quick Start - 5 Minutes

## 1️⃣ Get Replicate API Key (2 min)

1. Go to [replicate.com](https://replicate.com) → Sign up (free)
2. Copy API key from Settings
3. Done!

## 2️⃣ Set Up Backend (1 min)

```bash
cd backend
cp .env.example .env.local
```

Edit `.env.local`:
```
REPLICATE_API_KEY=paste_your_key_here
NODE_ENV=development
PORT=5000
```

## 3️⃣ Run Backend (1 min)

```bash
cd backend
npm install
npm run dev
```

Wait for: `✨ Painting App Backend running at http://localhost:5000`

## 4️⃣ Run Frontend (1 min)

In a **new terminal**:

```bash
cd frontend
npm install
npm start
```

Browser opens to `http://localhost:3000` automatically.

## 5️⃣ Test It!

1. Upload a sketch/photo
2. Wait 1-2 minutes
3. Download the 4 styles
4. Done!

---

## 📁 Project Structure

```
painting-app/
├── backend/              # Node.js + Express
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/painting.ts
│   │   ├── services/stableDiffusion.ts
│   │   └── types/index.ts
│   ├── package.json
│   └── .env.local        ← Add your API key here
│
├── frontend/             # React + Tailwind
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Visualizer.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── StyleResults.tsx
│   │   └── index.tsx
│   └── package.json
│
├── README.md
├── SETUP.md              # Full setup guide
├── DEVELOPMENT.md        # Dev workflow
└── ARCHITECTURE.md       # Tech decisions
```

---

## 🔧 Tech Stack

| Part | Tech | Why |
|------|------|-----|
| **Frontend** | React + TypeScript | Type safety + fast dev |
| **Styling** | Tailwind CSS | No CSS files needed |
| **State** | React Query | Auto caching + retries |
| **Backend** | Express + TypeScript | Lightweight + typed |
| **API** | Replicate | Simple auth, good docs |

---

## 🎨 How It Works

```
1. User uploads image
2. Frontend converts to Base64
3. Backend sends to Replicate API
4. Stable Diffusion generates 4 styles
5. URLs returned to frontend
6. User downloads each style
```

Processing time: **1-2 minutes** (parallel generation)

Cost: **~$0.10 per upload** (4 styles × ~$0.025 each)

---

## 🚀 Next Steps

✅ Local dev environment ready

**Next in Week 1:**
- [ ] Test with your own paintings
- [ ] Tweak style prompts for better results
- [ ] Add image compression
- [ ] Improve UI/UX based on testing

**Week 2+:**
- [ ] Feature 2: Color mixing
- [ ] Mobile responsiveness
- [ ] Deploy to Vercel
- [ ] Get feedback from artists

---

## 🆘 Troubleshooting

**Backend won't start?**
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

**Can't connect frontend to backend?**
- Verify backend running on `localhost:5000`
- Check `frontend/package.json` has `"proxy": "http://localhost:5000"`
- Restart frontend after backend starts

**API calls failing?**
- Check `.env.local` has correct API key
- No spaces in key
- Account has credits (check Replicate dashboard)

**Images not generating?**
- Try different image (size 500KB-5MB works best)
- Check backend console for error details
- Verify Replicate API status

---

## 📚 Learn More

- **Architecture**: See `ARCHITECTURE.md`
- **Full Setup**: See `SETUP.md`
- **Development**: See `DEVELOPMENT.md`
- **Original Plan**: See Obsidian notes

## 💡 Tips

- Keep backend + frontend terminals open side-by-side
- Monitor backend logs while testing
- First run takes longer (model downloads)
- Use small test images (~500KB) first
- Check Replicate usage regularly to manage costs

**You're ready! Start the servers and test with an image. 🎨**
