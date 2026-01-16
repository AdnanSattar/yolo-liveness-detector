/**
 * TypeScript types for React Native app
 */

export interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

export interface FaceDetection {
  label: 'real' | 'fake'
  confidence: number
  bbox: BoundingBox
}

export interface InferenceResult {
  faces: FaceDetection[]
  latency_ms?: number
}
