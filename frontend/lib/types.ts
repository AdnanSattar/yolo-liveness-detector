/**
 * TypeScript interfaces matching FastAPI schemas
 */

export interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

export interface FaceDetection {
  label: "real" | "fake"
  confidence: number
  bbox: BoundingBox
}

export interface PredictionResponse {
  faces: FaceDetection[]
  latency_ms: number
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  device: string
  version: string
  uptime_seconds?: number
}

export interface ApiError {
  error: string
  detail?: string
}
