# Stellar Credential API Setup Guide

This guide will help you set up the Stellar Credential API for development and production use.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn**
3. **Rust** and **Cargo** (for building Soroban contracts)
4. **Stellar Account** (funded for testnet or mainnet)

## Stellar Account Setup

### For Testnet Development

1. **Generate a new keypair** using the Stellar Laboratory:
   - Go to https://laboratory.stellar.org/#account-creator
   - Click "Generate keypair"
   - Copy the **Secret Key** (starts with `S`)
   - Copy the **Public Key** (starts with `G`)

2. **Fund your testnet account**:
   - Go to https://laboratory.stellar.org/#account-creator
   - Paste your **Public Key** in the "Friendbot" section
   - Click "Get test network lumens"
   - Wait for confirmation

3. **Verify your account**:
   - Go to https://laboratory.stellar.org/#explorer
   - Select "Testnet"
   - Search for your public key
   - Confirm you have a balance > 10 XLM

### For Mainnet Production

1. **Use an existing funded account** or create one through:
   - Stellar wallets (Lobstr, StellarTerm, etc.)
   - Exchange withdrawal
   - Direct funding from another account

2. **Ensure sufficient balance**:
   - Minimum 10 XLM recommended for contract operations
   - Additional XLM for transaction fees

## Environment Configuration

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your configuration:
   ```env
   STELLAR_NETWORK=testnet
   STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   PORT=3000
   ```

3. **Environment Variables Explained**:
   - `STELLAR_NETWORK`: Set to "testnet" for development or "mainnet" for production
   - `STELLAR_SECRET_KEY`: Your Stellar account secret key (keep this secure!)
   - `STELLAR_HORIZON_URL`: Horizon server URL (optional, uses network default if empty)
   - `PORT`: API server port

## Smart Contract Setup

1. **Build the Soroban contract**:
   ```bash
   cd src/contracts
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Copy the built contract**:
   ```bash
   cp target/wasm32-unknown-unknown/release/credential.wasm ./credential.wasm
   ```

## Installation and Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Test the API**:
   ```bash
   curl http://localhost:3000/health
   ```

## API Usage Examples

### Create a Credential

```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "John Doe",
      "degree": "Bachelor of Science",
      "university": "Example University",
      "graduationDate": "2024-05-15"
    },
    "metadata": {
      "issuer": "Example University",
      "subject": "john.doe@example.com"
    }
  }'
```

### Get Credential Information

```bash
curl http://localhost:3000/api/credentials/CONTRACT_ID_HERE
```

### Update Credential Status

```bash
curl -X PATCH http://localhost:3000/api/credentials/CONTRACT_ID_HERE/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Revoked"}'
```

## Troubleshooting

### Common Issues

1. **"Account not found" error**:
   - Verify your account is funded
   - Check you're using the correct network (testnet vs mainnet)
   - Ensure the secret key is correct

2. **"Transaction failed" errors**:
   - Check account balance (need sufficient XLM for fees)
   - Verify contract WASM file is built correctly
   - Check network connectivity to Horizon

3. **"Invalid secret key" errors**:
   - Ensure secret key starts with 'S'
   - Verify no extra spaces or characters
   - Check the key is for the correct network

### Development Mode

If you encounter persistent issues with contract deployment, the API will automatically fall back to mock mode for development purposes. You'll see logs indicating "Falling back to mock deployment..."

### Network Status

Check Stellar network status at:
- Testnet: https://status.stellar.org/
- Mainnet: https://status.stellar.org/

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use different accounts** for development and production
3. **Regularly rotate secret keys** in production
4. **Monitor account activity** and balances
5. **Use HTTPS** in production environments

## Support

For issues related to:
- Stellar network: https://developers.stellar.org/
- Soroban contracts: https://soroban.stellar.org/
- This API: Check the application logs and error messages