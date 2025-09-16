# ACTA API v2

Stellar blockchain API for creating and managing verifiable credentials using smart contracts.

## Quick Start

```bash
cd API-v2/api
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and set your Stellar credentials:

```env
PORT=4000
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your_stellar_secret_key
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## API Endpoints

### `POST /api/credentials`
Create a new credential and deploy smart contract

```json
{
  "data": {
    "name": "John Doe",
    "degree": "Computer Science",
    "university": "Tech University"
  }
}
```

### `GET /api/credentials/:contractId`
Get credential information from blockchain

### `PATCH /api/credentials/:contractId/status`
Update credential status (`Active`, `Revoked`, `Suspended`)

### `GET /health`
API health check

## Features

- ✅ Automatic smart contract deployment
- ✅ Stellar blockchain integration
- ✅ Credential verification
- ✅ Status management
- ✅ CORS enabled