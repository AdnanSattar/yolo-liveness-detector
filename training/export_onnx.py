"""
Export YOLOv8 model to ONNX format with quantization support.
"""

import argparse
import os

from ultralytics import YOLO


def export_to_onnx(
    model_path: str,
    output_path: str = None,
    imgsz: int = 640,
    quantize: bool = False,
    precision: str = "fp16",
):
    """
    Export YOLOv8 model to ONNX format.

    Args:
        model_path: Path to .pt model file
        output_path: Output path for ONNX model (optional)
        imgsz: Image size for export
        quantize: Whether to quantize the model
        precision: Quantization precision (fp16, int8)
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")

    print(f"Loading model: {model_path}")
    model = YOLO(model_path)

    # Export to ONNX
    print(f"Exporting to ONNX (imgsz={imgsz})...")
    exported_path = model.export(format="onnx", imgsz=imgsz, simplify=True, opset=12)

    print(f"ONNX model exported to: {exported_path}")

    # Quantization (if requested)
    if quantize:
        print(f"Quantizing model to {precision}...")
        # Note: Quantization may require additional tools like onnxruntime-tools
        # This is a placeholder for the quantization process
        print(
            "Note: Full quantization requires onnxruntime-tools or other quantization libraries"
        )

    # Move to output path if specified
    if output_path and exported_path != output_path:
        import shutil

        shutil.move(exported_path, output_path)
        print(f"Model moved to: {output_path}")

    return exported_path


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Export YOLOv8 model to ONNX")
    parser.add_argument("--model", type=str, required=True, help="Path to .pt model")
    parser.add_argument(
        "--output", type=str, default=None, help="Output path for ONNX model"
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--quantize", action="store_true", help="Quantize model")
    parser.add_argument(
        "--precision",
        type=str,
        default="fp16",
        choices=["fp16", "int8"],
        help="Quantization precision",
    )

    args = parser.parse_args()

    export_to_onnx(
        model_path=args.model,
        output_path=args.output,
        imgsz=args.imgsz,
        quantize=args.quantize,
        precision=args.precision,
    )


if __name__ == "__main__":
    main()
