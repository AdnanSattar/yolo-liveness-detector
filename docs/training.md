# Training Guide

This guide explains how to train a YOLOv8 model for anti-spoofing/liveness detection.

## Overview

The training pipeline uses a **blur-based approach** where:

- Faces shown on screens/phones are typically blurrier than real faces
- The data collection script filters out blurry faces to ensure quality
- The model learns to distinguish real vs fake based on visual features including blur patterns

## Step 1: Data Collection

### Setup

1. Install dependencies:

```powershell
pip install opencv-python cvzone ultralytics
```

1. Edit `training/data_collection.py`:
   - Set `classID = 0` for **fake** (spoof) data collection
   - Set `classID = 1` for **real** (live) data collection
   - Adjust `blurThreshold` (default 35) - higher = stricter focus requirement
   - Set `outputFolderPath = "Dataset/DataCollect"`

### Collecting FAKE Data (classID = 0)

**Goal:** Collect faces that are NOT real (spoofs)

1. Set `classID = 0` in the script
2. Run: `python training/data_collection.py`
3. Show the camera:
   - **Faces on mobile screens** (photos/videos on phones/tablets)
   - **Printed photos** of faces
   - **Video calls** showing faces on screens
4. The script will:
   - Detect faces using MediaPipe
   - Check blur value (Laplacian variance)
   - Only save frames where blur > threshold (focused enough)
   - Save images + YOLO format labels to `Dataset/DataCollect/`

**Tips:**

- Vary lighting conditions
- Use different phone models/screen sizes
- Include both photos and videos on screens
- Ensure faces are clearly visible (blur threshold filters out too-blurry ones)

### Collecting REAL Data (classID = 1)

**Goal:** Collect live, real faces

1. Set `classID = 1` in the script
2. Run: `python training/data_collection.py`
3. Show the camera:
   - **Live faces** directly (not on screens)
   - Multiple people, different angles
   - Various lighting conditions
4. Same blur filtering applies - only focused faces are saved

**Tips:**

- Collect diverse demographics
- Vary head angles (front, side, slight rotation)
- Different lighting (bright, dim, natural)
- Different expressions

### After Collection

1. Copy all collected images from `Dataset/DataCollect/` to `Dataset/all/`
2. Ensure both `.jpg` and `.txt` files are copied
3. You should have a mix of fake (class 0) and real (class 1) samples

## Step 2: Split Dataset

Run the split script:

```powershell
python training/split_data.py
```

This will:

- Read from `Dataset/all/`
- Split into train/val/test (70/20/10)
- Create `Dataset/SplitData/` with proper YOLO structure
- Generate `data.yaml` with class names: `["fake", "real"]`

## Step 3: Train Model

Edit `training/train.py` if needed (defaults are usually fine), then:

```powershell
python training/train.py
```

**Training parameters:**

- Model: `yolov8n.pt` (nano - fastest, good for edge devices)
- Epochs: 300 (with early stopping patience=25)
- Batch size: 16
- Image size: 640x640

**Output:**

- Best model: `runs/anti_spoofing/weights/best.pt`
- Training logs: `runs/anti_spoofing/`

## Step 4: Deploy Model

1. Copy `runs/anti_spoofing/weights/best.pt` to `model/anti_spoofing.pt`
2. Restart your FastAPI service
3. Test with the web frontend

## Troubleshooting

### Model doesn't detect screen-based spoofs

**Problem:** Model only detects real faces, misses phone screens.

**Solution:**

- Ensure you collected enough **fake** data (classID=0) with screen-based faces
- Check that blur threshold isn't too high (filtering out all screen faces)
- Retrain with more diverse spoof examples

### Too many false positives

**Problem:** Real faces detected as fake.

**Solution:**

- Increase `CONFIDENCE_THRESHOLD` in `.env` (try 0.4-0.5)
- Collect more real face data
- Check class mapping: model outputs `0=fake, 1=real`

### Model too slow

**Problem:** Inference latency > 3 seconds.

**Solutions:**

- Use smaller model: `yolov8n.pt` instead of `yolov8l.pt`
- Reduce image size in training (e.g., 416 instead of 640)
- Use GPU for inference (`DEVICE=cuda` in `.env`)
- Export to ONNX and use ONNX Runtime (faster than PyTorch)

## Class Mapping Reference

- **Training labels:** `classID = 0` (fake), `classID = 1` (real)
- **Model output:** `class 0 = fake`, `class 1 = real`
- **Frontend display:** Maps to `"fake"` and `"real"` strings

This matches the original project's `classNames = ["fake", "real"]` convention.
