import Foundation
import CoreML
import Vision
import React

@objc(YoloModule)
class YoloModule: NSObject {
    private var model: MLModel?
    private var isInitialized = false
    
    @objc
    func initModel(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let modelURL = Bundle.main.url(forResource: "anti_spoofing", withExtension: "mlmodelc") else {
            reject("MODEL_NOT_FOUND", "Model file not found in bundle", nil)
            return
        }
        
        do {
            model = try MLModel(contentsOf: modelURL)
            isInitialized = true
            resolve(true)
        } catch {
            reject("INIT_ERROR", "Failed to load model: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func runInference(_ frameData: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isInitialized, let model = model else {
            reject("NOT_INITIALIZED", "Model not initialized", nil)
            return
        }
        
        // Extract frame data
        guard let width = frameData["width"] as? Int,
              let height = frameData["height"] as? Int,
              let pixelBuffer = frameData["pixelBuffer"] as? CVPixelBuffer else {
            reject("INVALID_INPUT", "Invalid frame data", nil)
            return
        }
        
        // Create VNCoreMLRequest
        guard let visionModel = try? VNCoreMLModel(for: model) else {
            reject("VISION_ERROR", "Failed to create Vision model", nil)
            return
        }
        
        let request = VNCoreMLRequest(model: visionModel) { request, error in
            if let error = error {
                reject("INFERENCE_ERROR", "Inference failed: \(error.localizedDescription)", error)
                return
            }
            
            guard let observations = request.results as? [VNRecognizedObjectObservation] else {
                resolve(["faces": []])
                return
            }
            
            // Convert observations to React Native format
            var faces: [[String: Any]] = []
            
            for observation in observations {
                guard observation.confidence > 0.6 else { continue }
                
                let boundingBox = observation.boundingBox
                let x = Int(boundingBox.origin.x * CGFloat(width))
                let y = Int((1 - boundingBox.origin.y - boundingBox.height) * CGFloat(height))
                let w = Int(boundingBox.width * CGFloat(width))
                let h = Int(boundingBox.height * CGFloat(height))
                
                // Determine label from observation (simplified - adjust based on your model output)
                let label = observation.labels.first?.identifier == "1" ? "real" : "fake"
                let confidence = Double(observation.confidence)
                
                faces.append([
                    "label": label,
                    "confidence": confidence,
                    "bbox": [
                        "x": x,
                        "y": y,
                        "w": w,
                        "h": h
                    ]
                ])
            }
            
            resolve(["faces": faces])
        }
        
        // Perform request
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try handler.perform([request])
        } catch {
            reject("REQUEST_ERROR", "Failed to perform request: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func release(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        model = nil
        isInitialized = false
        resolve(true)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

@objc(YoloModule)
class YoloModuleBridge: NSObject {
    @objc
    static func moduleName() -> String {
        return "YoloModule"
    }
}
