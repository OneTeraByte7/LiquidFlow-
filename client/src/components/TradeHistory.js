import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

const TradeHistory = () => {
  const { darkMode } = useTheme();
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch('https://liquidflow.onrender.com/api/trades');
        const data = await res.json();
        const tradesArray = Array.isArray(data.trades) ? data.trades : [];

        const sanitizedTrades = tradesArray.map(trade => ({
          side: trade.side || 'unknown',
          pair: trade.pair || 'N/A',
          amount: trade.amount ?? 0,
          price: trade.price ?? 0,
          total: trade.total ?? 0,
          fee: trade.fee ?? 0,
          pnl: trade.pnl ?? 0,
          status: trade.status || 'pending',
          timestamp: trade.timestamp || new Date().toISOString(),
        }));

        setTrades(sanitizedTrades);
        setFilteredTrades(sanitizedTrades);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch trade history');
        setTrades([]);
        setFilteredTrades([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Filtering trades
  useEffect(() => {
    let filtered = trades;

    if (filter !== 'all') {
      filtered = filtered.filter(trade => trade.side === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(trade =>
        (trade.pair || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter(trade => new Date(trade.timestamp) >= filterDate);
    }

    setFilteredTrades(filtered);
  }, [trades, filter, searchTerm, dateFilter]);

  // Export CSV
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Pair', 'Side', 'Amount', 'Price', 'Total', 'Fee', 'PnL', 'Status'],
      ...filteredTrades.map(trade => [
        new Date(trade.timestamp).toLocaleDateString(),
        trade.pair,
        trade.side,
        trade.amount,
        trade.price,
        trade.total,
        trade.fee,
        trade.pnl,
        trade.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_history.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Trade history exported successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
  const totalVolume = filteredTrades.reduce((sum, trade) => sum + (trade.total ?? 0), 0);
  const totalFees = filteredTrades.reduce((sum, trade) => sum + (trade.fee ?? 0), 0);

  return (
    <div className={`p-6 ${darkMode ? 'dark' : ''}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{filteredTrades.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Trades</div>
        </div>
        <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`text-2xl font-bold mb-1 ${getPnLColor(totalPnL)}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total PnL</div>
        </div>
        <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${totalVolume.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
        </div>
        <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${totalFees.toFixed(2)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Fees</div>
        </div>
      </div>

      {/* Filters & Export */}
      <div className={`rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mb-6`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              <option value="all">All Sides</option>
              <option value="buy">Buy Only</option>
              <option value="sell">Sell Only</option>
            </select>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Trade Table */}
      <div className={`rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pair</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Side</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PnL</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                      <span className="ml-3 text-gray-500 dark:text-gray-400">Loading trades...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No trades found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map(trade => (
                  <tr key={(trade.timestamp ?? '') + (trade.pair ?? '')} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>{new Date(trade.timestamp ?? '').toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(trade.timestamp ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{trade.pair ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${(trade.side === 'buy' ? 'text-green-600 dark:text-green-400' : trade.side === 'sell' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400')}`}>
                        {trade.side === 'buy' && <TrendingUp className="w-4 h-4 mr-1"/>}
                        {trade.side === 'sell' && <TrendingDown className="w-4 h-4 mr-1"/>}
                        {(trade.side ?? '').toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{trade.amount ?? 0} {(trade.pair ?? 'N/A').split('-')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${(trade.price ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${(trade.total ?? 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getPnLColor(trade.pnl ?? 0)}`}>{(trade.pnl ?? 0) >= 0 ? '+' : ''}${(trade.pnl ?? 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status ?? 'pending')}`}>{trade.status ?? 'pending'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
