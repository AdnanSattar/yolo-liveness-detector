/**
 * Frontend API client tests
 */
import { predictImage, checkHealth } from '../lib/api'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('predictImage', () => {
    it('should successfully predict image', async () => {
      const mockResponse = {
        data: {
          faces: [
            {
              label: 'real',
              confidence: 0.95,
              bbox: { x: 10, y: 20, w: 100, h: 150 }
            }
          ],
          latency_ms: 18.5
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await predictImage(file)

      expect(result.faces).toHaveLength(1)
      expect(result.faces[0].label).toBe('real')
      expect(result.latency_ms).toBe(18.5)
    })

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          data: {
            error: 'Invalid image format',
            detail: 'Image must be JPEG or PNG'
          }
        }
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(predictImage(file)).rejects.toThrow('Invalid image format')
    })
  })

  describe('checkHealth', () => {
    it('should check API health', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          model_loaded: true,
          device: 'cuda',
          version: '1.0.0'
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await checkHealth()

      expect(result.model_loaded).toBe(true)
      expect(result.status).toBe('healthy')
    })
  })
})
