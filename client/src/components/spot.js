// src/components/Spot.js
import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = "https://liquidflow.onrender.com"; // adjust if deployed

const HyperliquidSpotData = () => {
  const { darkMode } = useTheme();

  const [assets, setAssets] = useState([]);
  const [selectedPair, setSelectedPair] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [side, setSide] = useState("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // New state for spot trading features
  const [sizeToken, setSizeToken] = useState('HYPE'); // The token being sized
  const [sizePercentage, setSizePercentage] = useState(0);
  const [availableBalance, setAvailableBalance] = useState({ amount: 0.00, token: 'USDC' });
  const [timeInForce, setTimeInForce] = useState('Gtc'); // Default TIF state

  // Fetch spot meta + assetCtxs
  const fetchSpotMarkets = async () => {
    try {
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
      });

      const data = await res.json();

      const meta = data[0] || {};
      const tokens = meta.tokens || [];
      const universe = meta.universe || [];
      const contexts = data[1] || [];

      const merged = universe.map((market, idx) => {
        const ctx = contexts[idx] || {};

        // safer way: resolve token indexes into real names
        const tokenNames = market.tokens.map((tIdx) => tokens[tIdx]?.name).filter(Boolean);
        const pair = tokenNames.join("/"); // e.g. PURR/USDC

        return {
          pair,
          base: tokenNames[0] || "",
          quote: tokenNames[1] || "",
          markPx: Number(ctx.markPx) || 0,
          prevDayPx: Number(ctx.prevDayPx) || 0,
          dayNtlVlm: Number(ctx.dayNtlVlm) || 0,
          change: ctx.prevDayPx
            ? ((Number(ctx.markPx) - Number(ctx.prevDayPx)) / Number(ctx.prevDayPx)) * 100
            : 0,
        };
      });

      setAssets(merged);

      if (!selectedPair && merged.length > 0) {
        setSelectedPair(merged[0].pair);
        setSizeToken(merged[0].base); // Set default size token to base token
      }
    } catch (err) {
      console.error("Error fetching spot markets:", err);
      toast.error("Failed to fetch spot data");
    }
  };

  useEffect(() => {
    fetchSpotMarkets();
    const interval = setInterval(fetchSpotMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update size token when pair changes
    const selectedAsset = assets.find(a => a.pair === selectedPair);
    if (selectedAsset) {
      setSizeToken(selectedAsset.base);
    }
  }, [selectedPair, assets]);

  const tradingPairs = assets.map((a) => a.pair);
  const selectedAsset = assets.find(a => a.pair === selectedPair);
  const midPrice = selectedAsset?.markPx || 0;

  const calculateTotal = () => {
    if (!amount) return "0.00";
    const tradePrice =
      orderType === "limit" && price
        ? parseFloat(price)
        : midPrice;
    return (parseFloat(amount) * tradePrice).toFixed(2);
  };

  const handlePercentageChange = (percentage) => {
    setSizePercentage(percentage);
    // Calculate amount based on available balance (mock calculation)
    const maxAmount = 1000.0; // This would come from actual balance
    const calculatedAmount = (maxAmount * percentage / 100).toFixed(6);
    setAmount(calculatedAmount);
  };

  // Available tokens for sizing dropdown
  const getAvailableTokens = () => {
    if (!selectedAsset) return ['HYPE'];
    
    const tokens = [selectedAsset.base];
    if (selectedAsset.quote && selectedAsset.quote !== selectedAsset.base) {
      tokens.push(selectedAsset.quote);
    }
    
    // Add common tokens
    const commonTokens = ['GTC', 'IOC', 'ALO'];
    commonTokens.forEach(token => {
      if (!tokens.includes(token)) {
        tokens.push(token);
      }
    });
    
    return tokens;
  };

  // Place trade
  const handleTrade = async (e) => {
    e.preventDefault();
    if (!amount || (orderType === "limit" && !price)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const tradePrice =
        orderType === "limit" && price
          ? parseFloat(price)
          : midPrice;

      // Send all spot trading data to backend
      const tradeData = {
        pair: selectedPair,
        side,
        amount: parseFloat(amount),
        orderType,
        price: orderType === "limit" ? parseFloat(price) : null,
        sizeToken: sizeToken,
        marketType: 'spot', // Distinguish from perpetual trades
      };

      console.log('Sending spot trade data:', tradeData);

      const res = await fetch(`${BACKEND_URL}/api/spot-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        if (result.trade) {
          setTradeHistory((prev) => [result.trade, ...prev]);
        }
        toast.success(`${side?.toUpperCase() || ""} order placed!`);
        setAmount("");
        setPrice("");
        setSizePercentage(0);
      } else {
        toast.error(result.error || "Trade failed");
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error("Trade failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 ${darkMode ? "dark" : ""}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Overview */}
        <div className="lg:col-span-2">
          <div
            className={`rounded-xl shadow-lg border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } p-6`}
          >
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              Spot Markets
            </h3>
            {tradingPairs.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">
                No market data available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map((asset) => {
                  const change = Number(asset.change) || 0;
                  return (
                    <div
                      key={asset.pair}
                      onClick={() => setSelectedPair(asset.pair)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPair === asset.pair
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                          : darkMode
                          ? "border-gray-600 hover:border-gray-500 bg-gray-700"
                          : "border-gray-300 hover:border-gray-400 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {asset.pair}
                        </span>
                        {change >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        ${asset.markPx.toFixed(4)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={change >= 0 ? "text-green-500" : "text-red-500"}
                        >
                          {change >= 0 ? "+" : ""}
                          {change.toFixed(2)}%
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Vol: {asset.dayNtlVlm.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Trading Panel */}
        <div className={`rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
          {/* Order Type Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                orderType === 'market'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                orderType === 'limit'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Limit
            </button>
            <button
              onClick={() => setOrderType('pro')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                orderType === 'pro'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Pro <ChevronDown className="w-3 h-3 ml-1 inline" />
            </button>
          </div>

          <div className="p-6">
            {/* Buy/Sell Buttons */}
            <div className="flex rounded-lg overflow-hidden mb-6">
              <button
                onClick={() => setSide('buy')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  side === 'buy'
                    ? 'bg-teal-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  side === 'sell'
                    ? 'bg-red-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                Sell
              </button>
            </div>

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Available to Trade */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Available to Trade</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {availableBalance.amount.toFixed(2)} {availableBalance.token}
                </span>
              </div>

              {/* Price (for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder={midPrice.toFixed(3)}
                      step="0.001"
                      min="0"
                      className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setPrice(midPrice.toFixed(3))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-teal-500 hover:text-teal-600"
                    >
                      Mid
                    </button>
                  </div>
                </div>
              )}

              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                  <div className="relative">
                    <select
                      value={sizeToken}
                      onChange={e => setSizeToken(e.target.value)}
                      className={`appearance-none bg-transparent border-none text-sm font-medium pr-6 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      } focus:outline-none`}
                    >
                      {getAvailableTokens().map(token => (
                        <option key={token} value={token}>{token}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>

                {/* Size Input and Percentage */}
                <div className="space-y-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => {
                      setAmount(e.target.value);
                      setSizePercentage(0); // Reset percentage when manually typing
                    }}
                    placeholder="0"
                    step="0.000001"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled={isLoading}
                  />

                  {/* Percentage Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sizePercentage}
                          onChange={e => handlePercentageChange(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${sizePercentage}%, ${darkMode ? '#374151' : '#e5e7eb'} ${sizePercentage}%, ${darkMode ? '#374151' : '#e5e7eb'} 100%)`
                          }}
                          disabled={isLoading}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                        {sizePercentage}%
                      </span>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="flex space-x-2">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentageChange(pct)}
                          className={`flex-1 py-1 px-2 text-xs rounded ${
                            sizePercentage === pct
                              ? 'bg-teal-500 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          disabled={isLoading}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Market Price:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${midPrice.toFixed(4)}
                  </span>
                </div>
                 {orderType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time in Force (TIF)
                      </label>
                      <div className="flex space-x-2">
                        {[
                          { value: 'Gtc', label: 'GTC', hint: 'Good Till Cancelled' },
                          { value: 'Ioc', label: 'IOC', hint: 'Immediate or Cancel' },
                          { value: 'Alo', label: 'ALO', hint: 'Add Liquidity Only' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTimeInForce(opt.value)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                              ${timeInForce === opt.value
                                ? 'bg-teal-500 text-white'
                                : darkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {timeInForce === 'Gtc' && 'Order stays open until canceled.'}
                        {timeInForce === 'Ioc' && 'Fills immediately or cancels any unfilled portion.'}
                        {timeInForce === 'Alo' && 'Posts only as maker liquidity; cancels if it would cross.'}
                      </p>
                    </div>
                  )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${calculateTotal()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !amount || tradingPairs.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  side === "buy"
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading
                  ? "Placing Order..."
                  : `${side?.toUpperCase() || ""} ${selectedPair || ""}`}
              </button>
            </form>

            {/* Deposit Button */}
            <button className="w-full mt-4 py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors">
              Deposit
            </button>
          </div>

          {/* Trade History */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Recent Orders
            </h3>
            {tradeHistory.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No orders yet.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {tradeHistory.slice(0, 10).map((trade, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {trade.pair}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.side === 'buy'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {trade.side?.toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      ${trade.price?.toFixed(4) || '0'} x {trade.amount} = ${trade.total?.toFixed(2) || '0'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HyperliquidSpotData;