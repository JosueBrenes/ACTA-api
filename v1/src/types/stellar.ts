export interface CredentialRequest {
  data: any;
  metadata?: {
    issuer?: string;
    subject?: string;
    expirationDate?: string;
    [key: string]: any;
  };
}

export interface CredentialResponse {
  contractId: string;
  hash: string;
  status: CredentialStatus;
  transactionHash: string;
  ledgerSequence: number;
  createdAt: Date;
}

export enum CredentialStatus {
  ACTIVE = 'Active',
  REVOKED = 'Revoked',
  SUSPENDED = 'Suspended'
}

export interface StellarConfig {
  networkPassphrase: string;
  horizonUrl: string;
  secretKey: string;
}

export interface ContractDeploymentResult {
  contractId: string;
  transactionHash: string;
  ledgerSequence: number;
}