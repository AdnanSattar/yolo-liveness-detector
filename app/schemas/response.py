"""
Pydantic models for API request/response validation.
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BoundingBox(BaseModel):
    """Bounding box coordinates."""

    x: int
    y: int
    w: int
    h: int


class FaceDetection(BaseModel):
    """Single face detection result."""

    label: str  # "real" or "fake"
    confidence: float
    bbox: BoundingBox


class PredictionResponse(BaseModel):
    """Response from prediction endpoint."""

    faces: List[FaceDetection]
    latency_ms: float


class HealthResponse(BaseModel):
    """Health check response."""

    # Avoid protected namespace warning for `model_loaded`
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
    device: str
    version: str
    uptime_seconds: Optional[float] = None


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
