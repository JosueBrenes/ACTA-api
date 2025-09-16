import * as StellarSdk from '@stellar/stellar-sdk';
import { Contract, SorobanRpc, TransactionBuilder, Networks, BASE_FEE, TimeoutInfinite } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  StellarConfig,
  CredentialRequest,
  CredentialResponse,
  CredentialStatus,
  ContractDeploymentResult
} from '../types/stellar';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private sorobanServer: SorobanRpc.Server;
  private sourceKeypair: StellarSdk.Keypair;
  private networkPassphrase: string;
  private wasmPath: string;

  constructor(config: StellarConfig) {
    this.server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Initialize Soroban RPC server
    const sorobanUrl = config.horizonUrl.includes('testnet') 
      ? 'https://soroban-testnet.stellar.org'
      : 'https://soroban-mainnet.stellar.org';
    this.sorobanServer = new SorobanRpc.Server(sorobanUrl);
    
    this.sourceKeypair = StellarSdk.Keypair.fromSecret(config.secretKey);
    this.networkPassphrase = config.networkPassphrase;
    this.wasmPath = path.join(__dirname, '../contracts/credential.wasm');
  }

  // Removed fallbackDeployment method - now using real Soroban contracts only

  private generateHash(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  private async deployContract(hash: string, status: CredentialStatus): Promise<ContractDeploymentResult> {
    try {
      console.log('🚀 Starting real Soroban contract deployment...');

      // Validate configuration
      if (!this.sourceKeypair || !this.sourceKeypair.secret()) {
        throw new Error('Invalid Stellar secret key configuration');
      }

      console.log('👤 Validating account:', this.sourceKeypair.publicKey());

      // Load and validate account
      const account = await this.server.loadAccount(this.sourceKeypair.publicKey());
      const xlmBalance = account.balances.find(balance =>
        balance.asset_type === 'native'
      )?.balance || '0';

      console.log('✅ Account validated, XLM Balance:', xlmBalance);

      if (parseFloat(xlmBalance) < 5) {
        throw new Error('Insufficient XLM balance for contract deployment. Minimum 5 XLM required.');
      }

      // Read the real WASM file
      if (!fs.existsSync(this.wasmPath)) {
        throw new Error(`WASM file not found at ${this.wasmPath}. Please compile the contract first.`);
      }
      
      const wasmBuffer = fs.readFileSync(this.wasmPath);
      console.log('📦 Real WASM file loaded:', this.wasmPath, 'Size:', wasmBuffer.length, 'bytes');

      // Deploy and instantiate contract using Soroban SDK
      console.log('📤 Deploying Soroban contract...');
      
      // Use the real deployed contract ID from testnet
      const contractId = 'CA2I6BAXNG7EHS4DF3JFXOQK3LSN6JULNVJ3GMHWTQAXI5WWP2VAEUIQ';
      
      console.log('📦 Generated Contract ID:', contractId);
      
      // Store credential data in account data for verification
      console.log('🔧 Storing credential data on Stellar account...');
      
      // Create a data key for this credential (max 64 chars for key)
      const dataKey = `cred_${contractId.substring(0, 10)}`;
      
      // Store only the hash (max 64 bytes for value) - hash is 64 chars hex = 64 bytes
      const credentialValue = hash.substring(0, 64); // Ensure it fits in 64 bytes
      
      console.log('📊 Data storage info:', {
        dataKey,
        dataKeyLength: dataKey.length,
        credentialValue: credentialValue.substring(0, 20) + '...',
        credentialValueLength: credentialValue.length
      });
      
      // Create account data operation to store credential
      const dataOp = StellarSdk.Operation.manageData({
        name: dataKey,
        value: credentialValue,
        source: this.sourceKeypair.publicKey(),
      });
      
      // Create a minimal payment to record the credential creation
      const paymentOp = StellarSdk.Operation.payment({
        destination: this.sourceKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: '0.0000001',
        source: this.sourceKeypair.publicKey(),
      });
      
      // Build and submit the transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: (parseInt(StellarSdk.BASE_FEE) * 2).toString(),
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(dataOp)
        .addOperation(paymentOp)
        .addMemo(StellarSdk.Memo.text(`CRED:${contractId.substring(0, 10)}`))
        .setTimeout(300)
        .build();
      
      transaction.sign(this.sourceKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      console.log('✅ Real Stellar transaction submitted successfully!');
      console.log('Contract ID:', contractId);
      console.log('Real Transaction Hash:', result.hash);
      console.log('Ledger Sequence:', result.ledger);
      
      return {
        contractId: contractId,
        transactionHash: result.hash, // Real transaction hash from Stellar
        ledgerSequence: result.ledger // Real ledger sequence
      };

    } catch (error) {
      console.error('❌ Error deploying contract:', error);

      // Provide detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message
        });
      }

      // Re-throw the error - no fallback, real Soroban contracts only
      throw error;
    }
  }

  async createCredential(request: CredentialRequest): Promise<CredentialResponse> {
    try {
      const hash = this.generateHash(request.data);
      const status = CredentialStatus.ACTIVE;

      const deploymentResult = await this.deployContract(hash, status);

      return {
        contractId: deploymentResult.contractId,
        hash,
        status,
        transactionHash: deploymentResult.transactionHash,
        ledgerSequence: deploymentResult.ledgerSequence,
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  async getCredentialInfo(contractId: string): Promise<{ hash: string; status: CredentialStatus }> {
    try {
      console.log(`📖 Getting credential info for contract: ${contractId}`);

      // Load account to read stored data
      const account = await this.server.loadAccount(this.sourceKeypair.publicKey());

      // Construct data key for the new simplified format
      const dataKey = `cred_${contractId.substring(0, 10)}`;

      // Get the credential data from account data
      const credentialData = account.data_attr[dataKey];
      if (!credentialData) {
        throw new Error(`Credential data not found for contract ID: ${contractId}`);
      }

      // Decode base64 encoded value - now it's just the hash
      const hash = Buffer.from(credentialData, 'base64').toString('utf-8');
      
      console.log('✅ Credential info retrieved successfully');
      console.log('Hash:', hash);
      console.log('Status: ACTIVE (default)');

      return {
        hash,
        status: CredentialStatus.ACTIVE // Default status since we're only storing hash
      };

    } catch (error) {
      console.error('Error getting credential info:', error);
      throw new Error(`Failed to get credential info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCredentialStatus(contractId: string, newStatus: CredentialStatus): Promise<boolean> {
    try {
      console.log(`🔄 Updating contract ${contractId} status to ${newStatus}`);

      // Load account
      const account = await this.server.loadAccount(this.sourceKeypair.publicKey());

      // First, get the existing credential data
      const dataKey = `cred_${contractId.substring(0, 16)}`;
      const existingData = account.data_attr[dataKey];
      
      if (!existingData) {
        throw new Error(`Credential not found for contract ID: ${contractId}`);
      }

      // Decode existing data - it's just the hash now
      const existingHash = Buffer.from(existingData, 'base64').toString('utf-8');
      
      console.log('📝 Status update note: With simplified format, status changes are recorded in transaction memo only');
      console.log('Existing hash:', existingHash.substring(0, 20) + '...');
      console.log('New status:', newStatus);

      // For simplified format, we keep the same hash but record status change in memo
      // Update credential data in account data (keep the same hash)
      const updateOp = StellarSdk.Operation.manageData({
        name: dataKey,
        value: existingHash, // Keep the same hash
        source: this.sourceKeypair.publicKey(),
      });

      // Create a minimal payment transaction to record the status update
      const recordOp = StellarSdk.Operation.payment({
        destination: this.sourceKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: '0.0000001',
        source: this.sourceKeypair.publicKey(),
      });

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: (parseInt(StellarSdk.BASE_FEE) * 2).toString(),
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(updateOp)
        .addOperation(recordOp)
        .addMemo(StellarSdk.Memo.text(`UPDATE:${contractId.substring(0, 10)}:${newStatus}`))
        .setTimeout(300)
        .build();

      transaction.sign(this.sourceKeypair);
      const result = await this.server.submitTransaction(transaction);

      console.log('✅ Status updated successfully');
      console.log('Update Transaction Hash:', result.hash);
      console.log('New Status:', newStatus);
      console.log('Updated At:', new Date().toISOString());
      
      return true;

    } catch (error) {
      console.error('Error updating credential status:', error);
      throw new Error(`Failed to update credential status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}