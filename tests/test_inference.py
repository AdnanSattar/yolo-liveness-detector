"""
Unit tests for inference pipeline.
"""
import numpy as np
import pytest

from app.core.config import settings
from app.inference.model import ModelWrapper
from app.inference.postprocessor import format_detections, postprocess_results
from app.inference.preprocessor import decode_image, preprocess_image


class MockYOLOResult:
    """Mock YOLO result for testing."""
    def __init__(self, boxes=None):
        self.boxes = boxes


class MockBox:
    """Mock box for testing."""
    def __init__(self, conf, cls, xyxy):
        self.conf = [conf]
        self.cls = [cls]
        self.xyxy = [xyxy]
        self.xyxy_tensor = None


def test_preprocess_image():
    """Test image preprocessing."""
    # Create dummy image
    dummy_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    # Preprocess
    preprocessed = preprocess_image(dummy_image)
    
    # Check shape
    assert preprocessed.shape == (1, 3, 480, 640)
    assert preprocessed.dtype == np.float32
    assert preprocessed.min() >= 0.0
    assert preprocessed.max() <= 1.0


def test_postprocess_results():
    """Test post-processing of results."""
    # Create mock results
    mock_box1 = MockBox(conf=0.9, cls=1, xyxy=np.array([10, 20, 100, 150]))
    mock_box2 = MockBox(conf=0.7, cls=0, xyxy=np.array([200, 300, 300, 400]))
    mock_box3 = MockBox(conf=0.5, cls=1, xyxy=np.array([400, 500, 500, 600]))  # Below threshold
    
    mock_result = MockYOLOResult(boxes=[mock_box1, mock_box2, mock_box3])
    
    # Post-process
    detections = postprocess_results([mock_result], confidence_threshold=0.6)
    
    # Should have 2 detections (one below threshold filtered out)
    assert len(detections) == 2
    assert detections[0]["label"] == "real"
    assert detections[0]["confidence"] == 0.9
    assert detections[1]["label"] == "fake"
    assert detections[1]["confidence"] == 0.7


def test_format_detections():
    """Test formatting detections into Pydantic models."""
    detections = [
        {
            "label": "real",
            "confidence": 0.95,
            "bbox": {"x": 10, "y": 20, "w": 100, "h": 150}
        }
    ]
    
    formatted = format_detections(detections)
    
    assert len(formatted) == 1
    assert formatted[0].label == "real"
    assert formatted[0].confidence == 0.95
    assert formatted[0].bbox.x == 10
    assert formatted[0].bbox.y == 20
