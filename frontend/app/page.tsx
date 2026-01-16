"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import CameraFeed from '@/components/camera/CameraFeed'
import FrameCapture from '@/components/camera/FrameCapture'
import FaceBoxes from '@/components/overlay/FaceBoxes'
import StatusBadge from '@/components/overlay/StatusBadge'
import Scene from '@/components/three/Scene'
import { FaceDetection } from '@/lib/types'
import { checkHealth } from '@/lib/api'

const VIDEO_WIDTH = 640
const VIDEO_HEIGHT = 480

export default function Home() {
  const [detections, setDetections] = useState<FaceDetection[]>([])
  const [currentFrame, setCurrentFrame] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | undefined>(undefined)
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const webcamRef = useRef<{ getScreenshot: () => string | null } | null>(null)

  // Health check: initial + periodic polling so banner reflects real status
  useEffect(() => {
    let cancelled = false

    const runHealthCheck = () => {
      checkHealth()
        .then((health) => {
          if (!cancelled) {
            setIsHealthy(health.model_loaded)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsHealthy(false)
          }
        })
    }

    runHealthCheck()
    const interval = setInterval(runHealthCheck, 10000) // every 10s

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Capture frame periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const screenshot = webcamRef.current.getScreenshot()
        if (screenshot) {
          setCurrentFrame(screenshot)
        }
      }
    }, 1000 / 3) // 3 FPS

    return () => clearInterval(interval)
  }, [])

  const handleFrameCapture = useCallback((imageSrc: string) => {
    setCurrentFrame(imageSrc)
  }, [])

  const handleDetection = useCallback(
    (newDetections: FaceDetection[], responseLatency?: number) => {
      setDetections(newDetections)
      if (responseLatency !== undefined) {
        setLatency(responseLatency)
      }
      // A successful prediction implies the API is reachable and model is loaded
      setIsHealthy(true)
      setError(null)
    },
    []
  )

  const handleError = useCallback((errorMessage: string) => {
    // Only set error if it's a real connection issue, not just "no faces detected"
    if (errorMessage.includes('No response from server') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      setError(errorMessage)
      setIsHealthy(false)
    } else {
      // For other errors (like "no faces"), just log but don't show persistent error
      console.warn('Prediction error:', errorMessage)
      setError(null) // Clear error on non-connection issues
    }
    setDetections([])
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-2 sm:py-4 md:py-6">
      <div className="w-full max-w-5xl flex flex-col h-full">
        {/* Header */}
        <div className="mb-3 sm:mb-4 md:mb-6 text-center space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
            Anti-Spoofing Detection
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300">
            Real-time face liveness detection using YOLOv8
          </p>

          {/* API connection status + latency */}
          <div className="mt-2 sm:mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-100 border border-slate-700">
              <div
                className={`w-2 h-2 rounded-full ${
                  isHealthy === false
                    ? 'bg-amber-400 animate-pulse'
                    : isHealthy === true
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400 animate-pulse'
                }`}
              />
              <span>
                {isHealthy === null && 'Checking API status…'}
                {isHealthy === true && 'API Connected'}
                {isHealthy === false && 'API not available'}
              </span>
              {latency !== undefined && (
                <span className="ml-1 text-[11px] font-mono text-slate-300">
                  • {latency.toFixed(0)}ms
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Camera Container */}
        <div
          className="relative mx-auto mb-3 sm:mb-4 md:mb-6 bg-black/90 rounded-xl overflow-hidden shadow-lg shadow-black/40 w-full max-w-[640px] aspect-video"
          style={{ maxHeight: 'min(100vh - 300px, 480px)' }}
        >
          {/* Three.js Scene Background */}
          <Scene detections={detections} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />

          {/* Camera Feed */}
          <div className="relative z-10 h-full">
            <CameraFeed
              onFrameCapture={handleFrameCapture}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
            />
          </div>

          {/* Face Detection Boxes Overlay */}
          <FaceBoxes
            detections={detections}
            videoWidth={VIDEO_WIDTH}
            videoHeight={VIDEO_HEIGHT}
          />

          {/* Frame Capture (hidden, handles API calls) */}
          <FrameCapture
            imageSrc={currentFrame}
            onDetection={handleDetection}
            onError={handleError}
            fps={3}
          />
        </div>

        {/* Status and Controls */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <StatusBadge detections={detections} latency={latency} />

          {error && (
            <div className="bg-rose-900/30 border border-rose-600 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 max-w-md text-center">
              <p className="text-rose-200 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {detections.length > 0 && (
            <div className="text-slate-300 text-xs sm:text-sm">
              {detections.length} face{detections.length !== 1 ? 's' : ''} detected
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-2 sm:mt-4 md:mt-6 text-center text-slate-400 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
          <p>Position your face in front of the camera in normal room lighting.</p>
          <p>The system will classify each detected face as real or spoof.</p>
        </div>
      </div>
    </main>
  )
}
