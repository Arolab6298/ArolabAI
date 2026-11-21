
import os
import logging

from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from google import genai


# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key) if api_key else None


# Create FastAPI application
app = FastAPI(
    title="Arolab AI",
    description="Your personal AI assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request validation
class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )


# Homepage
@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


# Chat endpoint
@app.post("/chat")
def chat(request: ChatRequest):

    if client is None:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured."
        )

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=request.message
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response."
            )

        return {
            "user_message": request.message,
            "assistant_reply": response.text
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Gemini API request failed")

        raise HTTPException(
            status_code=502,
            detail="Unable to get a response from the AI service."
        )


# Serve frontend assets
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

