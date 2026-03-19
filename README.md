# W3 Cube3 Action

GitHub Action for fraud detection and risk assessment of blockchain
addresses via the [Cube3](https://cube3.ai) Inspector API.

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
