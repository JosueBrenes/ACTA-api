import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ACTA API',
      version: '1.0.0',
      description: 'Stellar blockchain API for creating and managing verifiable credentials using smart contracts',
      contact: {
        name: 'ACTA Team',
        url: 'https://github.com/your-org/acta-api',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://acta.up.railway.app'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        CreateCredentialRequest: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['name', 'degree', 'university'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Full name of the credential holder',
                  example: 'John Doe'
                },
                degree: {
                  type: 'string',
                  description: 'Degree or certification name',
                  example: 'Computer Science'
                },
                university: {
                  type: 'string',
                  description: 'Issuing institution',
                  example: 'Tech University'
                },
                description: {
                  type: 'string',
                  description: 'Additional description',
                  example: 'Bachelor of Science in Computer Science'
                },
                expiresAt: {
                  type: 'string',
                  format: 'date',
                  description: 'Expiration date',
                  example: '2025-12-31'
                }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                issuer: {
                  type: 'string',
                  description: 'Credential issuer',
                  example: 'Tech University'
                },
                subject: {
                  type: 'string',
                  description: 'Credential subject',
                  example: 'John Doe'
                },
                expirationDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Expiration date',
                  example: '2025-12-31'
                }
              }
            }
          }
        },
        CreateCredentialResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                contractId: {
                  type: 'string',
                  description: 'Stellar contract ID',
                  example: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                },
                transactionHash: {
                  type: 'string',
                  description: 'Stellar transaction hash',
                  example: 'abc123def456...'
                },
                ledgerSequence: {
                  type: 'number',
                  description: 'Ledger sequence number',
                  example: 12345
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation timestamp',
                  example: '2024-01-01T00:00:00.000Z'
                }
              }
            }
          }
        },
        GetCredentialResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                contractId: {
                  type: 'string',
                  description: 'Stellar contract ID',
                  example: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                },
                hash: {
                  type: 'string',
                  description: 'Credential data hash',
                  example: 'a1b2c3d4e5f6...'
                },
                status: {
                  type: 'string',
                  enum: ['Active', 'Revoked', 'Suspended'],
                  description: 'Credential status',
                  example: 'Active'
                }
              }
            }
          }
        },
        UpdateStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['Active', 'Revoked', 'Suspended'],
              description: 'New credential status',
              example: 'Revoked'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            },
            service: {
              type: 'string',
              example: 'Stellar Credential API'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Failed to create credential'
            },
            details: {
              type: 'string',
              description: 'Additional error details',
              example: 'Invalid data format'
            }
          }
        }
      }
    }
  },
  apis: ['./src/app/api/*.ts', './src/index.ts'], // paths to files containing OpenAPI definitions
};

export const specs = swaggerJSDoc(options);
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export { swaggerUi };