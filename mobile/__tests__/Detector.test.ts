/**
 * Mobile detector tests
 */
import { detector } from '../src/inference/Detector'
import { yoloBridge } from '../src/inference/NativeBridge'

jest.mock('../src/inference/NativeBridge')

describe('Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize detector', async () => {
    ;(yoloBridge.initModel as jest.Mock).mockResolvedValue(true)

    const result = await detector.initialize()

    expect(result).toBe(true)
    expect(yoloBridge.initModel).toHaveBeenCalledTimes(1)
  })

  it('should detect faces', async () => {
    const mockResult = {
      faces: [
        {
          label: 'real' as const,
          confidence: 0.95,
          bbox: { x: 10, y: 20, w: 100, h: 150 }
        }
      ],
      latency_ms: 50
    }

    ;(yoloBridge.runInference as jest.Mock).mockResolvedValue(mockResult)

    await detector.initialize()
    const result = await detector.detect({} as any)

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('real')
  })

  it('should throttle inference calls', async () => {
    ;(yoloBridge.runInference as jest.Mock).mockResolvedValue({ faces: [] })

    await detector.initialize()
    
    const frame = {} as any
    await detector.detect(frame)
    await detector.detect(frame) // Should be throttled

    // Should only call once due to throttling
    expect(yoloBridge.runInference).toHaveBeenCalledTimes(1)
  })
})
