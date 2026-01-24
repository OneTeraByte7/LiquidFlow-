// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();
require("./routes/followers.js");

const app = express();
const server = http.createServer(app);

// --- Config ---
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const HYPERLIQUID_KEY = process.env.HYPERLIQUID_PRIVATE_KEY;

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json())

// --- Market & Meta Data ---
let marketData = {};
let metaData = { universe: [], marginTables: [] };
let spotMeta = []; // Spot metadata
let builderDexIndexMap = {}; // Map dex name to index for builder perps

// --- Trades File ---
const tradesFile = path.join(process.cwd(), 'trade.json');

const readTrades = () => {
  if (!fs.existsSync(tradesFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(tradesFile, 'utf8'));
  } catch (err) {
    console.error('Error reading trade.json:', err.message);
    return [];
  }
};

const saveTrade = (trade) => {
  try {
    const trades = readTrades();
    trades.unshift(trade);
    fs.writeFileSync(tradesFile, JSON.stringify(trades, null, 2));
  } catch (err) {
    console.error('Error saving trade:', err.message);
  }
};

// --- WebSocket Setup ---
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('marketData', marketData);
  socket.emit('tradeHistory', readTrades());
  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// --- Fetch Hyperliquid Market Data ---
const fetchMarketData = async () => {
  try {
    const metaRes = await axios.post(
      'https://api.hyperliquid.xyz/info',
      { type: 'meta', dex: '' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const universe = metaRes.data.universe || [];
    const marginTables = metaRes.data.marginTables || [];
    metaData = { universe, marginTables };

    const ctxRes = await axios.post(
      'https://api.hyperliquid.xyz/info',
      { type: 'metaAndAssetCtxs' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const assetUniverse = ctxRes.data[0]?.universe || [];
    const assetCtxs = ctxRes.data[1] || [];

    // Store spot info if available
    spotMeta = ctxRes.data[2] || [];

    // Store builder dex mapping
    if (ctxRes.data[3]) {
      builderDexIndexMap = ctxRes.data[3]; // example: {dexName: dexIndex}
    }

    const newMarketData = {};
    assetUniverse.forEach((asset, i) => {
      const ctx = assetCtxs[i] || {};
      const pair = `${asset.name}-USD`;
      newMarketData[pair] = {
        id: Number(asset.id || 0),
        name: asset.name,
        szDecimals: Number(ctx.szDecimals || 0),
        maxLeverage: asset.maxLeverage || 1,
        onlyIsolated: asset.onlyIsolated || false,
        markPx: Number(ctx.markPx) || 0,
        prevDayPx: Number(ctx.prevDayPx) || 0,
        funding: Number(ctx.funding) || 0,
        openInterest: Number(ctx.openInterest) || 0,
        dayNtlVlm: Number(ctx.dayNtlVlm) || 0,
        premium: Number(ctx.premium) || 0,
        impactPxs: ctx.impactPxs || [],
        oraclePx: Number(ctx.oraclePx) || 0,
        change: ctx.prevDayPx
          ? ((Number(ctx.markPx) - Number(ctx.prevDayPx)) / Number(ctx.prevDayPx)) * 100
          : 0,
        volume: Number(ctx.dayNtlVlm) || 0,
      };
    });

    marketData = newMarketData;
    io.emit('marketData', marketData);
  } catch (err) {
    console.error('Error fetching market data:', err.message);
  }
};

fetchMarketData();
setInterval(fetchMarketData, 5000);

// --- Helper for Asset IDs ---
const getAssetId = (pair, marketType = 'perp') => {
  if (marketType === 'spot') {
    const spotInfo = spotMeta.find(s => `${s.base}/${s.quote}` === pair);
    return 10000 + (spotInfo?.index || 0);
  } else if (marketType === 'builder-perp') {
    const dexName = pair.split(':')[0];
    const coinName = pair.split(':')[1];
    const dexIndex = builderDexIndexMap[dexName] || 0;
    const metaIndex = metaData.universe.findIndex(a => a.name === coinName);
    return 100000 + dexIndex * 10000 + metaIndex;
  } else { // perpetual
    const coinName = pair.split('-')[0];
    const metaIndex = metaData.universe.findIndex(a => a.name === coinName);
    return metaIndex;
  }
};

// --- API Routes ---

// Market & Trades
app.get('/api/market', (req, res) => res.json({ data: marketData }));
app.get('/api/meta', (req, res) => res.json(metaData));
app.get('/api/trades', (req, res) => res.json({ trades: readTrades() }));

// Wallet info
app.get('/api/wallet', (req, res) => {
  if (!WALLET_ADDRESS) {
    return res.status(500).json({ error: 'Wallet address not set in environment' });
  }
  res.json({ address: WALLET_ADDRESS });
});

// Place Spot Trade
app.post('/api/spot-trade', async (req, res) => {
  try {
    const { pair, side, amount, price, orderType, sizeToken, marketType = 'spot' } = req.body;

    console.log('Spot trade request received:', { pair, side, amount, price, orderType, sizeToken, marketType });

    if (!pair || !side || !amount || !orderType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const assetId = getAssetId(pair, 'spot');
    const isBuy = side.toLowerCase() === 'buy';

    const orderWire = {
      a: assetId,
      b: isBuy,
      p: orderType === 'market' ? "0" : String(price),
      s: String(amount),
      r: false,
      t: orderType === 'market' ? { market: {} } : { limit: { tif: "Gtc" } },
    };

    const action = { type: "order", orders: [orderWire], grouping: "na" };
    const nonce = Date.now();

    console.log('Sending spot order to Python signing service:', { action, nonce });

    const signResp = await axios.post("http://127.0.0.1:8002/sign", {
      private_key: HYPERLIQUID_KEY,
      action,
      nonce
    });

    if (!signResp.data?.signature) {
      return res.status(500).json({ error: 'Signing service failed', details: signResp.data });
    }

    const hyperliquidRequest = {
      action,
      nonce,
      signature: signResp.data.signature,
      vaultAddress: WALLET_ADDRESS,
      expiresAfter: nonce + 60000
    };

    console.log('Sending spot order to Hyperliquid:', JSON.stringify(hyperliquidRequest, null, 2));

    const hlResp = await axios.post("https://api.hyperliquid.xyz/exchange", hyperliquidRequest, { headers: { "Content-Type": "application/json" } });
    const hlResult = hlResp.data;
    console.log('Hyperliquid spot response:', hlResult);

    const executionPrice = orderType === 'market' ? Number(price) : Number(price);
    const totalValue = parseFloat(amount) * executionPrice;
    const fee = totalValue * 0.001;

    const trade = {
      pair, side, amount: Number(amount), price: executionPrice,
      total: totalValue, fee, orderType, sizeToken, marketType,
      status: hlResult.status || 'submitted',
      timestamp: new Date().toISOString(), hyperliquid: hlResult,
    };

    saveTrade(trade);
    io.emit('newTrade', trade);

    res.json({ success: true, trade, hyperliquid: hlResult, requestSent: hyperliquidRequest });
  } catch (err) {
    console.error('Error placing spot trade:', err.message, err.response?.data || '');
    res.status(500).json({ error: 'Failed to place spot trade', details: err.message, hyperliquid: err.response?.data || null });
  }
});

// Place Trade

app.post('/api/trade', async (req, res) => {
  try {
    const { pair, side, amount, price, orderType, leverage = 1, sizeType, reduceOnly = false, takeProfitStopLoss = false, marketType = 'perp' } = req.body;

    console.log('Trade request received:', { pair, side, amount, price, orderType, leverage, sizeType, reduceOnly, takeProfitStopLoss, marketType });

    if (!pair || !side || !amount || !orderType) return res.status(400).json({ error: 'Missing required parameters' });


    const coinName = pair.split('-')[0];
    console.log('Looking for coin:', coinName);
    console.log('Available universe:', metaData.universe?.map(u => u.name).slice(0, 10));
    
    const assetId = getAssetId(pair, marketType);
    const asset = marketData[pair] || { markPx: 0 };
    const isBuy = side.toLowerCase() === 'buy';

    console.log('Asset details:', { 
      assetId, 
      assetExists: !!asset.markPx, 
      markPrice: asset.markPx,
      universeLength: metaData.universe?.length 
    });

    // Validate asset
    if (assetId < 0 || !asset.markPx) {
      return res.status(400).json({ error: `Invalid asset: ${pair} not found` });
    }

    // Use even smaller test amount 
    const testAmount = "0.0001";
    console.log(`Using test amount: ${testAmount} instead of ${amount}`);
    
    // Validate minimum order size (some assets have minimums)
    const minSize = asset.szDecimals ? Math.pow(10, -asset.szDecimals) : 0.0001;
    console.log(`Minimum size for ${pair}:`, minSize, 'szDecimals:', asset.szDecimals);

    const orderWire = {
      a: assetId,
      b: isBuy,
      p: orderType === 'market' ? "0" : String(price),
      s: testAmount,
      r: reduceOnly,
      t: orderType === 'market' 
        ? { market: {} } 
        : { limit: { tif: "Gtc" } }, 
    };

    console.log('Order wire:', JSON.stringify(orderWire, null, 2));

    const action = { type: "order", orders: [orderWire], grouping: "na" };
    const nonce = Date.now();

    const signResp = await axios.post("http://127.0.0.1:8002/sign", {
      private_key: HYPERLIQUID_KEY,
      action,
      nonce
    });

    if (!signResp.data?.signature) {
      return res.status(500).json({ error: 'Signing service failed', details: signResp.data });
    }

    const hyperliquidRequest = {
      action,
      nonce,
      signature: signResp.data.signature
    };

    console.log('Sending to Hyperliquid:', JSON.stringify(hyperliquidRequest, null, 2));

    const hlResp = await axios.post("https://api.hyperliquid.xyz/exchange", hyperliquidRequest, { 
      headers: { "Content-Type": "application/json" } 
    });
    
    const hlResult = hlResp.data;
    console.log('Hyperliquid response:', JSON.stringify(hlResult, null, 2));

    const executionPrice = orderType === 'market' ? Number(asset.markPx) : Number(price);
    const totalValue = parseFloat(testAmount) * executionPrice;
    const fee = totalValue * 0.001;

    const trade = {
      pair, side, amount: Number(testAmount), price: executionPrice,
      total: totalValue, fee, leverage, orderType, sizeType,
      reduceOnly, takeProfitStopLoss, status: hlResult.status || 'submitted',
      pnl: 0, timestamp: new Date().toISOString(), hyperliquid: hlResult,
    };

    saveTrade(trade);
    io.emit('newTrade', trade);

    res.json({ success: true, trade, hyperliquid: hlResult, requestSent: hyperliquidRequest });
  } catch (err) {
    console.error('Error placing trade:', err.message);
    console.error('Full error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    res.status(500).json({ 
      error: 'Failed to place trade', 
      details: err.message, 
      hyperliquid: err.response?.data || null,
      status: err.response?.status || 'unknown'
    });
  }
});

app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
