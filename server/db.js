const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'trading.db'), (err) => {
  if (err) {
    console.error('Failed to connect to DB', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Trades table
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT,
      side TEXT,
      amount REAL,
      price REAL,
      total REAL,
      fee REAL,
      leverage REAL,
      orderType TEXT,
      status TEXT,
      pnl REAL,
      timestamp TEXT
    )
  `);

  // Chat history table
  db.run(`
    CREATE TABLE IF NOT EXISTS chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      message TEXT,
      timestamp TEXT
    )
  `);
});

module.exports = db;
