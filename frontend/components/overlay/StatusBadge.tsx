"use client"

import { Badge } from '@/components/ui/badge'
import { FaceDetection } from '@/lib/types'

interface StatusBadgeProps {
  detections: FaceDetection[]
  latency?: number
}

export default function StatusBadge({ detections, latency }: StatusBadgeProps) {
  if (detections.length === 0) {
    return (
      <Badge 
        variant="secondary" 
        className="text-sm px-4 py-2 bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
      >
        No faces detected
      </Badge>
    )
  }

  // Determine overall status (if any face is fake, show fake)
  const hasFake = detections.some((d) => d.label === 'fake')
  const hasReal = detections.some((d) => d.label === 'real')
  
  // Get highest confidence
  const maxConfidence = Math.max(...detections.map((d) => d.confidence))

  let status: 'real' | 'fake' | 'mixed' = 'mixed'
  if (hasFake && !hasReal) {
    status = 'fake'
  } else if (hasReal && !hasFake) {
    status = 'real'
  }

  const variant = status === 'real' ? 'success' : status === 'fake' ? 'destructive' : 'warning'

  return (
    <Badge variant={variant} className="text-sm px-4 py-2">
      {status === 'real' && '✓ REAL'}
      {status === 'fake' && '✗ FAKE'}
      {status === 'mixed' && '⚠ MIXED'}
      {' '}
      {Math.round(maxConfidence * 100)}%
    </Badge>
  )
}
