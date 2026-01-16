"""
YOLO model wrapper with singleton pattern.
"""

from typing import Optional

import torch
import torch.nn as nn
from ultralytics import YOLO

from app.core.config import get_device, settings


class ModelWrapper:
    """Singleton wrapper for YOLO model."""

    _instance: Optional["ModelWrapper"] = None
    _model: Optional[YOLO] = None
    _device: Optional[str] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._device = get_device()
            self._load_model()

    def _load_model(self):
        """Load YOLO model.

        Torch 2.6+ defaults `torch.load(..., weights_only=True)`, which breaks
        older checkpoints that serialize full module objects.
        We explicitly allowlist required classes for safe unpickling.
        """
        try:
            # Allowlist common Ultralytics / PyTorch modules used in YOLO models
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
                # If this fails, we still try to load; error will surface below
                pass

            # Load model on the configured device
            self._model = YOLO(settings.MODEL_PATH)
            self._model.to(self._device)
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {e}")

    def predict(self, image, **kwargs):
        """
        Run inference on image.

        Args:
            image: Preprocessed image array
            **kwargs: Additional arguments for YOLO predict

        Returns:
            YOLO results object
        """
        if self._model is None:
            raise RuntimeError("Model not loaded")

        # YOLO's predict() handles preprocessing internally
        # It expects: numpy array (HWC, uint8), PIL Image, or file path
        # Convert from our preprocessed format back to what YOLO expects
        import numpy as np

        # If we have preprocessed format (CHW normalized), convert back
        if len(image.shape) == 4:  # Batch dimension
            image = image[0]  # Remove batch dimension

        if len(image.shape) == 3 and image.shape[0] == 3:  # CHW format
            image = image.transpose(1, 2, 0)  # Convert to HWC

        # Denormalize if needed
        if image.dtype == np.float32 and image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)

        # Ensure it's HWC uint8
        if len(image.shape) == 3 and image.shape[2] == 3:
            # Already in correct format
            pass
        else:
            # Fallback: use original image if preprocessing went wrong
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"Unexpected image shape: {image.shape}, using as-is")

        # Run inference - YOLO will handle resizing internally
        import logging

        logger = logging.getLogger(__name__)
        logger.debug(
            f"Running inference with conf threshold: {settings.CONFIDENCE_THRESHOLD}, image shape: {image.shape}"
        )

        results = self._model.predict(
            image,
            imgsz=640,  # YOLO standard size
            conf=settings.CONFIDENCE_THRESHOLD,
            verbose=False,
            **kwargs,
        )

        logger.debug(
            f"Inference completed, results type: {type(results)}, num results: {len(results)}"
        )

        return results

    @property
    def model(self) -> YOLO:
        """Get the underlying YOLO model."""
        return self._model

    @property
    def device(self) -> str:
        """Get the device being used."""
        return self._device

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._model is not None


# Global model instance
_model_wrapper: Optional[ModelWrapper] = None


def get_model() -> ModelWrapper:
    """Get the global model instance."""
    global _model_wrapper
    if _model_wrapper is None:
        _model_wrapper = ModelWrapper()
    return _model_wrapper
