"""
Configuration management using Pydantic Settings.
Loads settings from environment variables with validation.
"""

from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Model Configuration
    MODEL_PATH: str = "model/anti_spoofing.pt"
    # Lower threshold to catch more detections (including screen-based spoofs)
    CONFIDENCE_THRESHOLD: float = 0.70
    DEVICE: str = "auto"  # auto, cpu, cuda

    # API Configuration
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"  # debug, info, warning, error

    # CORS Configuration
    # NOTE: keep as simple strings; parse in app startup if you want comma-separated support.
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Inference Configuration
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    IMAGE_WIDTH: int = 640
    IMAGE_HEIGHT: int = 480

    # Application Metadata
    APP_NAME: str = "Anti-Spoofing Detection API"
    APP_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_device() -> str:
    """Determine the device to use for inference."""
    if settings.DEVICE != "auto":
        return settings.DEVICE

    # Auto-detect device
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass

    return "cpu"
