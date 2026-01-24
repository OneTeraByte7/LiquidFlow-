from fastapi import FastAPI
from pydantic import BaseModel
from eth_account import Account
from hyperliquid.exchange import Exchange  # your provided Exchange.py
from hyperliquid.utils.constants import MAINNET_API_URL


MAINNET_API_URL="https://api.hyperliquid.xyz"
PRIVATE_KEY = "0xfffff30c26280a72044bc592874c79f1a62d0c42b56b7bafeff5f76ffce05c17"
account = Account.from_key(PRIVATE_KEY)
exchange = Exchange(account, MAINNET_API_URL)


app = FastAPI()

class TradeRequest(BaseModel):
    coin: str | None = "ETH"   
    side: str                 
    size: float                
    price: float | None = None
    order_type: str = "market" 
    reduceOnly: bool = False


@app.post("/trade")
def place_trade(req: TradeRequest):
    is_buy = req.side.lower() == "buy"

    if req.order_type == "market":
        resp = exchange.market_open(
            name=req.coin,
            is_buy=is_buy,
            sz=req.size,
        )
    elif req.order_type == "limit":
        if req.price is None:
            return {"error": "Price required for limit order"}
        resp = exchange.order(
            name=req.coin,
            is_buy=is_buy,
            sz=req.size,
            limit_px=req.price,
            order_type={"limit": {"tif": "Gtc"}},  
            reduce_only=req.reduceOnly,
        )
    else:
        return {"error": "Invalid order_type (must be 'market' or 'limit')"}

    return resp
