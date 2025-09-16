import { Router, Request, Response } from 'express';
import { StellarService } from '../../services/stellarService';
import { CredentialRequest, CredentialStatus } from '../../types/stellar';

const router = Router();

// Initialize StellarService lazily to ensure environment variables are loaded
let stellarService: StellarService;

function getStellarService(): StellarService {
  if (!stellarService) {
    // Validate required environment variables
    const secretKey = process.env.STELLAR_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STELLAR_SECRET_KEY environment variable is required');
    }

    // Validate secret key format
    try {
      const keypair = require('@stellar/stellar-sdk').Keypair.fromSecret(secretKey);
      console.log('✅ Using Stellar account:', keypair.publicKey());
    } catch (keyError) {
      throw new Error('Invalid STELLAR_SECRET_KEY format. Must be a valid Stellar secret key starting with S');
    }

    const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
    const config = {
      networkPassphrase: isMainnet
        ? 'Public Global Stellar Network ; September 2015'
        : 'Test SDF Network ; September 2015',
      horizonUrl: process.env.STELLAR_HORIZON_URL ||
        (isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'),
      secretKey: secretKey
    };

    console.log(`🌐 Stellar Network: ${isMainnet ? 'Mainnet' : 'Testnet'}`);
    console.log(`🔗 Horizon URL: ${config.horizonUrl}`);

    stellarService = new StellarService(config);
  }
  return stellarService;
}

/**
 * @swagger
 * /v1/credentials:
 *   post:
 *     summary: Create a new credential
 *     description: Deploy a new credential smart contract to the Stellar blockchain
 *     tags: [Credentials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCredentialRequest'
 *     responses:
 *       201:
 *         description: Credential created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateCredentialResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const credentialRequest: CredentialRequest = req.body;

    if (!credentialRequest.data) {
      return res.status(400).json({
        error: 'Missing required field: data'
      });
    }

    const credential = await getStellarService().createCredential(credentialRequest);

    res.status(201).json({
      success: true,
      data: {
        contractId: credential.contractId,
        transactionHash: credential.transactionHash,
        ledgerSequence: credential.ledgerSequence,
        createdAt: credential.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating credential:', error);
    res.status(500).json({
      error: 'Failed to create credential',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/credentials/{contractId}:
 *   get:
 *     summary: Get credential information
 *     description: Retrieve credential information from the Stellar blockchain
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         description: Stellar contract ID of the credential
 *         schema:
 *           type: string
 *           example: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *     responses:
 *       200:
 *         description: Credential information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCredentialResponse'
 *       400:
 *         description: Bad request - missing contract ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({
        error: 'Contract ID is required'
      });
    }

    const credentialInfo = await getStellarService().getCredentialInfo(contractId);

    res.json({
      success: true,
      data: {
        contractId,
        hash: credentialInfo.hash,
        status: credentialInfo.status
      }
    });

  } catch (error) {
    console.error('Error getting credential:', error);
    res.status(500).json({
      error: 'Failed to get credential',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /v1/credentials/{contractId}/status:
 *   patch:
 *     summary: Update credential status
 *     description: Update the status of a credential in the Stellar blockchain
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         description: Stellar contract ID of the credential
 *         schema:
 *           type: string
 *           example: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Credential status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Credential status updated successfully
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:contractId/status', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const { status } = req.body;

    if (!contractId) {
      return res.status(400).json({
        error: 'Contract ID is required'
      });
    }

    if (!status || !Object.values(CredentialStatus).includes(status)) {
      return res.status(400).json({
        error: 'Valid status is required',
        validStatuses: Object.values(CredentialStatus)
      });
    }

    await getStellarService().updateCredentialStatus(contractId, status as CredentialStatus);

    res.json({
      success: true,
      message: 'Credential status updated successfully'
    });

  } catch (error) {
    console.error('Error updating credential status:', error);
    res.status(500).json({
      error: 'Failed to update credential status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;