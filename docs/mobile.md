# Mobile (React Native) Notes

The `mobile/` app is scaffolded for **on-device** inference, but native preprocessing/postprocessing needs to be aligned with your exported model.

## Model export

1) Export `.pt` → `.onnx`:

```powershell
python -m training.export_onnx --model model/anti_spoofing.pt --imgsz 640
```

1) Copy to:

- `mobile/assets/anti_spoofing.onnx`

## Android

Native module:

- `mobile/android/app/src/main/java/com/antispoofing/YoloModule.kt`

Notes:

- NNAPI delegate is enabled via `sessionOptions.addNnapi()`.
- `preprocessFrame(...)` is currently placeholder; you need to convert YUV frames to RGB and normalize per model.

## iOS

Native module:

- `mobile/ios/YoloModule.swift`

Notes:

- Expects a compiled CoreML model `anti_spoofing.mlmodelc` in the iOS bundle.
- Converting ONNX → CoreML typically requires `coremltools` (done on macOS).
