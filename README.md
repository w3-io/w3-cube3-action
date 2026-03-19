# W3 Cube3 Action

GitHub Action for fraud detection and risk assessment of blockchain
addresses via the [Cube3](https://cube3.ai) Inspector API.

## About Cube3

[Cube3](https://cube3.ai) (CUBE AI) is a conversational crime
intelligence platform for blockchain. It maps fraud networks across
institutions and borders, detecting mule accounts 45-87 days before
traditional bank systems and catching 75% of threats that banks miss.

The Inspector API scores addresses across fraud, compliance, cyber
risk, and combined risk dimensions. Cube3 is GDPR, ISO 27001, and
SOC 2 certified.

**Why use it:** Automated pre-transaction risk screening in
workflows. Check any address before interacting with it.

## Usage

```yaml
- name: Check address risk
  uses: w3-io/w3-cube3-action@v1
  with:
    command: inspect
    api-key: ${{ secrets.CUBE3_API_KEY }}
    address: "0x1234...abcd"
```

## Inputs

| Name       | Required | Description                          |
|------------|----------|--------------------------------------|
| `command`  | yes      | Operation to perform (`inspect`)     |
| `api-key`  | yes      | Cube3 API key                        |
| `address`  | no       | Blockchain address to inspect        |
| `chain-id` | no       | Chain ID to filter results           |
| `api-url`  | no       | Override Cube3 API base URL          |

## Outputs

| Name     | Description                  |
|----------|------------------------------|
| `result` | JSON result of the operation |

## Documentation

See [docs/guide.md](docs/guide.md) for the full reference, including
command details, output schemas, and workflow examples.

## License

Private
