"""
Post-processing of YOLO model outputs.
"""

from typing import Any, Dict, List

from app.core.config import settings
from app.schemas.response import BoundingBox, FaceDetection

# Class name mapping (0=real, 1=fake) - model outputs are inverted
CLASS_NAMES = {0: "real", 1: "fake"}


def postprocess_results(results: Any, confidence_threshold: float = None) -> List[Dict[str, Any]]:
    """
    Post-process YOLO results into standardized format.

    Args:
        results: YOLO model results object
        confidence_threshold: Minimum confidence. Uses config default if None.

    Returns:
        List of detection dictionaries
    """
    if confidence_threshold is None:
        confidence_threshold = settings.CONFIDENCE_THRESHOLD

    detections = []

    # Extract boxes from YOLO results
    import logging

    logger = logging.getLogger(__name__)

    for result in results:
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            logger.info("No boxes found in result - model did not detect any faces")
            continue

        logger.info(
            f"Found {len(boxes)} boxes before filtering (confidence threshold: {confidence_threshold})"
        )

        for box in boxes:
            # Extract confidence
            conf = float(box.conf[0])
            cls = int(box.cls[0])

            logger.info(
                f"Box detected: class={cls}, confidence={conf:.3f}, threshold={confidence_threshold}"
            )

            if conf < confidence_threshold:
                logger.info(
                    f"Box filtered out: confidence {conf:.3f} < threshold {confidence_threshold}"
                )
                continue

            # Extract class
            cls = int(box.cls[0])
            class_name = CLASS_NAMES.get(cls, "unknown")

            # Extract bounding box
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

            w = x2 - x1
            h = y2 - y1

            detections.append(
                {
                    "label": class_name,
                    "confidence": conf,
                    "bbox": {"x": x1, "y": y1, "w": w, "h": h},
                }
            )

    return detections


def format_detections(detections: List[Dict[str, Any]]) -> List[FaceDetection]:
    """
    Format detections into Pydantic models.

    Args:
        detections: List of detection dictionaries

    Returns:
        List of FaceDetection models
    """
    formatted = []

    for det in detections:
        bbox = BoundingBox(**det["bbox"])
        face = FaceDetection(label=det["label"], confidence=det["confidence"], bbox=bbox)
        formatted.append(face)

    return formatted
