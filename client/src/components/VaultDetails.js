// src/components/VaultDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VaultDetails = () => {
  const { vaultAddress } = useParams();
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVaultDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vaultDetails", vaultAddress }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`API error: ${text}`);
      setVault(JSON.parse(text));
    } catch (err) {
      console.error("❌ Error fetching vault details:", err);
      setError(err.message || "Failed to fetch vault details");
    } finally {
      setLoading(false);
    }
  }, [vaultAddress]);

  useEffect(() => {
    fetchVaultDetails();
  }, [vaultAddress, fetchVaultDetails]);

  const renderPortfolioChart = (history) => {
    if (!history?.accountValueHistory) return null;
    const labels = history.accountValueHistory.map((h) =>
      new Date(h[0]).toLocaleDateString()
    );
    const data = history.accountValueHistory.map((h) => Number(h[1]));
    return (
      <Line
        data={{ labels, datasets: [{ label: "Account Value", data, borderColor: "#22c55e", tension: 0.3, fill: false, pointRadius: 2 }] }}
        options={{ plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { display: true } } }}
      />
    );
  };

  if (loading) return <p className="text-gray-400">Loading vault details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!vault) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto text-white space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{vault.name}</h1>
        <Link to="/vault" className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded text-sm">
          ← Back to Vaults
        </Link>
      </div>

      <p className="text-gray-400 break-all">Vault Address: {vault.vaultAddress}</p>
      <p className="text-gray-400">Leader: {vault.leader}</p>
      <p className="mt-2">{vault.description}</p>

      {/* Portfolio section: graph left, info right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {vault.portfolio?.map(([period, data]) => (
          <div key={period} className="bg-gray-800 p-4 rounded-lg space-y-4">
            <h3 className="text-gray-300 font-semibold">{period}</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">{renderPortfolioChart(data)}</div>
              <div className="flex-1 space-y-2 text-gray-400">
                <p>VLM: {data.vlm}</p>
                <p>Account Value History Points: {data.accountValueHistory?.length}</p>
                <p>PNL History Points: {data.pnlHistory?.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Followers */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Followers</h2>
        {vault.followers?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vault.followers.map((f, idx) => (
              <div key={idx} className="p-3 border border-gray-700 rounded-lg bg-gray-800 space-y-1 text-gray-300">
                <p>User: {f.user}</p>
                <p>Vault Equity: {Number(f.vaultEquity).toLocaleString()}</p>
                <p>PNL: {Number(f.pnl).toLocaleString()}</p>
                <p>All Time PNL: {Number(f.allTimePnl).toLocaleString()}</p>
                <p>Days Following: {f.daysFollowing}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No followers</p>
        )}
      </div>

      {/* Relationship */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Child Vaults</h2>
        {vault.relationship?.data?.childAddresses?.length > 0 ? (
          <ul className="list-disc list-inside text-gray-300">
            {vault.relationship.data.childAddresses.map((addr) => (
              <li key={addr}>{addr}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No child vaults</p>
        )}
      </div>

      {/* Vault Limits */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
        <p>APR: {vault.apr}</p>
        <p>Max Distributable: {vault.maxDistributable}</p>
        <p>Max Withdrawable: {vault.maxWithdrawable}</p>
        <p>Leader Fraction: {vault.leaderFraction}</p>
        <p>Leader Commission: {vault.leaderCommission}</p>
        <p>Allow Deposits: {vault.allowDeposits ? "Yes" : "No"}</p>
        <p>Always Close on Withdraw: {vault.alwaysCloseOnWithdraw ? "Yes" : "No"}</p>
        <p>Is Closed: {vault.isClosed ? "Yes" : "No"}</p>
      </div>
    </div>
  );
};

export default VaultDetails;
