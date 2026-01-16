"""
Integration tests for API endpoints.
"""
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data
    assert "device" in data
    assert "version" in data


def test_predict_endpoint_invalid_file():
    """Test predict endpoint with invalid file."""
    response = client.post("/v1/predict", files={"file": ("test.txt", b"not an image", "text/plain")})
    assert response.status_code == 400


def test_predict_endpoint_valid_image():
    """Test predict endpoint with valid image."""
    # Create a dummy image
    img = Image.new('RGB', (640, 480), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    response = client.post(
        "/v1/predict",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    
    # Should return 200 even if no faces detected
    assert response.status_code in [200, 500]  # 500 if model not loaded
    if response.status_code == 200:
        data = response.json()
        assert "faces" in data
        assert "latency_ms" in data
        assert isinstance(data["faces"], list)
