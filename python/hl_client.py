# python/hl_client.py
import httpx
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class HyperliquidClient:
    def __init__(self, base_url: str = "https://api.hyperliquid.xyz"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=10.0)

    async def get_markets(self) -> Dict[str, Any]:
        """Fetch available trading markets"""
        try:
            resp = await self.client.get("/markets")
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching markets: {e}")
            return {"error": str(e)}

    async def get_orderbook(self, symbol: str, depth: int = 20) -> Dict[str, Any]:
        """Fetch orderbook for a given trading pair"""
        try:
            resp = await self.client.get(f"/orderbook?symbol={symbol}&depth={depth}")
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching orderbook for {symbol}: {e}")
            return {"error": str(e)}

    async def place_order(
        self, symbol: str, side: str, quantity: float, price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Place a mock order (BUY/SELL). Ready for real API key integration.
        For real trading:
        - Add authentication headers
        - Sign requests
        - Use POST /orders endpoint
        """
        try:
            payload = {
                "symbol": symbol,
                "side": side.upper(),
                "quantity": quantity,
                "price": price,
            }
            logger.info(f"Placing order: {payload}")
            # Mock response for now
            return {"status": "mock_order_placed", "details": payload}
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            return {"error": str(e)}

    async def close(self):
        """Close underlying HTTP client"""
        await self.client.aclose()

# Singleton instance for easy import
hl_client = HyperliquidClient()
