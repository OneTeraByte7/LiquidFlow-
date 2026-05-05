# LiquidFlow 🚀

> A comprehensive full-stack cryptocurrency trading platform for the Hyperliquid exchanges

A professional trading ecosystem built with **React**, **Node.js**, and **Python**. LiquidFlow provides secure perpetual and spot trading with an AI-powered assistant, real-time market data, advanced charting, and intelligent portfolio management.

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd Hyperliquid

# 2. Install all dependencies
npm run install-all

# 3. Set up environment variables
# Copy .env files to server/, client/, and python/ directories
# Fill in your Privy and Hyperliquid credentials

# 4. Start development
npm run dev

# Done! Open http://localhost:3000
```

---

## 🎯 Overview

This project is a complete trading ecosystem that combines:
- **Privy** for secure wallet management and authentication
- **Hyperliquid SDK** for perpetual and spot trading
- **WebSocket** for real-time market data and price updates
- **FastAPI** for Python-based trading bot and signing API
- **React** with Tailwind CSS for a modern, responsive UI

Perfect for traders who want a secure, feature-rich platform for managing cryptocurrency portfolios on Hyperliquid with LiquidFlow's intelligent trading tools.

---

## 📁 Project Structure

```
Hyperliquid/
├── client/                  # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── CandleChart.js
│   │   │   ├── Charts.js
│   │   │   ├── Chat.js
│   │   │   ├── Layout.js
│   │   │   ├── Trading.js
│   │   │   ├── Vault.js
│   │   │   ├── TradeHistory.js
│   │   │   └── Wallet.js
│   │   ├── contexts/        # React contexts
│   │   │   └── ThemeContext.js
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   └── package.json
├── server/                  # Node.js/Express backend
│   ├── routes/
│   │   └── followers.js     # Follower routes
│   ├── server.js            # Express server entry point
│   ├── db.js                # Database configuration
│   ├── trade.js             # Trade logic and order handling
│   ├── privy.js             # Privy integration
│   ├── followers.json       # Followers data
│   └── trade.json           # Trade data
├── python/                  # Python FastAPI services
│   ├── bot.py               # Trading bot service
│   ├── hl_client.py         # Hyperliquid client wrapper
│   ├── signing_api.py       # Signing API service
│   ├── signing.py           # Signing utilities
│   ├── new.py               # Additional trading utilities
│   ├── requirements.txt     # Python dependencies
│   └── __pycache__/
├── wallets.js               # Wallet configuration
└── package.json             # Root package configuration
```

---

## ✨ Features

### 🔹 Chat Page (`/chat`)
- **AI-powered trading assistant** for market insights
- Real-time responses about market conditions
- Portfolio analysis and trading recommendations
- Natural language queries for trading information

### 🔹 Trading Page (`/trading`)
- **Live market data** for major cryptocurrencies (ETH, BTC, SOL, AVAX)
- **Place orders** - Market and limit orders
- **Leverage trading** - Up to 10x leverage support
- Real-time price updates and portfolio statistics
- Order management and execution tracking

### 🔹 History Page (`/history`)
- **Complete trade history** with advanced filters
- **Export functionality** - Download trades as CSV
- **PnL tracking** - Profit/Loss analysis
- Advanced search by trading pair and date range
- Performance metrics and statistics

### 🔹 Charts Page (`/charts`)
- **Interactive charts** - Line, Area, and Candlestick charts
- **Multiple timeframes** - 1H, 4H, 1D, 1W, 1M
- Volume analysis and portfolio performance tracking
- Real-time data updates synchronized with market

### 🔹 Wallet Management
- Secure wallet integration via Privy
- Multi-wallet support
- Vault management for funds
- Secure signing and authentication

### 🔹 Real-Time Updates
- WebSocket connections for live market prices
- Instant trade notifications
- Market data streaming (every 3 seconds)
- Live portfolio value updates

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, JavaScript, Tailwind CSS, Recharts, Socket.IO |
| **Backend** | Node.js, Express, Socket.IO, Mongoose |
| **Authentication** | Privy (Wallet Management), JWT |
| **Trading** | Hyperliquid SDK, Ethers.js, BigNumber.js |
| **Python Services** | FastAPI, Uvicorn, Hyperliquid Python SDK |
| **Real-time** | WebSocket, Socket.IO |
| **DevOps** | Docker, Nodemon, Concurrently |

---

## �🚀 Installation & Setup

### Prerequisites
- **Node.js** v16+ and npm
- **Python** 3.8+
- **Git**

### 1. Clone Repository

```bash
git clone <repository-url>
cd Hyperliquid
```

### 2. Install All Dependencies

```bash
npm run install-all
```

This command installs dependencies for:
- Frontend (`client/`)
- Backend (`server/`)
- Python environment (`python/`)


### Option 3: Individual Services

**Start Frontend:**
```bash
cd client
npm start
# Opens at http://localhost:3000
```

**Start Backend:**
```bash
cd server
node server.js
# Server at http://localhost:5000
```

**Start Python Services:**
```bash
cd python
# Trading Bot
uvicorn bot:app --reload --port 8001

# Signing API (in another terminal)
uvicorn signing_api:app --reload --port 8002
```

### Option 4: Production Build

```bash
npm run build
npm start
```

---

## 🔐 Security & Authentication

### Privy Integration

Privy is used for secure wallet management:

```javascript
import { PrivyClient } from '@privy-io/server-auth';
import { createEthersSigner } from '@privy-io/server-auth/ethers';

const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_AUTH_PRIVATE_KEY,
    },
  }
);

// Create ethers-compatible signer
const signer = createEthersSigner({
  walletId,
  address,
  provider,
  privyClient,
});
```

### Hyperliquid SDK

The Hyperliquid SDK is initialized for trading operations:

```javascript
import * as hl from '@nktkas/hyperliquid';

const transport = new hl.HttpTransport();
const client = new hl.ExchangeClient({
  transport,
  wallet: signer
});

const infoClient = new hl.InfoClient({ transport });
```

---

## 📡 Trading API Operations

### 1. Retrieve Perpetual Asset Contexts

**Endpoint:** `POST https://api.hyperliquid.xyz/info`

```json
{
  "type": "metaAndAssetCtxs"
}
```

Returns: Mark prices, funding rates, open interest, and perpetual trading metadata.

### 2. Retrieve Spot Asset Contexts

**Endpoint:** `POST https://api.hyperliquid.xyz/info`

```json
{
  "type": "spotMetaAndAssetCtxs"
}
```

Returns: Spot market data and asset information.

### 3. Place Orders (Market/Limit)

Using Hyperliquid NodeJS SDK:

```javascript
const orderResponse = await client.order({
  orders: [
    {
      a: assetIndex,          // Asset index
      b: true,                // Buy order (true) or Sell (false)
      s: size.toString(),     // Order size
      r: false,               // Reduce-only flag
      p: price.toString(),    // Price (0 for market orders)
      t: { 
        trigger: { isMarket: true } 
      }
    },
  ],
  grouping: "na"
});
```

### 4. Check Account & Positions

```javascript
const userState = await infoClient.clearinghouseState({ 
  user: walletAddress 
});

console.log("Open positions:", userState.positions);
console.log("Account balance:", userState.marginSummary);
```

### 5. Pre-Transfer Verification

```javascript
const preCheck = await infoClient.preTransferCheck({
  user: wallet.address,
  source: "<crediting-address>"
});

if (!preCheck.userExists) {
  throw new Error("Hyperliquid account does not exist.");
}
```

---

### Python Dependencies Won't Install

```bash
# Upgrade pip
pip install --upgrade pip

# Install with no cache
pip install --no-cache-dir -r python/requirements.txt

# For Hyperliquid SDK specifically
pip install hyperliquid-python-sdk --no-cache-dir
```
---

## 📊 API Response Examples

### Get User State Example

```javascript
{
  "crossMarginSummary": {
    "accountValue": "10000.50",
    "totalNtlPos": "5000.25",
    "availableMargin": "4500.25"
  },
  "assetPositions": [
    {
      "positionValue": "1000.00",
      "position": {
        "coin": "ETH",
        "cumFunding": "0.50",
        "entryPrice": "2000.00",
        "leverage": {
          "type": "isolated",
          "rawUsd": "2000.00"
        }
      }
    }
  ]
}
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  LiquidFlow Platform                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │   Frontend   │◄───────►│   Backend    │          │
│  │   (React)    │         │  (Express)   │          │
│  └──────────────┘         └──────────────┘          │
│         ▲                         ▲                  │
│         │ WebSocket              │ REST API         │
│         └────┬────────────────────┘                 │
│              │                                       │
│              │                                       │
│         ┌────▼──────────────────┐                  │
│         │   Python Services      │                  │
│         │  ┌────────────────┐    │                  │
│         │  │  Trading Bot   │    │                  │
│         │  │  Signing API   │    │                  │
│         │  └────────────────┘    │                  │
│         └────┬───────────────────┘                  │
│              │                                       │
│              ▼                                       │
│  ┌────────────────────────────────────────┐       │
│  │   External APIs                        │       │
│  │  ┌─────────────────────────────────┐   │       │
│  │  │ Hyperliquid Exchange API        │   │       │
│  │  │ Privy Wallet API                │   │       │
│  │  └─────────────────────────────────┘   │       │
│  └────────────────────────────────────────┘       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

