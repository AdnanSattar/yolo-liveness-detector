/**
 * React Native bridge wrapper for native inference modules
 */
import { NativeModules, Platform } from 'react-native'
import { InferenceResult, FaceDetection } from '../types'

const { YoloModule } = NativeModules

interface YoloModuleInterface {
  initModel(): Promise<boolean>
  runInference(frame: any): Promise<InferenceResult>
  release(): Promise<void>
}

class YoloBridge implements YoloModuleInterface {
  private initialized = false

  async initModel(): Promise<boolean> {
    if (!YoloModule) {
      throw new Error('YoloModule native module not available')
    }

    try {
      const success = await YoloModule.initModel()
      this.initialized = success
      return success
    } catch (error) {
      console.error('Failed to initialize model:', error)
      throw error
    }
  }

  async runInference(frame: any): Promise<InferenceResult> {
    if (!this.initialized) {
      throw new Error('Model not initialized. Call initModel() first.')
    }

    if (!YoloModule) {
      throw new Error('YoloModule native module not available')
    }

    try {
      const result = await YoloModule.runInference(frame)
      return result as InferenceResult
    } catch (error) {
      console.error('Inference failed:', error)
      throw error
    }
  }

  async release(): Promise<void> {
    if (YoloModule) {
      try {
        await YoloModule.release()
        this.initialized = false
      } catch (error) {
        console.error('Failed to release model:', error)
      }
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const yoloBridge = new YoloBridge()
export default yoloBridge
