const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const vaultAddress = process.env.WALLET_ADDRESS;
const dataPath = "./followers.json";

async function fetchAndSaveFollowers() {
  if (!vaultAddress) {
    console.error("WALLET_ADDRESS missing in .env");
    return;
  }

  console.log("Fetching vault details for:", vaultAddress);

  try {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "vaultDetails",
        vaultAddress,
      }),
    });

    const vault = await response.json();
    console.log("API Response:", vault);

    const followers = vault && vault.followers ? vault.followers : [];

    fs.writeFileSync(dataPath, JSON.stringify(followers, null, 2), "utf-8");
    console.log(`Saved ${followers.length} followers to followers.json`);
  } catch (err) {
    console.error("Error fetching vault details:", err);
  }
}

fetchAndSaveFollowers();
