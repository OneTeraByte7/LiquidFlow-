import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = 'http://localhost:5001'; 

const Trading = () => {
  const { darkMode } = useTheme();

  const [assets, setAssets] = useState([]);
  const [selectedPair, setSelectedPair] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // New state for advanced features
  const [sizeType, setSizeType] = useState('BTC'); 
  const [sizePercentage, setSizePercentage] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [takeProfitStopLoss, setTakeProfitStopLoss] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ size: 0, coin: 'BTC' });
  const [timeInForce, setTimeInForce] = useState('Gtc');

  // --- Fetch market data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/market`);
        const data = (await res.json()).data || {};

        const assetsArr = Object.entries(data).map(([pair, a]) => ({
          ...a,
          pair,
          markPx: Number(a.markPx || 0),
          change: Number(a.change || 0),
          funding: a.funding ? Number(a.funding) * 100 : 0,
          openInterest: Number(a.openInterest || 0),
          volume: Number(a.volume || 0),
          id: Number(a.id || 0),
          name: pair,
        }));

        setAssets(assetsArr);
        if (assetsArr.length > 0) setSelectedPair(assetsArr[0].pair);
      } catch (err) {
        console.error('Failed to fetch market data:', err);
        toast.error('Failed to fetch market data');
      }
    };

    fetchData();
  }, []);

  // --- Fetch trade history ---
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/trades`);
        const data = await res.json();
        setTradeHistory(data.trades || []);
      } catch (err) {
        console.error('Failed to fetch trades:', err);
        toast.error('Failed to load trade history');
      }
    };

    fetchTrades();
  }, []);

  const tradingPairs = assets.map(a => a.name);
  const selectedAsset = assets.find(a => a.name === selectedPair);
  const midPrice = selectedAsset?.markPx || 0;

  const calculateTotal = () => {
    if (!amount) return '0.00';
    const tradePrice =
      orderType === 'limit' && price
        ? parseFloat(price)
        : midPrice;
    return (parseFloat(amount) * tradePrice).toFixed(2);
  };

  const handlePercentageChange = (percentage) => {
    setSizePercentage(percentage);
    // Calculate amount based on available balance (mock calculation)
    const maxAmount = 1.0; // This would come from actual balance
    const calculatedAmount = (maxAmount * percentage / 100).toFixed(6);
    setAmount(calculatedAmount);
  };

  // --- Handle placing trade ---
  const handleTrade = async (e) => {
    e.preventDefault();
    if (!amount || (orderType === 'limit' && !price)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Send enhanced trade data to backend
      const tradeReq = {
        pair: selectedPair,
        side: side,
        amount: amount,
        price: price || null,
        orderType: orderType,
        leverage: leverage,
        sizeType: sizeType,
        reduceOnly: reduceOnly,
        takeProfitStopLoss: takeProfitStopLoss,
      };

      const res = await fetch(`${BACKEND_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeReq),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`${side.toUpperCase()} order placed!`);
        if (data.trade) {
          setTradeHistory(prev => [data.trade, ...prev]);
        }
        setAmount('');
        setPrice('');
        setSizePercentage(0);
      } else {
        toast.error(data.error || 'Trade failed');
      }
    } catch (err) {
      console.error('Trade error:', err);
      toast.error('Trade failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 ${darkMode ? 'dark' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Overview */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Perpetual Market Overview</h3>
            {tradingPairs.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">No market data available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map(asset => {
                  const change = Number(asset.change) || 0;
                  return (
                    <div
                      key={asset.name}
                      onClick={() => setSelectedPair(asset.name)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPair === asset.name
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : darkMode
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{asset.name}</span>
                        {change >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        ${asset.markPx.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {change >= 0 ? '+' : ''}
                          {change.toFixed(2)}%
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Vol: {asset.volume.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Funding (8h): {asset.funding.toFixed(6)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        OI: {asset.openInterest.toFixed(2)}
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
                Buy / Long
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
                Sell / Short
              </button>
            </div>

            <form onSubmit={handleTrade} className="space-y-4">
              {/* Available to Trade */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Available to Trade</span>
                <span className="text-gray-900 dark:text-white font-medium">0.00</span>
              </div>

              {/* Current Position */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current Position</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {currentPosition.size.toFixed(5)} {currentPosition.coin}
                </span>
              </div>

              {/* Price (for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (USD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder={midPrice.toString()}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setPrice(midPrice.toString())}
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
                      value={sizeType}
                      onChange={e => setSizeType(e.target.value)}
                      className={`appearance-none bg-transparent border-none text-sm font-medium pr-6 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      } focus:outline-none`}
                    >
                      <option value="BTC">BTC</option>
                      <option value="USD">USD</option>
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

              {/* Advanced Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reduceOnly}
                    onChange={e => setReduceOnly(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-teal-500 focus:ring-teal-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Reduce Only</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={takeProfitStopLoss}
                    onChange={e => setTakeProfitStopLoss(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-teal-500 focus:ring-teal-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Take Profit / Stop Loss</span>
                </label>
              </div>

              {/* Order Summary */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Market Price:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${midPrice.toFixed(2)}
                  </span>
                </div>
                  {/* Time in Force (Limit Orders Only) */}
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${calculateTotal()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !amount || tradingPairs.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  side === 'buy'
                    ? 'bg-teal-500 hover:bg-teal-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Placing Order...' : `${(side || '').toUpperCase()} ${selectedPair || ''}`}
              </button>
            </form>

            {/* Deposit Button */}
            <button className="w-full mt-4 py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors">
              Deposit
            </button>
          </div>

          {/* Trade History */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Recent Trades</h3>
            {tradeHistory.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No trades yet.</div>
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
                        {trade.coin || selectedPair}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.isBuy
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {trade.isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {trade.filled
                        ? `${trade.filled.totalSz} @ $${trade.filled.avgPx}`
                        : trade.resting
                        ? `Pending: OID ${trade.resting.oid}`
                        : trade.error
                        ? `Failed: ${trade.error}`
                        : 'Processing...'}
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

export default Trading;