"""
FastAPI application entry point.
"""

# ---------------------------------------------------------------------------
# Torch 2.6+ safe serialization bootstrap
# This MUST run before any YOLO / Ultralytics checkpoint is loaded.
# ---------------------------------------------------------------------------
import torch
import torch.nn as nn

try:
    from ultralytics.nn.tasks import DetectionModel

    torch.serialization.add_safe_globals(
        [
            DetectionModel,
            nn.Sequential,
            nn.Conv2d,
            nn.BatchNorm2d,
            nn.SiLU,
            nn.Upsample,
        ]
    )
except Exception:
    # If this fails, YOLO load will still raise a clear error later.
    pass

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, predict
from app.core.config import settings
from app.core.logging import setup_logging
from app.inference.model import get_model

# Setup logging
logger = setup_logging()

# Track startup time
_start_time = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    global _start_time
    _start_time = time.time()

    # Startup: Load model
    logger.info("Loading YOLO model...")
    try:
        model = get_model()
        logger.info(f"Model loaded successfully on device: {model.device}")
        app.state.model = model
        app.state.start_time = _start_time
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise

    yield

    # Shutdown: Cleanup
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Register routers
app.include_router(predict.router, prefix="/v1", tags=["prediction"])
app.include_router(health.router, prefix="/v1", tags=["health"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Anti-Spoofing Detection API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
