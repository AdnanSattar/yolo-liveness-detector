/**
 * Inference coordinator with throttling and temporal smoothing
 */
import { yoloBridge } from './NativeBridge'
import { InferenceResult, FaceDetection } from '../types'

interface DetectionState {
  lastResult: FaceDetection[]
  lastUpdateTime: number
  rollingWindow: FaceDetection[][]
  windowSize: number
}

class Detector {
  private state: DetectionState = {
    lastResult: [],
    lastUpdateTime: 0,
    rollingWindow: [],
    windowSize: 5, // Number of frames to consider for smoothing
  }

  private fps = 3 // Target FPS for inference
  private minInterval = 1000 / this.fps // Minimum time between inferences

  async initialize(): Promise<boolean> {
    try {
      return await yoloBridge.initModel()
    } catch (error) {
      console.error('Detector initialization failed:', error)
      return false
    }
  }

  async detect(frame: any): Promise<FaceDetection[]> {
    const now = Date.now()

    // Throttle inference calls
    if (now - this.state.lastUpdateTime < this.minInterval) {
      return this.state.lastResult
    }

    try {
      const result: InferenceResult = await yoloBridge.runInference(frame)
      this.state.lastUpdateTime = now

      // Add to rolling window
      this.state.rollingWindow.push(result.faces)
      if (this.state.rollingWindow.length > this.state.windowSize) {
        this.state.rollingWindow.shift()
      }

      // Apply temporal smoothing (majority vote)
      const smoothed = this.applyTemporalSmoothing()
      this.state.lastResult = smoothed

      return smoothed
    } catch (error) {
      console.error('Detection failed:', error)
      return this.state.lastResult // Return last known result
    }
  }

  private applyTemporalSmoothing(): FaceDetection[] {
    if (this.state.rollingWindow.length === 0) {
      return []
    }

    // Simple majority vote: if most frames show "real", return "real"
    // This is a simplified approach - you can implement more sophisticated smoothing
    const realCount = this.state.rollingWindow.filter(
      (faces) => faces.some((f) => f.label === 'real')
    ).length

    const fakeCount = this.state.rollingWindow.filter(
      (faces) => faces.some((f) => f.label === 'fake')
    ).length

    // Return the most recent detection for now
    // In production, implement proper smoothing logic
    return this.state.rollingWindow[this.state.rollingWindow.length - 1] || []
  }

  async release(): Promise<void> {
    await yoloBridge.release()
    this.state = {
      lastResult: [],
      lastUpdateTime: 0,
      rollingWindow: [],
      windowSize: 5,
    }
  }
}

export const detector = new Detector()
export default detector
