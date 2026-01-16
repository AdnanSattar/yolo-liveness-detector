"use client"

import { useRef, useCallback, useEffect } from 'react'
import { predictImage } from '@/lib/api'
import { FaceDetection, PredictionResponse } from '@/lib/types'

interface FrameCaptureProps {
  imageSrc: string | null
  onDetection: (detections: FaceDetection[], latency?: number) => void
  onError: (error: string) => void
  fps?: number // Frames per second for capture
}

export default function FrameCapture({
  imageSrc,
  onDetection,
  onError,
  fps = 3, // Default 3 FPS
}: FrameCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCaptureTimeRef = useRef<number>(0)
  const requestInFlightRef = useRef<boolean>(false)

  const captureAndPredict = useCallback(async (src: string) => {
    if (!canvasRef.current) return

    // Prevent flooding the API: only allow one in-flight prediction at a time.
    // IMPORTANT: guard early (before image decode/toBlob) to prevent multiple async callbacks slipping through.
    if (requestInFlightRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    requestInFlightRef.current = true

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = async () => {
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0)
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          onError('Failed to convert image to blob')
          requestInFlightRef.current = false
          return
        }

        // Convert blob to File
        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })

        try {
          const response: PredictionResponse = await predictImage(file)
          // Pass both faces and latency, and clear any previous errors
          onDetection(response.faces, response.latency_ms)
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Prediction failed')
        } finally {
          requestInFlightRef.current = false
        }
      }, 'image/jpeg', 0.9)
    }

    img.onerror = () => {
      onError('Failed to load image')
      requestInFlightRef.current = false
    }

    img.src = src
  }, [onDetection, onError])

  useEffect(() => {
    if (!imageSrc) return

    const minInterval = 1000 / fps // Minimum time between captures in ms
    const now = Date.now()

    if (now - lastCaptureTimeRef.current >= minInterval) {
      lastCaptureTimeRef.current = now
      captureAndPredict(imageSrc)
    } else {
      // Schedule next capture
      const delay = minInterval - (now - lastCaptureTimeRef.current)
      intervalRef.current = setTimeout(() => {
        lastCaptureTimeRef.current = Date.now()
        captureAndPredict(imageSrc)
      }, delay)
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [imageSrc, fps, captureAndPredict])

  return <canvas ref={canvasRef} className="hidden" />
}
