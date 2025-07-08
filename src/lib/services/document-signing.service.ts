import {ethers, getDefaultProvider, keccak256, getBytes, solidityPackedKeccak256} from "ethers";

import {DocumentSigningStatus} from "@/lib/types/document-signing.types";


// ABI for the DocumentSigningRegistry contract
const DOCUMENT_SIGNING_ABI = [
    // Document creation
    'function createDocument(bytes32 documentHash, address[] memory signers, uint256 expirationDays) public returns (bytes32)',

    // Document signing
    'function signDocument(bytes32 documentId, bytes memory signature) public',

    // Document status checking
    'function getDocumentStatus(bytes32 documentId) public view returns (uint8)',

    // Document details
    'function getDocumentDetails(bytes32 documentId) public view returns (bytes32, address, uint8, uint256, uint256)',

    // Document signers
    'function getRequiredSigners(bytes32 documentId) public view returns (address[])',

    // Check if signed
    'function hasUserSigned(bytes32 documentId, address signer) public view returns (bool)',

    // Events
    'event DocumentCreated(bytes32 indexed documentId, address indexed initiator)',
    'event DocumentSigned(bytes32 indexed documentId, address indexed signer, uint256 timestamp)',
    'event SigningCompleted(bytes32 indexed documentId, uint256 timestamp)',
];

export class DocumentSigningService {
    private readonly rpcUrl: string;
    private readonly contractAddress: string;
    private contract: ethers.Contract;
    private readonly provider: ethers.Provider

    constructor(rpcUrl: string, contractAddress: string) {
        this.rpcUrl = rpcUrl;
        this.contractAddress = contractAddress
        this.provider = getDefaultProvider(this.rpcUrl);
        this.contract = new ethers.Contract(this.contractAddress, DOCUMENT_SIGNING_ABI, this.provider);
    }

    /**
     * Gets the current status of a document
     * @param documentId The ID of the document to check
     * @returns The status as a number (0=Pending, 1=Completed, 2=Expired, 3=Revoked)
     */
    async getDocumentStatus(documentId: string): Promise<DocumentSigningStatus> {
        const status = await this.contract.getDocumentStatus(documentId);
        
        // Convert BigInt to number if needed
        const statusNumber = typeof status === 'bigint' ? Number(status) : status;
        
        switch (statusNumber) {
            case 0:
                return DocumentSigningStatus.IN_PROGRESS;
            case 1:
                return DocumentSigningStatus.SIGNED;
            case 2:
                return DocumentSigningStatus.EXPIRED;
            case 3:
                return DocumentSigningStatus.REVOKED;
            default:
                return DocumentSigningStatus.UNKNOWN;
        }
    }

    /**
     * Checks if a specific user has signed a document
     * @param documentId The ID of the document to check
     * @param signerAddress The address of the signer to check
     * @returns True if the user has signed, false otherwise
     */
    async hasUserSigned(
        documentId: string,
        signerAddress: string,
    ): Promise<boolean> {
        return await this.contract.hasUserSigned(documentId, signerAddress);
    }

    /**
     * Gets all required signers for a document
     * @param documentId The ID of the document
     * @returns Array of Ethereum addresses that need to sign
     */
    async getRequiredSigners(documentId: string): Promise<string[]> {
        return await this.contract.getRequiredSigners(documentId);
    }

    /**
     * 
     * @param signer the signger for the wallet signing the document
     * @param documentBuffer the buffer of the document to sign
     * @param signedDocumentId the id of the document to sign
     * @returns the transaction hash of the signed document
     */
    async signDocument(signer: ethers.Signer, documentBuffer: Buffer, signedDocumentId: string): Promise<string> {
    // Calculate hash of the document to verify we're signing the right thing
        const documentHash = keccak256(documentBuffer);

        // Get document details to verify
        const details = await this.contract.getDocumentDetails(signedDocumentId);
        const storedHash = details[0]; // First return value is the document hash

        // Verify document hash matches
        if (storedHash !== documentHash) {
            throw new Error('Document hash mismatch - cannot sign different document');
        }

        // Create the signature of the document hash
        // This proves the signer approved this specific document
        const signerAddress = await signer.getAddress();
        const messageHash = getBytes(
            solidityPackedKeccak256(
                ['bytes32', 'address', 'string'],
                [documentHash, signerAddress, 'DocSign'] // Include context to prevent replay attacks
            )
        );

        // Sign the message hash
        const signature = await signer.signMessage(messageHash);

        // Submit the signature to the contract
        const tx = await this.contract.signDocument(signedDocumentId, signature);

        // Wait for transaction to be mined
        return await tx.wait();

    }
}