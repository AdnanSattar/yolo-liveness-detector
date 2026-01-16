import React, { useRef, useEffect, useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera'
import { runOnJS } from 'react-native-reanimated'

interface CameraViewProps {
  onFrameProcessed?: (frame: any) => void
  isActive: boolean
}

export default function CameraView({ onFrameProcessed, isActive }: CameraViewProps) {
  const device = useCameraDevice('front')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    const status = await Camera.getCameraPermissionStatus()
    if (status === 'not-determined') {
      const newStatus = await Camera.requestCameraPermission()
      setHasPermission(newStatus === 'granted')
    } else {
      setHasPermission(status === 'granted')
    }

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required for face detection')
    }
  }

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    // Frame processing happens here
    // For now, we'll pass frames to native module via bridge
    if (onFrameProcessed) {
      runOnJS(onFrameProcessed)(frame)
    }
  }, [onFrameProcessed])

  if (hasPermission === null) {
    return <View style={styles.container} />
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          {/* Error message */}
        </View>
      </View>
    )
  }

  if (!device) {
    return <View style={styles.container} />
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
