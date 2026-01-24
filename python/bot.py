# chatbot_openai.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import os
import dotenv
import openai
import re
from hl_client import hl_client  # your Hyperliquid client

dotenv.load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load OpenAI key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Please set OPENAI_API_KEY in your environment variables")
openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Hyperliquid Smart Chatbot", version="1.0.0")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---
class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    trade_executed: Optional[Dict[str, Any]] = None

# --- Helper Functions ---
def handle_trade(command: str) -> Optional[Dict[str, Any]]:
    """Parse trade command and execute on Hyperliquid."""
    try:
        parts = command.lower().split()
        side = "buy" if "buy" in parts else "sell"
        amount_idx = parts.index(side) + 1
        amount = float(parts[amount_idx])
        symbol_idx = amount_idx + 1
        symbol = parts[symbol_idx].upper() + "-USD"

        trade_info = hl_client.place_order(
            symbol=symbol,
            side=side,
            quantity=amount  # synchronous call
        )
        return trade_info
    except Exception as e:
        logger.error(f"Error executing trade: {e}")
        return None

def generate_openai_response(message: str) -> str:
    """Generate a GPT response enforcing trade command format."""
    prompt = f"""
You are a Hyperliquid trading assistant. You MUST respond in ONE of these ways:

1. If the user wants to trade, respond ONLY with a trade command:
   'BUY <amount> <symbol>' or 'SELL <amount> <symbol>'
   Example: 'BUY 1 BTC', 'SELL 0.5 ETH'
   After commanding, Just show trade is done
   if buy then say Successfully bought <amount> <symbol>
   if sell then say Successfully sold <amount> <symbol>

2. If the user wants market info or analysis, respond clearly without trade commands.

Do NOT include extra commentary for trades.

User message: "{message}"
"""
    try:
        completion = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.2,
            max_tokens=200
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        return "Sorry, I couldn't process your request."

# --- API Route ---
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(chat_request: ChatRequest):
    try:
        gpt_response = generate_openai_response(chat_request.message)
        trade_executed = None

        # Only execute if it matches strict trade command format
        trade_pattern = r"^(BUY|SELL) \d+(\.\d+)? [A-Z]+$"
        if re.match(trade_pattern, gpt_response.strip()):
            trade_executed = handle_trade(gpt_response)

        return ChatResponse(
            response=gpt_response,
            timestamp=datetime.now().isoformat(),
            trade_executed=trade_executed
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Health Check ---
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "hyperliquid-smart-chatbot",
        "timestamp": datetime.now().isoformat()
    }

# --- Run Server ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
