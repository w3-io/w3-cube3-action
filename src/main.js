import * as core from '@actions/core'
import { Cube3Client, Cube3Error } from './cube3.js'

const COMMANDS = {
  inspect: runInspect,
}

export async function run() {
  try {
    const command = core.getInput('command', { required: true })
    const handler = COMMANDS[command]

    if (!handler) {
      core.setFailed(`Unknown command: "${command}". Available: ${Object.keys(COMMANDS).join(', ')}`)
      return
    }

    const client = new Cube3Client({
      apiKey: core.getInput('api-key', { required: true }),
      baseUrl: core.getInput('api-url') || undefined,
    })

    const result = await handler(client)
    core.setOutput('result', JSON.stringify(result))

    writeSummary(command, result)
  } catch (error) {
    if (error instanceof Cube3Error) {
      core.setFailed(`Cube3 error (${error.code}): ${error.message}`)
    } else {
      core.setFailed(error.message)
    }
  }
}

async function runInspect(client) {
  const address = core.getInput('address', { required: true })
  const chainId = core.getInput('chain-id') || undefined

  return client.inspect(address, { chainId })
}

function writeSummary(command, result) {
  if (command !== 'inspect' || !result.chains?.length) return

  const rows = result.chains.map((chain) => [
    chain.chainId,
    chain.type || '-',
    scoreCell(chain.scores.fraud),
    scoreCell(chain.scores.compliance),
    scoreCell(chain.scores.cyber),
    scoreCell(chain.scores.combined),
  ])

  core.summary
    .addHeading('Cube3 Inspection', 3)
    .addRaw(`**Address:** \`${result.address}\`\n\n`)
    .addTable([
      [
        { data: 'Chain', header: true },
        { data: 'Type', header: true },
        { data: 'Fraud', header: true },
        { data: 'Compliance', header: true },
        { data: 'Cyber', header: true },
        { data: 'Combined', header: true },
      ],
      ...rows,
    ])
    .write()
}

function scoreCell(value) {
  if (value == null) return '-'
  return String(value)
}
