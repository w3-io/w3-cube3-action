import { Cube3Client } from '../src/cube3.js'

const API_KEY = process.env.CUBE3_API_KEY

const describeIf = (condition) => (condition ? describe : describe.skip)

describeIf(API_KEY)('Cube3 integration (live API)', () => {
  // Client instantiated inside the conditional block — only runs when API_KEY is set
  let client
  beforeAll(() => {
    client = new Cube3Client({ apiKey: API_KEY })
  })

  // Well-known Ethereum address (Vitalik's public address)
  const KNOWN_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

  test('inspect returns scores for a known address', async () => {
    const result = await client.inspect(KNOWN_ADDRESS)

    expect(result.address).toBeTruthy()
    expect(result.chains.length).toBeGreaterThan(0)

    const chain = result.chains[0]
    expect(chain.chainId).toBeTruthy()
    expect(chain.scores).toBeDefined()
    expect(typeof chain.scores.fraud).toBe('number')
    expect(typeof chain.scores.compliance).toBe('number')
    expect(typeof chain.scores.cyber).toBe('number')
    expect(typeof chain.scores.combined).toBe('number')
  })

  test('inspect with chain-id filter', async () => {
    const result = await client.inspect(KNOWN_ADDRESS, { chainId: '1' })

    expect(result.chains.length).toBeLessThanOrEqual(1)
    if (result.chains.length > 0) {
      expect(result.chains[0].chainId).toBe('1')
    }
  })
})
