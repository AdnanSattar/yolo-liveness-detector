"""
YOLOv8 training script for anti-spoofing detection.
Supports both offline and online (Colab) training.
"""

import os

from ultralytics import YOLO


def main():
    """Main training function."""
    # Configuration
    model_name = "yolov8n.pt"  # or 'yolov8l.pt' for large
    data_yaml = "Dataset/SplitData/data.yaml"
    epochs = 300
    patience = 25
    batch_size = 16
    imgsz = 640

    # Check if data.yaml exists
    if not os.path.exists(data_yaml):
        print(f"Error: {data_yaml} not found. Please run split_data.py first.")
        return

    # Load model
    print(f"Loading model: {model_name}")
    model = YOLO(model_name)

    # Train
    print(f"Starting training with {epochs} epochs...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        patience=patience,
        batch=batch_size,
        imgsz=imgsz,
        device=0,  # Use GPU if available, else CPU
        project="runs",
        name="anti_spoofing",
        exist_ok=True,
    )

    print("Training completed!")
    print(f"Best model saved at: {results.save_dir}/weights/best.pt")

    # Export to ONNX (optional)
    export_onnx = input("Export to ONNX? (y/n): ").lower() == "y"
    if export_onnx:
        model.export(format="onnx", imgsz=imgsz)
        print(f"ONNX model exported to: {results.save_dir}/weights/best.onnx")


if __name__ == "__main__":
    # For Windows multiprocessing
    import multiprocessing

    multiprocessing.freeze_support()
    main()
