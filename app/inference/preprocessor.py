"""
Image preprocessing for YOLO inference.
"""

from typing import Tuple

import cv2
import numpy as np

from app.core.config import settings


def decode_image(image_bytes: bytes) -> np.ndarray:
    """
    Decode image bytes to numpy array.

    Args:
        image_bytes: Raw image bytes (JPEG/PNG)

    Returns:
        BGR image array
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Failed to decode image")

    return img


def preprocess_image(
    image: np.ndarray, target_size: Tuple[int, int] = None
) -> np.ndarray:
    """
    Preprocess image for YOLO inference.
    YOLO's predict() handles most preprocessing internally, so we just ensure
    the image is in the right format (HWC, RGB, uint8).

    Args:
        image: BGR image array from OpenCV
        target_size: Not used (YOLO handles resizing)

    Returns:
        RGB image array (HWC, uint8) - YOLO will handle the rest
    """
    # Convert BGR to RGB (YOLO expects RGB)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Ensure uint8 format
    if rgb_image.dtype != np.uint8:
        rgb_image = rgb_image.astype(np.uint8)

    return rgb_image
