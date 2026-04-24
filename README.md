# 🌿 AyurTrace — Blockchain Botanical Traceability

A full-stack blockchain app to trace Ayurvedic herbs from wild collector to final product label.

## Tech Stack (100% Free)
| Layer | Technology |
|-------|-----------|
| Blockchain | Hardhat + Solidity + Polygon Amoy Testnet |
| Backend | Node.js + Express + Ethers.js |
| Database | Supabase (PostgreSQL, free tier) |
| Frontend | React + Vite + Tailwind CSS |
| Maps | Leaflet.js |
| Auth | MetaMask wallet |
| Hosting | Vercel (frontend) + Render.com (backend) |

---

## Project Structure
```
ayurtrace/
├── blockchain/          # Hardhat project — smart contracts
│   ├── contracts/
│   │   └── HerbTrace.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── HerbTrace.test.js
│   └── hardhat.config.js
│
├── backend/             # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── config/
│   ├── .env.example
│   └── package.json
│
└── frontend/            # React + Vite app
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── utils/
    │   └── context/
    ├── .env.example
    └── package.json
```

---

## ✅ Prerequisites
Install these before starting:
1. [Node.js v18+](https://nodejs.org/) — check: `node --version`
2. [Git](https://git-scm.com/) — check: `git --version`
3. [MetaMask browser extension](https://metamask.io/) — install in Chrome/Firefox
4. A free [Supabase account](https://supabase.com)
5. A free [Alchemy account](https://alchemy.com)

---

## 🚀 STEP-BY-STEP SETUP

---

### STEP 1 — Clone & Install

```bash
# Clone the project
git clone <your-repo-url>
cd ayurtrace

# Install blockchain dependencies
cd blockchain
npm install

# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### STEP 2 — Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Wait for it to provision (~2 min)
3. Go to **SQL Editor** → paste and run this SQL:

```sql
-- Users / roles table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('collector','aggregator','processor','manufacturer','admin')),
  name TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Herb batches
CREATE TABLE batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT UNIQUE NOT NULL,
  herb_name TEXT NOT NULL,
  herb_latin TEXT,
  quantity_kg DECIMAL,
  status TEXT DEFAULT 'collected',
  current_node TEXT DEFAULT 'collector',
  tx_hash TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- All supply chain events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(batch_id),
  node_type TEXT NOT NULL,
  actor_wallet TEXT NOT NULL,
  actor_name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  location_name TEXT,
  notes TEXT,
  photo_url TEXT,
  tx_hash TEXT,
  block_number INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional for FYP demo)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow all for demo
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON batches FOR ALL USING (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true);
```

4. Go to **Settings → API** → copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `anon public` key → this is your `SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_KEY`

---

### STEP 3 — Get Alchemy RPC URL

1. Go to [dashboard.alchemy.com](https://dashboard.alchemy.com)
2. Create app → Network: **Polygon Amoy**
3. Copy the HTTPS URL → this is your `ALCHEMY_RPC_URL`

---

### STEP 4 — Get a Test Wallet & Free MATIC

1. Open MetaMask → Create new account (or use existing)
2. Add Polygon Amoy network to MetaMask:
   - Network name: `Polygon Amoy`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Symbol: `MATIC`
3. Go to [faucet.polygon.technology](https://faucet.polygon.technology/) → get free test MATIC
4. Export your private key from MetaMask: Settings → Account → Export Private Key
   → This is your `DEPLOYER_PRIVATE_KEY` (keep secret!)

---

### STEP 5 — Configure Environment Files

**blockchain/.env**
```
ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_metamask_private_key_here
```

**backend/.env**
```
PORT=5000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
ALCHEMY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=paste_after_deploy
JWT_SECRET=any_random_long_string_here_12345
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=paste_after_deploy
VITE_CHAIN_ID=80002
```

---

### STEP 6 — Deploy Smart Contract

```bash
cd blockchain

# First test on local Hardhat node
npx hardhat test

# Deploy to local Hardhat node (for local dev)
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Polygon Amoy testnet (for live demo)
npx hardhat run scripts/deploy.js --network amoy
```

📋 **Copy the contract address printed in the terminal**
→ Paste it into `backend/.env` → `CONTRACT_ADDRESS=0x...`
→ Paste it into `frontend/.env` → `VITE_CONTRACT_ADDRESS=0x...`

---

### STEP 7 — Run Locally (Development)

Open **3 terminals**:

**Terminal 1 — Local Blockchain**
```bash
cd blockchain
npx hardhat node
# Keep this running! It starts a local Ethereum node at http://127.0.0.1:8545
```

**Terminal 2 — Backend**
```bash
cd backend
npm run dev
# Runs at http://localhost:5000
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

Open browser → http://localhost:5173 🎉

---

### STEP 8 — Register Demo Users

Use the app's registration page or run this in your browser console on the app:

**5 demo roles to register:**
1. Collector: Connect MetaMask → Register as `collector`
2. Aggregator: Connect MetaMask (different account) → Register as `aggregator`
3. Processor: Register as `processor`
4. Manufacturer: Register as `manufacturer`
5. Admin: Register as `admin`

> **Tip for demo:** Use MetaMask's "Add Account" to create 5 accounts. Fund each with test MATIC from the faucet.

---

### STEP 9 — Test the Full Flow

1. **Login as Collector** → Log new herb batch (Ashwagandha, GPS, photo)
2. **Login as Aggregator** → Accept batch, add weight and grade
3. **Login as Processor** → Log processing, add QC result
4. **Login as Manufacturer** → Add formulation reference
5. **Scan QR code** → See full journey on consumer verify page!

---

### STEP 10 — Deploy Live (Free)

**Frontend → Vercel:**
```bash
cd frontend
npm run build
# Install Vercel CLI: npm install -g vercel
vercel --prod
# Follow prompts, set env variables in Vercel dashboard
```

**Backend → Render.com:**
1. Push code to GitHub
2. Go to render.com → New Web Service → Connect GitHub repo
3. Set root directory: `backend`
4. Set environment variables from your `.env`
5. Deploy!

**Add UptimeRobot (prevent sleep):**
1. Go to [uptimerobot.com](https://uptimerobot.com) (free)
2. Add HTTP monitor → your Render URL → every 5 minutes
3. Done — backend stays awake!

---

## 🌿 Demo Herbs (Pre-loaded)
| Herb | Latin Name | Sanskrit |
|------|-----------|---------|
| Ashwagandha | Withania somnifera | अश्वगंधा |
| Tulsi | Ocimum tenuiflorum | तुलसी |
| Brahmi | Bacopa monnieri | ब्राह्मी |

---

## 📚 For Your Project Report
- **Smart Contract:** `blockchain/contracts/HerbTrace.sol`
- **Contract ABI:** auto-generated in `blockchain/artifacts/`
- **Test results:** run `npx hardhat test` and screenshot output
- **Architecture diagram:** see README architecture section above

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `MetaMask not connected` | Ensure MetaMask is on Polygon Amoy (Chain ID 80002) |
| `Transaction failed` | Check you have test MATIC in wallet |
| `Contract not found` | Re-run deploy script, update CONTRACT_ADDRESS in .env |
| `CORS error` | Ensure backend is running on port 5000 |
| `Supabase error` | Check SUPABASE_URL and keys in backend .env |
| `GPS not working` | Must access frontend via HTTPS or localhost |
