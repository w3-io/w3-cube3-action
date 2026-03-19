import { jest } from '@jest/globals'
import { readFileSync } from 'fs'
import { Cube3Client, Cube3Error } from '../src/cube3.js'

const fixtureResponse = JSON.parse(readFileSync(new URL('../__fixtures__/cube3-response.json', import.meta.url)))

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockOk(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  })
}

function mockError(status, body) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
  })
}

describe('Cube3Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('constructor requires api key', () => {
    expect(() => new Cube3Client({})).toThrow('API key is required')
  })

  test('constructor strips trailing slash from base URL', () => {
    const client = new Cube3Client({ apiKey: 'test', baseUrl: 'https://example.com/' })
    expect(client.baseUrl).toBe('https://example.com')
  })

  describe('inspect', () => {
    const client = new Cube3Client({ apiKey: 'test-key' })

    test('fetches and formats inspection data', async () => {
      mockOk(fixtureResponse)

      const result = await client.inspect('0x1234567890abcdef1234567890abcdef12345678')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://validation-api.cube3.ai/api/v2/inspector/addresses/0x1234567890abcdef1234567890abcdef12345678',
        {
          method: 'GET',
          headers: {
            'X-Api-Key': 'test-key',
            Accept: 'application/json',
          },
        },
      )

      expect(result.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(result.chains).toHaveLength(2)
      expect(result.chains[0].chainId).toBe('1')
      expect(result.chains[0].scores.fraud).toBe(15)
      expect(result.chains[0].scores.combined).toBe(12)
      expect(result.chains[1].chainId).toBe('137')
      expect(result.chains[1].scores.fraud).toBe(72)
    })

    test('filters by chain ID', async () => {
      mockOk(fixtureResponse)

      const result = await client.inspect('0x1234567890abcdef1234567890abcdef12345678', { chainId: '1' })

      expect(result.chains).toHaveLength(1)
      expect(result.chains[0].chainId).toBe('1')
    })

    test('includes score details', async () => {
      mockOk(fixtureResponse)

      const result = await client.inspect('0x1234567890abcdef1234567890abcdef12345678')

      expect(result.chains[0].details.length).toBeGreaterThan(0)
      expect(result.chains[0].details[0]).toHaveProperty('category')
      expect(result.chains[0].details[0]).toHaveProperty('value')
    })

    test('requires address', async () => {
      await expect(client.inspect('')).rejects.toThrow('Address is required')
    })

    test('throws on rate limit', async () => {
      mockError(429, 'Rate limit quota violation')

      await expect(client.inspect('0xabc')).rejects.toThrow('Rate limit exceeded')

      try {
        mockError(429, 'Rate limit quota violation')
        await client.inspect('0xabc')
      } catch (e) {
        expect(e).toBeInstanceOf(Cube3Error)
        expect(e.code).toBe('RATE_LIMIT')
      }
    })

    test('throws on API error', async () => {
      mockError(500, 'Internal Server Error')

      try {
        await client.inspect('0xabc')
      } catch (e) {
        expect(e).toBeInstanceOf(Cube3Error)
        expect(e.code).toBe('API_ERROR')
        expect(e.status).toBe(500)
      }
    })

    test('throws on invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'not json',
      })

      try {
        await client.inspect('0xabc')
      } catch (e) {
        expect(e).toBeInstanceOf(Cube3Error)
        expect(e.code).toBe('PARSE_ERROR')
      }
    })
  })
})
