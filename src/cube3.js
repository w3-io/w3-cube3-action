/**
 * Cube3 API client.
 *
 * Wraps the Cube3 Inspector API for blockchain address risk assessment.
 * Designed for reuse — import this module directly if building a custom action.
 */

const DEFAULT_BASE_URL = 'https://validation-api.cube3.ai'

export class Cube3Error extends Error {
  constructor(message, { status, body, code } = {}) {
    super(message)
    this.name = 'Cube3Error'
    this.status = status
    this.body = body
    this.code = code
  }
}

export class Cube3Client {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL }) {
    if (!apiKey) throw new Cube3Error('API key is required', { code: 'MISSING_API_KEY' })
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  /**
   * Inspect an address for fraud and risk indicators.
   *
   * @param {string} address - Blockchain address to inspect
   * @param {object} [options]
   * @param {string} [options.chainId] - Filter results to a specific chain ID
   * @returns {object} Full inspection result with per-chain risk scores
   */
  async inspect(address, { chainId } = {}) {
    if (!address) throw new Cube3Error('Address is required', { code: 'MISSING_ADDRESS' })

    const url = `${this.baseUrl}/api/v2/inspector/addresses/${encodeURIComponent(address)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': this.apiKey,
        Accept: 'application/json',
      },
    })

    const body = await response.text()

    if (response.status === 429 || body.includes('Rate limit')) {
      throw new Cube3Error('Rate limit exceeded', {
        status: 429,
        body,
        code: 'RATE_LIMIT',
      })
    }

    if (!response.ok) {
      throw new Cube3Error(`Cube3 API error: ${response.status}`, {
        status: response.status,
        body,
        code: 'API_ERROR',
      })
    }

    let data
    try {
      data = JSON.parse(body)
    } catch {
      throw new Cube3Error('Invalid JSON response from Cube3', {
        status: response.status,
        body,
        code: 'PARSE_ERROR',
      })
    }

    return this.formatResult(data, { chainId })
  }

  /**
   * Format raw API response into a structured result.
   * Filters to a specific chain if chainId is provided.
   */
  formatResult(data, { chainId } = {}) {
    const result = {
      address: data.address,
      chains: [],
    }

    const chains = data.chain_result_list || []
    for (const chain of chains) {
      if (chainId && chain.chain_id !== chainId) continue

      result.chains.push({
        chainId: chain.chain_id,
        type: chain.type,
        deployer: chain.deployer || null,
        deployedAt: chain.deployed_at_by_chain_id || null,
        firstAnalyzedAt: chain.first_analysed_at_by_chain_id || null,
        lastAnalyzedAt: chain.last_analysed_at_by_chain_id || null,
        scores: {
          fraud: chain.score?.fraud?.value ?? null,
          compliance: chain.score?.compliance?.value ?? null,
          cyber: chain.score?.cyber?.value ?? null,
          combined: chain.score?.combined_score?.value ?? null,
        },
        details: this.formatScoreDetails(chain.score_details),
      })
    }

    return result
  }

  formatScoreDetails(details) {
    if (!details) return []

    const flatten = (node, path = []) => {
      const items = []
      if (node.value != null) {
        items.push({
          category: path.join(' > ') || 'root',
          value: node.value,
          subCategory: node.sub_category || null,
          description: node.sub_category_description || null,
        })
      }
      for (const [key, child] of Object.entries(node)) {
        if (typeof child === 'object' && child !== null && key !== 'value') {
          items.push(...flatten(child, [...path, key]))
        }
      }
      return items
    }

    return flatten(details)
  }
}
