import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import CandleChart from "./CandleChart"; // lightweight-charts candlestick

const Charts = () => {
  const { darkMode } = useTheme();
  const [selectedPair, setSelectedPair] = useState("ETH-USD");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("line");
  const [priceData, setPriceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const pairs = ["ETH-USD", "BTC-USD", "SOL-USD", "AVAX-USD"];
  const timeframes = ["1H", "4H", "1D", "1W", "1M"];
  const chartTypes = [
    { value: "line", label: "Line", icon: TrendingUp },
    { value: "area", label: "Area", icon: BarChart3 },
    { value: "candle", label: "Candlestick", icon: BarChart3 }
  ];

  // Mock data for line/area charts
  const generatePriceData = useCallback(() => {
    const basePrice = { "ETH-USD": 2340, "BTC-USD": 43250, "SOL-USD": 98.75, "AVAX-USD": 35.2 }[selectedPair];
    const points = timeframe === "1H" ? 24 : timeframe === "4H" ? 48 : timeframe === "1D" ? 30 : 52;
    const now = new Date();
    let currentPrice = basePrice;
    const data = [];

    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      switch (timeframe) {
        case "1H": date.setHours(date.getHours() - i); break;
        case "4H": date.setHours(date.getHours() - i * 4); break;
        case "1D": date.setDate(date.getDate() - i); break;
        case "1W": date.setDate(date.getDate() - i * 7); break;
        case "1M": date.setMonth(date.getMonth() - i); break;
        default: date.setDate(date.getDate() - i);
      }
      const volatility = Math.random() * 0.04 - 0.02;
      currentPrice = Math.max(0, currentPrice * (1 + volatility));
      data.push({ time: date.getTime(), price: currentPrice });
    }
    return data;
  }, [selectedPair, timeframe]);

  useEffect(() => {
    setIsLoading(true);

    if (chartType === "candle") {
      // Candlestick chart uses Hyperliquid API in CandleChart
      setPriceData([]); 
      setIsLoading(false);
      return;
    }

    // For line/area charts, generate mock data
    setTimeout(() => {
      setPriceData(generatePriceData());
      setIsLoading(false);
    }, 500);
  }, [selectedPair, timeframe, chartType, generatePriceData]);

  const formatTime = (ms) => {
    const date = new Date(ms);
    switch (timeframe) {
      case "1H":
      case "4H": return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      case "1D":
      case "1W": return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "1M": return date.toLocaleDateString([], { month: "short", year: "2-digit" });
      default: return date.toLocaleDateString();
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-96 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-500 mr-2" />
          <span className="text-gray-500 dark:text-gray-400">Loading chart...</span>
        </div>
      );
    }

    if (chartType === "candle") {
      return <CandleChart pair={selectedPair} interval="1m" />;
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke={darkMode ? "#9ca3af" : "#6b7280"} />
            <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
            <Tooltip labelFormatter={formatTime} />
            <Area type="monotone" dataKey="price" stroke="#14b8a6" fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={priceData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
          <XAxis dataKey="time" tickFormatter={formatTime} stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
          <Tooltip labelFormatter={formatTime} />
          <Line type="monotone" dataKey="price" stroke="#14b8a6" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className={`p-6 ${darkMode ? "dark" : ""}`}>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedPair}
          onChange={(e) => setSelectedPair(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
        >
          {pairs.map(pair => <option key={pair} value={pair}>{pair}</option>)}
        </select>

        <div className="flex border rounded-lg overflow-hidden">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-2 text-sm font-medium ${timeframe === tf ? "bg-teal-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex border rounded-lg overflow-hidden">
          {chartTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-3 py-2 flex items-center text-sm font-medium ${chartType === type.value ? "bg-teal-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                <Icon className="w-4 h-4 mr-1" /> {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className={`rounded-xl shadow-lg border p-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {renderChart()}
      </div>
    </div>
  );
};

export default Charts;
