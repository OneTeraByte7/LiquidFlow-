import time
import json
from eth_account import Account
from eth_account.messages import encode_defunct

def sign_user_signed_action(private_key: str, action: dict, nonce: int) -> dict:
    # Create account from private key
    account = Account.from_key(private_key)

    # Create the message that Hyperliquid expects to be signed
    message_dict = {
        "action": action,
        "nonce": nonce
    }

    # Convert to JSON string (order matters - use separators for consistency)
    message = json.dumps(message_dict, separators=(",", ":"))
    
    print(f"Signing message: {message}")  # Debug log
    
    # Create the message hash
    msg_hash = encode_defunct(text=message)
    
    # Sign the message - FIXED: only pass msg_hash, account already has private key
    signed_message = account.sign_message(msg_hash)

    print(f"Generated signature: {signed_message.signature.hex()}")  # Debug log

    # Return only what's needed - with 0x prefix for signature
    return {
        "signature": "0x" + signed_message.signature.hex(),
        "address": account.address
    }