"""Minimal FastAPI app for testing Cloud Run deployment"""
from fastapi import FastAPI
import os

app = FastAPI(title="uteki.open - Test")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "uteki.open backend is running",
        "port": os.getenv("PORT", "8080"),
        "environment": os.getenv("ENVIRONMENT", "unknown")
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
