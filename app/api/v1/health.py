"""
Health check API endpoint.
"""

import time

from fastapi import APIRouter, Request

from app.core.config import settings
from app.inference.model import get_model
from app.schemas.response import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """
    Health check endpoint.

    Returns:
        HealthResponse with system status
    """
    try:
        model_wrapper = get_model()
        model_loaded = model_wrapper.is_loaded
        device = model_wrapper.device if model_loaded else "unknown"
    except Exception:
        model_loaded = False
        device = "unknown"

    # Calculate uptime if available
    uptime_seconds = None
    try:
        if hasattr(request.app.state, "start_time"):
            uptime_seconds = time.time() - request.app.state.start_time
    except Exception:
        pass

    resp = HealthResponse(
        status="healthy" if model_loaded else "degraded",
        model_loaded=model_loaded,
        device=device,
        version=settings.APP_VERSION,
        uptime_seconds=uptime_seconds,
    )
    return resp
