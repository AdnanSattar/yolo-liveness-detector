"""
Prediction API endpoint.
"""

import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.inference.model import get_model
from app.inference.postprocessor import format_detections, postprocess_results
from app.inference.preprocessor import decode_image, preprocess_image
from app.schemas.response import ErrorResponse, PredictionResponse

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...)):
    """
    Predict if faces in image are real or fake.

    Args:
        file: Image file (JPEG/PNG)

    Returns:
        PredictionResponse with detected faces
    """
    start_time = time.time()

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG)")

    # Read image bytes
    try:
        image_bytes = await file.read()

        # Check file size
        if len(image_bytes) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large. Max size: {settings.MAX_IMAGE_SIZE / 1024 / 1024}MB",
            )

        # Decode image
        image = decode_image(image_bytes)

        # Preprocess
        preprocessed = preprocess_image(image)

        # Get model
        model_wrapper = get_model()

        # Run inference
        results = model_wrapper.predict(preprocessed)

        # Post-process
        detections = postprocess_results(results)
        formatted_detections = format_detections(detections)

        # Debug logging
        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"Detections found: {len(detections)}, Formatted: {len(formatted_detections)}"
        )
        if len(detections) > 0:
            logger.info(f"First detection: {detections[0]}")

        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000

        return PredictionResponse(faces=formatted_detections, latency_ms=latency_ms)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
