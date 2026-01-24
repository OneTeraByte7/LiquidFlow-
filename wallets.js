// src/components/Wallet.js
import React, { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import axios from "axios";

const Wallet = () => {
  const { darkMode } = { darkMode: false }; // replace with your theme context if needed
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.length > 0 ? wallets[0] : null;

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Hyperliquid account when wallet is connected
  useEffect(() => {
    async function fetchHyperliquid() {
      if (!wallet) return;

      try {
        setLoading(true);

        // For demo, use dummy data
        setAccount({
          balance: 12500.75,
          positions: [
            {
              asset: "ETH-USD",
              size: 2,
              entry_price: 2300,
              mark_price: 2350,
              pnl: 100,
              leverage: 3,
              side: "buy"
            },
            {
              asset: "BTC-USD",
              size: 0.1,
              entry_price: 43000,
              mark_price: 43250,
              pnl: 25,
              leverage: 2,
              side: "sell"
            }
          ],
          lastUpdated: new Date().toISOString()
        });

      } catch (err) {
        console.error("Error fetching Hyperliquid account:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHyperliquid();
  }, [wallet]);

  if (!ready) return <p className="text-center mt-6">Loading Privy...</p>;

  return (
    <div className={`p-6 max-w-md mx-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-lg`}>
      <h2 className="text-2xl font-bold mb-4">Privy + Hyperliquid Wallet</h2>

      {/* Connect Privy Wallet Button */}
      {!authenticated && (
        <div className="flex justify-center mb-6">
          <button
            onClick={login}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
          >
            Connect Privy Wallet
          </button>
        </div>
      )}

      {/* Logout button */}
      {authenticated && (
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-teal-600">{wallet ? wallet.address : "No Wallet Connected"}</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Logout
          </button>
        </div>
      )}

      {/* Wallet info */}
      {authenticated && wallet && (
        <div>
          <p><strong>Wallet Address:</strong> {wallet.address}</p>
          <p><strong>Wallet Type:</strong> {wallet.walletClientType}</p>

          {loading && <p className="mt-2 text-gray-500">Loading Hyperliquid account...</p>}

          {account && !loading && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
              <h3 className="text-lg font-semibold mb-2">Hyperliquid Account State</h3>
              <p><strong>Balance:</strong> ${account.balance}</p>
              <p className="mt-2 font-semibold">Positions:</p>
              <ul className="list-disc list-inside space-y-1">
                {account.positions.map((pos, idx) => (
                  <li key={idx}>
                    {pos.asset} | {pos.side.toUpperCase()} | Size: {pos.size} | Entry: {pos.entry_price} | Mark: {pos.mark_price} | PnL: {pos.pnl} | Leverage: {pos.leverage}x
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">Last updated: {new Date(account.lastUpdated).toLocaleString()}</p>
            </div>
          )}

          {!account && !loading && (
            <p className="mt-4 text-gray-500">No Hyperliquid account found for this wallet.</p>
          )}
        </div>
      )}

      {authenticated && !wallet && (
        <p className="mt-4 text-gray-500">No wallet found in your Privy session.</p>
      )}
    </div>
  );
};

export default Wallet;
