import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Text, StatusBar, Alert } from 'react-native'
import CameraView from '../camera/CameraView'
import FaceOverlay from '../overlay/FaceOverlay'
import { detector } from '../inference/Detector'
import { FaceDetection } from '../types'

const VIDEO_WIDTH = 640
const VIDEO_HEIGHT = 480

export default function Home() {
  const [detections, setDetections] = useState<FaceDetection[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    initializeDetector()

    return () => {
      detector.release()
    }
  }, [])

  const initializeDetector = async () => {
    try {
      const success = await detector.initialize()
      setIsInitialized(success)
      if (!success) {
        Alert.alert('Error', 'Failed to initialize detection model')
      }
    } catch (error) {
      console.error('Initialization error:', error)
      Alert.alert('Error', 'Failed to initialize detection model')
    }
  }

  const handleFrameProcessed = useCallback(async (frame: any) => {
    if (!isInitialized) return

    try {
      const newDetections = await detector.detect(frame)
      setDetections(newDetections)
    } catch (error) {
      console.error('Frame processing error:', error)
    }
  }, [isInitialized])

  const getStatusText = () => {
    if (!isInitialized) {
      return 'Initializing...'
    }

    if (detections.length === 0) {
      return 'No faces detected'
    }

    const hasReal = detections.some((d) => d.label === 'real')
    const hasFake = detections.some((d) => d.label === 'fake')

    if (hasReal && !hasFake) {
      return 'REAL'
    } else if (hasFake && !hasReal) {
      return 'FAKE'
    } else {
      return 'MIXED'
    }
  }

  const getStatusColor = () => {
    if (detections.length === 0) {
      return '#6b7280'
    }

    const hasReal = detections.some((d) => d.label === 'real')
    const hasFake = detections.some((d) => d.label === 'fake')

    if (hasReal && !hasFake) {
      return '#10b981'
    } else if (hasFake && !hasReal) {
      return '#ef4444'
    } else {
      return '#f59e0b'
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          onFrameProcessed={handleFrameProcessed}
          isActive={isActive}
        />
        
        {/* Face Overlay */}
        <FaceOverlay
          detections={detections}
          videoWidth={VIDEO_WIDTH}
          videoHeight={VIDEO_HEIGHT}
        />
      </View>

      {/* Status Bar */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(),
            },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        {detections.length > 0 && (
          <Text style={styles.detectionCount}>
            {detections.length} face{detections.length !== 1 ? 's' : ''} detected
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  statusContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detectionCount: {
    color: '#9ca3af',
    fontSize: 14,
  },
})
