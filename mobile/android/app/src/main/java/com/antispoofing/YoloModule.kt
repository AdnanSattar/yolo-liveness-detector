package com.antispoofing

import android.content.Context
import android.graphics.Bitmap
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.onnxruntime.*
import java.io.InputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

class YoloModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var ortEnv: OrtEnvironment? = null
    private var ortSession: OrtSession? = null
    private val inputName = "images"
    private val outputName = "output0"
    private val modelPath = "anti_spoofing.onnx" // Model should be in assets folder

    override fun getName(): String {
        return "YoloModule"
    }

    @ReactMethod
    fun initModel(promise: Promise) {
        try {
            ortEnv = OrtEnvironment.getEnvironment()
            
            // Load model from assets
            val context = reactApplicationContext
            val inputStream: InputStream = context.assets.open(modelPath)
            val modelBytes = inputStream.readBytes()
            inputStream.close()

            // Create session options with NNAPI delegate
            val sessionOptions = OrtSession.SessionOptions()
            sessionOptions.addNnapi() // Enable NNAPI for hardware acceleration

            ortSession = ortEnv!!.createSession(modelBytes, sessionOptions)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize model: ${e.message}", e)
        }
    }

    @ReactMethod
    fun runInference(frameData: ReadableMap, promise: Promise) {
        try {
            if (ortSession == null) {
                promise.reject("NOT_INITIALIZED", "Model not initialized")
                return
            }

            // Extract frame data from React Native
            // Note: This is a simplified version - actual implementation depends on frame format
            val width = frameData.getInt("width")
            val height = frameData.getInt("height")
            val data = frameData.getArray("data")

            // Convert frame data to tensor
            val inputTensor = preprocessFrame(data, width, height)

            // Run inference
            val inputs = mapOf(inputName to inputTensor)
            val outputs = ortSession!!.run(inputs)

            // Post-process results
            val results = postprocessResults(outputs, width, height)

            // Convert to WritableMap for React Native
            val resultMap = Arguments.createMap()
            val facesArray = Arguments.createArray()

            for (face in results) {
                val faceMap = Arguments.createMap()
                faceMap.putString("label", face["label"] as String)
                faceMap.putDouble("confidence", (face["confidence"] as Number).toDouble())
                
                val bboxMap = Arguments.createMap()
                bboxMap.putInt("x", (face["x"] as Number).toInt())
                bboxMap.putInt("y", (face["y"] as Number).toInt())
                bboxMap.putInt("w", (face["w"] as Number).toInt())
                bboxMap.putInt("h", (face["h"] as Number).toInt())
                
                faceMap.putMap("bbox", bboxMap)
                facesArray.pushMap(faceMap)
            }

            resultMap.putArray("faces", facesArray)
            promise.resolve(resultMap)

        } catch (e: Exception) {
            promise.reject("INFERENCE_ERROR", "Inference failed: ${e.message}", e)
        }
    }

    @ReactMethod
    fun release(promise: Promise) {
        try {
            ortSession?.close()
            ortSession = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RELEASE_ERROR", "Failed to release model: ${e.message}", e)
        }
    }

    private fun preprocessFrame(data: ReadableArray?, width: Int, height: Int): OnnxTensor {
        // Convert YUV/RGB frame data to normalized tensor
        // Input shape: [1, 3, 640, 480]
        val inputShape = longArrayOf(1, 3, 640, 480)
        val inputBuffer = ByteBuffer.allocateDirect(1 * 3 * 640 * 480 * 4).order(ByteOrder.nativeOrder())

        // Preprocessing: normalize and convert to CHW format
        // This is simplified - actual implementation should handle YUV to RGB conversion
        for (i in 0 until (640 * 480 * 3)) {
            inputBuffer.putFloat(0.0f) // Placeholder - implement actual preprocessing
        }

        inputBuffer.rewind()
        return OnnxTensor.createTensor(ortEnv!!, inputBuffer, inputShape)
    }

    private fun postprocessResults(outputs: Map<String, OnnxValue>, width: Int, height: Int): List<Map<String, Any>> {
        val results = mutableListOf<Map<String, Any>>()
        
        // Extract output tensor
        val outputTensor = outputs[outputName] as OnnxTensor
        val outputArray = outputTensor.floatBuffer.array()

        // YOLO output format: [batch, num_detections, 6] where 6 = [x, y, w, h, conf, class]
        // Parse detections
        val numDetections = outputArray.size / 6
        
        for (i in 0 until numDetections) {
            val offset = i * 6
            val x = outputArray[offset]
            val y = outputArray[offset + 1]
            val w = outputArray[offset + 2]
            val h = outputArray[offset + 3]
            val conf = outputArray[offset + 4]
            val cls = outputArray[offset + 5].toInt()

            // Filter by confidence threshold
            if (conf > 0.6) {
                val label = if (cls == 1) "real" else "fake"
                
                // Convert normalized coordinates to pixel coordinates
                val xPixel = (x * width).toInt()
                val yPixel = (y * height).toInt()
                val wPixel = (w * width).toInt()
                val hPixel = (h * height).toInt()

                results.add(mapOf(
                    "label" to label,
                    "confidence" to conf.toDouble(),
                    "x" to xPixel,
                    "y" to yPixel,
                    "w" to wPixel,
                    "h" to hPixel
                ))
            }
        }

        return results
    }
}
