/**
 * FastAPI client with Axios, error handling, and type safety
 */
import axios, { AxiosError } from 'axios'
import { PredictionResponse, HealthResponse, ApiError } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30s for model inference
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Server responded with error (this means server is reachable)
      const apiError = error.response.data
      throw new Error(apiError.detail || apiError.error || 'API request failed')
    } else if (error.request) {
      // Request made but no response - this is a real connection issue
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Request timed out. The server may be slow or overloaded.')
      }
      throw new Error('No response from server. Please check your connection.')
    } else {
      // Error setting up request (CORS, network config, etc.)
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

/**
 * Predict if faces in image are real or fake
 */
export async function predictImage(imageFile: File): Promise<PredictionResponse> {
  const formData = new FormData()
  formData.append('file', imageFile)

  try {
    const response = await apiClient.post<PredictionResponse>('/v1/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to predict image')
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiClient.get<HealthResponse>('/v1/health')
    return response.data
  } catch (error) {
    throw new Error('Health check failed')
  }
}

export default apiClient
