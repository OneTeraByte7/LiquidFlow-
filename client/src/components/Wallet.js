// src/components/Wallet.jsx
import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

const Wallet = () => {
  const { authenticated, login, logout, user, ready } = usePrivy();
  const [search, setSearch] = useState("");

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading wallet...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="mb-4 text-gray-600">
          No wallet connected. Please log in with Privy.
        </p>
        <button
          onClick={login}
          className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // 🔗 Grab all wallet accounts
  const wallets =
    user?.linkedAccounts?.filter((acc) => acc.type === "wallet") || [];

  // 🔍 Filter wallets by search query
  const filteredWallets = wallets.filter(
    (w) =>
      w.address?.toLowerCase().includes(search.toLowerCase()) ||
      w.chain?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Wallets</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring focus:ring-teal-300"
        />
      </div>

      {/* Table */}
      {filteredWallets.length === 0 ? (
        <p className="text-gray-500">No wallets found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  Address
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  Chain
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  Created
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.map((wallet, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2 text-sm break-all">
                    {wallet.address || "Unknown"}
                  </td>
                  <td className="px-4 py-2 text-sm">{wallet.chain || "N/A"}</td>
                  <td className="px-4 py-2 text-sm">
                    {wallet.createdAt
                      ? new Date(wallet.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {wallet.address && (
                      <button
                        onClick={() => handleCopy(wallet.address)}
                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Copy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disconnect */}
      <button
        onClick={logout}
        className="mt-6 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
      >
        Disconnect
      </button>
    </div>
  );
};

export default Wallet;
