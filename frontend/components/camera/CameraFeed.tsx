"use client"

import { useRef, useCallback, useState, useEffect } from 'react'
import Webcam from 'react-webcam'

interface CameraFeedProps {
  onFrameCapture?: (imageSrc: string) => void
  width?: number
  height?: number
  mirrored?: boolean
  fps?: number
}

export default function CameraFeed({
  onFrameCapture,
  width = 640,
  height = 480,
  mirrored = true,
  fps = 3,
}: CameraFeedProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUserMedia = useCallback(() => {
    setIsStreaming(true)
    setError(null)
  }, [])

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setIsStreaming(false)
    setError(error instanceof DOMException ? error.message : String(error))
  }, [])

  const capture = useCallback(() => {
    if (webcamRef.current && onFrameCapture) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        onFrameCapture(imageSrc)
      }
    }
  }, [onFrameCapture])

  // Capture frames at a controlled FPS (client-side sampling)
  useEffect(() => {
    if (!isStreaming || !onFrameCapture) return
    const interval = setInterval(() => {
      capture()
    }, Math.floor(1000 / fps))
    return () => clearInterval(interval)
  }, [isStreaming, onFrameCapture, capture, fps])

  return (
    <div className="relative w-full h-full">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={width}
        height={height}
        videoConstraints={{
          width: width,
          height: height,
          facingMode: 'user',
        }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        mirrored={mirrored}
        className="w-full h-full object-cover rounded-lg"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
          <p className="text-red-500 text-sm">Camera Error: {error}</p>
        </div>
      )}
      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
          <p className="text-white">Initializing camera...</p>
        </div>
      )}
    </div>
  )
}
