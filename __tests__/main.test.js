import { jest } from '@jest/globals'
import { readFileSync } from 'fs'

const fixtureResponse = JSON.parse(readFileSync(new URL('../__fixtures__/cube3-response.json', import.meta.url)))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock @actions/core
const mockCore = await import('../__fixtures__/core.js')
jest.unstable_mockModule('@actions/core', () => mockCore)

const { run } = await import('../src/main.js')

function mockOk(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  })
}

describe('run', () => {
  beforeEach(() => {
    mockCore.reset()
    mockFetch.mockReset()
  })

  test('inspect command returns full result', async () => {
    mockCore.setInputs({
      command: 'inspect',
      'api-key': 'test-key',
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    mockOk(fixtureResponse)

    await run()

    const outputs = mockCore.getOutputs()
    expect(outputs.result).toBeDefined()

    const result = JSON.parse(outputs.result)
    expect(result.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(result.chains).toHaveLength(2)
    expect(mockCore.getErrors()).toHaveLength(0)
  })

  test('inspect with chain-id filter', async () => {
    mockCore.setInputs({
      command: 'inspect',
      'api-key': 'test-key',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      'chain-id': '1',
    })
    mockOk(fixtureResponse)

    await run()

    const result = JSON.parse(mockCore.getOutputs().result)
    expect(result.chains).toHaveLength(1)
    expect(result.chains[0].chainId).toBe('1')
  })

  test('unknown command fails', async () => {
    mockCore.setInputs({
      command: 'bogus',
      'api-key': 'test-key',
    })

    await run()

    const errors = mockCore.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Unknown command')
    expect(errors[0]).toContain('bogus')
  })

  test('missing api-key fails', async () => {
    mockCore.setInputs({
      command: 'inspect',
      address: '0xabc',
    })

    await run()

    const errors = mockCore.getErrors()
    expect(errors).toHaveLength(1)
  })

  test('API error is reported as failure', async () => {
    mockCore.setInputs({
      command: 'inspect',
      'api-key': 'test-key',
      address: '0xabc',
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    await run()

    const errors = mockCore.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Cube3 error')
  })
})
