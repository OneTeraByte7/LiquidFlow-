from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from signing import sign_user_signed_action

app = FastAPI()

class SignRequest(BaseModel):
    private_key: str
    action: dict
    nonce: int 

@app.post("/sign")
def sign_endpoint(req: SignRequest):
    try:
        print(f"Received signing request for nonce: {req.nonce}")
        result = sign_user_signed_action(req.private_key, req.action, req.nonce)
        print(f"Signing successful, returning: {result}")
        return result
    except Exception as e:
        print(f"Signing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Signing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)