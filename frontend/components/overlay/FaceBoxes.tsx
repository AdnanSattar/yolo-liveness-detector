"use client"

import { FaceDetection } from '@/lib/types'
import { useMemo, useRef, useEffect, useState } from 'react'

interface FaceBoxesProps {
  detections: FaceDetection[]
  videoWidth: number
  videoHeight: number
}

export default function FaceBoxes({
  detections,
  videoWidth,
  videoHeight,
}: FaceBoxesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)

  // Calculate scale factors based on actual rendered size vs model output size
  useEffect(() => {
    if (!containerRef.current) return

    const updateScale = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setScaleX(rect.width / videoWidth)
        setScaleY(rect.height / videoHeight)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [videoWidth, videoHeight])

  const boxes = useMemo(() => {
    return detections.map((detection, index) => {
      const { bbox, label, confidence } = detection
      const isReal = label === 'real'

      // Scale coordinates to match actual rendered video size
      const scaledX = bbox.x * scaleX
      const scaledY = bbox.y * scaleY
      const scaledW = bbox.w * scaleX
      const scaledH = bbox.h * scaleY

      return (
        <div
          key={index}
          className="absolute border-[1.5px] rounded-md transition-all duration-150"
          style={{
            left: `${scaledX}px`,
            top: `${scaledY}px`,
            width: `${scaledW}px`,
            height: `${scaledH}px`,
            borderColor: isReal ? '#22c55e' : '#f97373',
            boxShadow: `0 0 4px ${isReal ? 'rgba(34, 197, 94, 0.35)' : 'rgba(248, 113, 113, 0.35)'}`,
          }}
        >
          <div
            className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs font-semibold text-white ${
              isReal ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {label.toUpperCase()} {Math.round(confidence * 100)}%
          </div>
        </div>
      )
    })
  }, [detections, scaleX, scaleY])

  if (detections.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {boxes}
    </div>
  )
}
