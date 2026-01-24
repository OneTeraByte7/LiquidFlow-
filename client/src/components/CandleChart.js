import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const CandleChart = ({ pair = "BTC-USD", interval = "1m" }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#0d1117" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    // Add candlestick series
    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    
    const fetchCandles = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: {
              coin: pair.split("-")[0], 
              interval: interval,
              startTime: Date.now() - 1000 * 60 * 60, 
              endTime: Date.now(),
            },
          }),
        });

        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((c) => ({
            time: Math.floor(c.t / 1000),
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
          }));
          seriesRef.current.setData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch candles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();

    // Handle resize
    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      chartRef.current.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, [pair, interval]);

  return (
    <div>
      {loading && <div className="text-gray-400 text-center mb-2">Loading candles...</div>}
      <div ref={chartContainerRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
};

export default CandleChart;
