import * as StellarSdk from '@stellar/stellar-sdk';

export interface StellarValidationResult {
  isValid: boolean;
  errors: string[];
  accountExists?: boolean;
  accountBalance?: string;
}

export class StellarValidator {
  static validateSecretKey(secretKey: string): { isValid: boolean; error?: string; publicKey?: string } {
    try {
      if (!secretKey) {
        return { isValid: false, error: 'Secret key is required' };
      }

      if (!secretKey.startsWith('S')) {
        return { isValid: false, error: 'Secret key must start with "S"' };
      }

      const keypair = StellarSdk.Keypair.fromSecret(secretKey);
      return {
        isValid: true,
        publicKey: keypair.publicKey()
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid secret key format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async validateAccount(
    secretKey: string,
    horizonUrl: string
  ): Promise<StellarValidationResult> {
    const result: StellarValidationResult = {
      isValid: false,
      errors: []
    };

    // First validate the secret key
    const keyValidation = this.validateSecretKey(secretKey);
    if (!keyValidation.isValid) {
      result.errors.push(keyValidation.error!);
      return result;
    }

    try {
      const server = new StellarSdk.Horizon.Server(horizonUrl);
      const account = await server.loadAccount(keyValidation.publicKey!);

      // Get XLM balance
      const xlmBalance = account.balances.find(balance =>
        balance.asset_type === 'native'
      )?.balance || '0';

      result.isValid = true;
      result.accountExists = true;
      result.accountBalance = xlmBalance;

      // Check if account has sufficient balance for contract operations
      const minBalance = 10; // Minimum XLM for contract operations
      if (parseFloat(xlmBalance) < minBalance) {
        result.errors.push(
          `Account balance (${xlmBalance} XLM) is below recommended minimum (${minBalance} XLM) for contract operations`
        );
      }

    } catch (error) {
      result.accountExists = false;
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          result.errors.push(
            `Account ${keyValidation.publicKey} does not exist on the network. Please fund it first.`
          );
        } else {
          result.errors.push(`Failed to load account: ${error.message}`);
        }
      } else {
        result.errors.push('Unknown error while validating account');
      }
    }

    return result;
  }

  static validateNetworkConfiguration(
    network: string,
    horizonUrl: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate network parameter
    if (network && !['mainnet', 'testnet'].includes(network)) {
      errors.push('STELLAR_NETWORK must be either "mainnet" or "testnet"');
    }

    // Validate Horizon URL format
    try {
      new URL(horizonUrl);
    } catch {
      errors.push('Invalid STELLAR_HORIZON_URL format');
    }

    // Check network/URL consistency
    const isMainnetUrl = horizonUrl.includes('horizon.stellar.org');
    const isTestnetUrl = horizonUrl.includes('horizon-testnet.stellar.org');
    const isMainnetNetwork = network === 'mainnet';

    if (isMainnetNetwork && !isMainnetUrl && isTestnetUrl) {
      errors.push('Network set to mainnet but using testnet Horizon URL');
    } else if (!isMainnetNetwork && isMainnetUrl && !isTestnetUrl) {
      errors.push('Network set to testnet but using mainnet Horizon URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}