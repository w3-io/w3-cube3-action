---
title: Cube3 Fraud Detection
category: integrations
actions: [inspect]
complexity: beginner
---

# Cube3 Fraud Detection

[Cube3](https://cube3.ai) is a crime intelligence platform that maps fraud networks across blockchain. Their Inspector API scores addresses across four risk dimensions — fraud, compliance, cyber, and combined — detecting mule accounts and high-risk addresses 45-87 days before traditional systems. GDPR, ISO 27001, and SOC 2 certified. Use this action to screen addresses before transactions, flag high-risk counterparties, or build compliance workflows.

Assess blockchain addresses for fraud, compliance, and cyber risk
using the Cube3 Inspector API.

## Quick start

```yaml
- name: Check address risk
  uses: w3-io/w3-cube3-action@v1
  with:
    command: inspect
    api-key: ${{ secrets.CUBE3_API_KEY }}
    address: "0x1234...abcd"
```

## Commands

### inspect

Returns per-chain risk scores for a blockchain address.

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `address` | yes | Blockchain address to inspect |
| `chain-id` | no | Filter to a specific chain (e.g. `"1"` for Ethereum) |

**Output (`result`):**

```json
{
  "address": "0x1234...abcd",
  "chains": [
    {
      "chainId": "1",
      "type": "eoa",
      "deployer": null,
      "scores": {
        "fraud": 15,
        "compliance": 5,
        "cyber": 10,
        "combined": 12
      },
      "details": [
        {
          "category": "fraud",
          "value": 15,
          "subCategory": "transaction_patterns",
          "description": "Analysis of transaction patterns"
        }
      ]
    }
  ]
}
```

## Using the result

```yaml
- name: Check address
  id: risk
  uses: w3-io/w3-cube3-action@v1
  with:
    command: inspect
    api-key: ${{ secrets.CUBE3_API_KEY }}
    address: ${{ steps.trigger.outputs.address }}

- name: Block if high risk
  if: fromJSON(steps.risk.outputs.result).chains[0].scores.fraud > 70
  run: echo "High fraud risk detected — blocking transaction"
```

## Beyond the API: on-chain protection

This action provides pre-transaction risk screening in workflows.
Cube3 also offers **on-chain smart contract protection** — runtime
transaction validation that can block malicious interactions before
they execute.

| Layer | What | When |
|-------|------|------|
| This action (off-chain) | Screen addresses before your workflow interacts with them | Workflow decision time |
| Cube3 on-chain SDK | Block malicious transactions at the smart contract level | Transaction execution time |

The action is ideal for workflow-level gatekeeping: check an address
before sending funds, flag risky counterparties in a pipeline, or
build compliance screening into automated processes. On-chain
protection adds a second layer at the contract level.

For on-chain integration, contact [Cube3](https://cube3.ai) about
their smart contract SDK.

## Authentication

Get an API key from [Cube3](https://cube3.ai). Store it as a secret
named `CUBE3_API_KEY` in your environment.

## Error handling

The action fails with a descriptive message on:
- Missing or invalid API key
- Rate limit exceeded (HTTP 429)
- API errors (5xx)
- Invalid response format
