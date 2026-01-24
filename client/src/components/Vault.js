// src/components/Vaults.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
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

const Vaults = () => {
  const [vaults, setVaults] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const userAddress = "0x677d831aef5328190852e24f13c46cac05f984e7";

  const safeFetchJson = async (body) => {
    try {
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("API error:", text);
        return [];
      }
      try {
        return JSON.parse(text);
      } catch {
        console.error("Invalid JSON:", text);
        return [];
      }
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userVaults, userEquities, subs] = await Promise.all([
        safeFetchJson({ type: "userVaults", user: userAddress }),
        safeFetchJson({ type: "userVaultEquities", user: userAddress }),
        safeFetchJson({ type: "subAccounts", user: userAddress }),
      ]);

      setSubAccounts(Array.isArray(subs) ? subs : []);

      const vaultMap = {};
      [...(userVaults || []), ...(userEquities || [])].forEach((v) => {
        vaultMap[v.vaultAddress] = {
          ...vaultMap[v.vaultAddress],
          ...v,
        };
      });

      setVaults(Object.values(vaultMap));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const VaultRow = ({ v }) => {
    const chartData = {
      labels: Array(10).fill(""),
      datasets: [
        {
          data: Array.from({ length: 10 }, () => Math.random() * 2 - 1),
          borderColor: "#22c55e",
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };

    return (
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-900 transition">
        <span className="break-all text-gray-900 dark:text-gray-200">{v.vaultAddress}</span>
        <span className="text-gray-900 dark:text-gray-200">
          ${Number(v.equity || 0).toLocaleString()}
        </span>
        <div className="w-24 h-8">
          <Line
            data={chartData}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } },
            }}
          />
        </div>
        <Link
          to={`/vault/${v.vaultAddress}`}
          className="text-teal-600 dark:text-teal-400 hover:underline"
        >
          View Details
        </Link>
      </div>
    );
  };

  const SubAccountRow = ({ s }) => {
    const totalBalance = s.spotState?.balances?.reduce(
      (sum, b) => sum + Number(b.total),
      0
    );
    return (
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-900 transition">
        <span className="break-all text-gray-900 dark:text-gray-200">{s.subAccountUser}</span>
        <span className="text-gray-900 dark:text-gray-200">
          ${totalBalance?.toFixed(2) || 0}
        </span>
        <span className="text-gray-700 dark:text-gray-400">Subaccount</span>
        <span>-</span>
      </div>
    );
  };

  const filterVaults = (vaults) =>
    (vaults || []).filter((v) =>
      v.vaultAddress?.toLowerCase().includes(search.toLowerCase())
    );

  const filterSubAccounts = (subs) =>
    (subs || []).filter((s) =>
      s.subAccountUser?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
        User Vaults & Subaccounts
      </h1>

      <input
        type="text"
        placeholder="Search by vault or subaccount address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 px-4 py-2 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
      />

      {loading && (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      )}

      {filterVaults(vaults).length > 0 && (
        <div>
          <div className="grid grid-cols-4 gap-4 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            <span>Vault Address</span>
            <span>Equity</span>
            <span>Snapshot</span>
            <span>Action</span>
          </div>
          {filterVaults(vaults).map((v, idx) => (
            <VaultRow key={idx} v={v} />
          ))}
        </div>
      )}

      {filterSubAccounts(subAccounts).length > 0 && (
        <div>
          <div className="grid grid-cols-4 gap-4 px-3 py-2 mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            <span>Subaccount Address</span>
            <span>Total Balance</span>
            <span>Type</span>
            <span>Action</span>
          </div>
          {filterSubAccounts(subAccounts).map((s, idx) => (
            <SubAccountRow key={idx} s={s} />
          ))}
        </div>
      )}

      {!loading &&
        filterVaults(vaults).length === 0 &&
        filterSubAccounts(subAccounts).length === 0 && (
          <p className="text-gray-600 dark:text-gray-400">
            No vaults or subaccounts found.
          </p>
        )}
    </div>
  );
};

export default Vaults;
