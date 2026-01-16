import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { FaceDetection } from '../types'

interface FaceOverlayProps {
  detections: FaceDetection[]
  videoWidth: number
  videoHeight: number
}

export default function FaceOverlay({
  detections,
  videoWidth,
  videoHeight,
}: FaceOverlayProps) {
  return (
    <View style={[styles.container, { width: videoWidth, height: videoHeight }]}>
      {detections.map((detection, index) => {
        const { bbox, label, confidence } = detection
        const isReal = label === 'real'
        const borderColor = isReal ? '#10b981' : '#ef4444'

        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                left: bbox.x,
                top: bbox.y,
                width: bbox.w,
                height: bbox.h,
                borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.label,
                {
                  backgroundColor: isReal ? '#10b981' : '#ef4444',
                },
              ]}
            >
              <Text style={styles.labelText}>
                {label.toUpperCase()} {Math.round(confidence * 100)}%
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    top: -28,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
