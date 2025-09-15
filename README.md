# Stellar Credential API v2

API para crear credenciales usando contratos inteligentes en Stellar. Cuando se crea una credencial, automáticamente se despliega un contrato en la red Stellar que contiene internamente el hash y status.

## Instalación

```bash
cd API-v2
npm install
```

## Configuración

1. Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita `.env` con tu configuración:
```env
PORT=3000
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your_stellar_secret_key_here
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Compilar el contrato Stellar

Antes de usar la API, debes compilar el contrato:

```bash
cd src/contracts
cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/credential_contract.wasm ./credential.wasm
```

## Ejecutar la API

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Endpoints

### POST /api/credentials
Crea una nueva credencial y despliega un contrato automáticamente.

**Request:**
```json
{
  "data": {
    "name": "Juan Pérez",
    "degree": "Ingeniero en Sistemas",
    "university": "Universidad XYZ"
  },
  "metadata": {
    "issuer": "Universidad XYZ",
    "subject": "Juan Pérez",
    "expirationDate": "2025-12-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "transactionHash": "abc123def456...",
    "ledgerSequence": 12345,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/credentials/:contractId
Obtiene información de una credencial desde el contrato.

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "hash": "a1b2c3d4e5f6...",
    "status": "Active"
  }
}
```

### PATCH /api/credentials/:contractId/status
Actualiza el status de una credencial en el contrato.

**Request:**
```json
{
  "status": "Revoked"
}
```

**Statuses válidos:**
- `Active`
- `Revoked`
- `Suspended`

### GET /health
Health check del servicio.

### GET /
Información general de la API y endpoints disponibles.

## Características principales

✅ **Contrato inteligente automático**: Se despliega automáticamente al crear credenciales
✅ **Hash y status internos**: El contrato contiene estos datos internamente, no como parámetros externos
✅ **Contract ID como respuesta**: Retorna el ID del contrato desplegado para futuras interacciones
✅ **Headers CORS completos**: Configurado para uso en aplicaciones web
✅ **Seguridad**: Headers de seguridad y validación de datos
✅ **Stellar SDK integrado**: Uso completo del SDK oficial de Stellar

## Estructura del proyecto

```
API-v2/
├── src/
│   ├── contracts/
│   │   ├── credential.rs      # Contrato Stellar
│   │   └── Cargo.toml
│   ├── services/
│   │   └── stellarService.ts  # Servicio de despliegue
│   ├── routes/
│   │   └── credentials.ts     # Endpoints API
│   ├── middleware/
│   │   └── cors.ts           # CORS y headers
│   ├── types/
│   │   └── stellar.ts        # Tipos TypeScript
│   └── index.ts              # App principal
├── package.json
├── tsconfig.json
└── .env.example
```

## Notas importantes

- El contrato se despliega automáticamente en cada creación de credencial
- El hash se genera automáticamente de los datos proporcionados
- El status inicial siempre es "Active"
- Se requiere una cuenta Stellar con fondos para las transacciones
- Para producción, cambiar a mainnet en las variables de entorno