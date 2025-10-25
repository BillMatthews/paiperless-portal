"use client";

import { useState, useEffect, useCallback } from "react";
import { AccountDetails, DealDetails, PromissoryNoteDetails } from "@/lib/types/deal-desk.types";
import { signPromissoryNote, getIssuedPromissoryNoteFileDataUrl, getIssuedPromissoryNoteFileAsBuffer } from "@/lib/actions/deal-desk.actions";
import { getDocumentSigningEventDetailsByDocumentId } from "@/lib/actions/document-signing.actions";
import { SigningEventDetailsDto, SigningPartyRole, DocumentSigningStatus } from "@/lib/types/document-signing.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Download, Wallet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { DocumentSigningService } from "@/lib/services/document-signing.service";
import { SUPPORTED_CHAIN_IDS } from "@/lib/constants";
import { BrowserProvider } from "ethers";

interface PromissoryNoteSignerProps {
  accountDetails: AccountDetails;
  dealDetails: DealDetails;
  processingDetails: {
    _id: string;
    dealId: string;
    promissoryNote: PromissoryNoteDetails;
  };
}

export function PromissoryNoteSigner({ 
  accountDetails, 
  dealDetails, 
  processingDetails 
}: PromissoryNoteSignerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSigning, setIsSigning] = useState(false);
  const [signingEventDetails, setSigningEventDetails] = useState<SigningEventDetailsDto | null>(null);
  const [isLoadingSigningDetails, setIsLoadingSigningDetails] = useState(true);
  
  // Blockchain data state
  const [documentStatus, setDocumentStatus] = useState<DocumentSigningStatus | null>(null);
  const [partySigningStatus, setPartySigningStatus] = useState<Record<string, boolean>>({});
  const [isLoadingBlockchainData, setIsLoadingBlockchainData] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Check if chain is supported by the wallet
  const isChainSupported = useCallback(() => {
    if (!signingEventDetails?.contractDetails.chainId) return false;
    const supportedChains = SUPPORTED_CHAIN_IDS; // Mainnet and Sepolia
    return supportedChains.includes(signingEventDetails.contractDetails.chainId);
  }, [signingEventDetails?.contractDetails.chainId]);

  // Check if network matches
  const isCorrectNetwork = useCallback(() => {
    if (!isConnected || !signingEventDetails || !chainId) return false;
    return chainId === signingEventDetails.contractDetails.chainId;
  }, [isConnected, signingEventDetails, chainId]);

  // Debug logging
  useEffect(() => {
    console.log('Wagmi state:', {
      address,
      isConnected,
      chainId,
      switchChain: !!switchChain,
      isSwitching,
      switchError
    });
    
    if (signingEventDetails?.contractDetails?.chainId) {
      console.log('Signing event chain details:', {
        expectedChainId: signingEventDetails.contractDetails.chainId,
        currentChainId: chainId,
        isCorrectNetwork: isCorrectNetwork(),
        isChainSupported: isChainSupported()
      });
    }
  }, [address, isConnected, chainId, switchChain, isSwitching, switchError, signingEventDetails, isCorrectNetwork, isChainSupported]);

  // Fetch blockchain data
  const fetchBlockchainData = useCallback(async () => {
    if (!signingEventDetails?.contractDetails) {
      console.log('No contract details available');
      return;
    }

    try {
      setIsLoadingBlockchainData(true);
      const { rpcUrl, contractAddress, documentId } = signingEventDetails.contractDetails;
      
      console.log('Fetching blockchain data with:', { rpcUrl, contractAddress, documentId });
      
      const signingService = new DocumentSigningService(rpcUrl, contractAddress);
      
      // Fetch document status
      const status = await signingService.getDocumentStatus(documentId);
      console.log('Document status from service:', status, 'Type:', typeof status);
      setDocumentStatus(status);
      
      // Fetch signing status for each party
      const partyStatus: Record<string, boolean> = {};
      for (const party of signingEventDetails.parties) {
        const hasSigned = await signingService.hasUserSigned(documentId, party.walletAddress);
        partyStatus[party.walletAddress] = hasSigned;
      }
      setPartySigningStatus(partyStatus);
      
      console.log('Blockchain data fetched:', { status, partyStatus });
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blockchain signing status",
      });
    } finally {
      setIsLoadingBlockchainData(false);
    }
  }, [signingEventDetails, toast]);

  // Fetch signing event details when component mounts
  useEffect(() => {
    const fetchSigningEventDetails = async () => {
      try {
        setIsLoadingSigningDetails(true);
        // Use the documentId from the promissory note as the signing event ID
        const details = await getDocumentSigningEventDetailsByDocumentId(processingDetails.promissoryNote.documentId);
        setSigningEventDetails(details);
      } catch (error) {
        console.error('Error fetching signing event details:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load signing event details",
        });
      } finally {
        setIsLoadingSigningDetails(false);
      }
    };

    if (processingDetails.promissoryNote?.documentId) {
      fetchSigningEventDetails();
    }
  }, [processingDetails.promissoryNote?.documentId, toast]);

  // Fetch blockchain data when signing event details are loaded
  useEffect(() => {
    if (signingEventDetails) {
      fetchBlockchainData();
    }
  }, [signingEventDetails, fetchBlockchainData]);

  // Connect wallet
  const handleConnectWallet = () => {
    connect({
      connector: injected(),
    });
  };

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Wallet disconnected",
    });
  };


  // Add chain to wallet
  const addChainToWallet = async () => {
    if (!signingEventDetails?.contractDetails.chainId) return;

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No wallet detected",
        });
        return;
      }

      // Define chain parameters based on chain ID
      const chainParams = getChainParams(signingEventDetails.contractDetails.chainId);
      if (!chainParams) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Chain ${signingEventDetails.contractDetails.chainId} is not supported`,
        });
        return;
      }

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [chainParams],
      });

      toast({
        title: "Success",
        description: `Chain ${chainParams.chainName} added to wallet`,
      });
    } catch (error) {
      console.error('Error adding chain:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add chain to wallet. Please add it manually.",
      });
    }
  };

  // Get chain parameters for adding to wallet
  const getChainParams = (chainId: number) => {
    switch (chainId) {
      case 1: // Mainnet
        return {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://ethereum.publicnode.com'],
          blockExplorerUrls: ['https://etherscan.io'],
        };
      case 11155111: // Sepolia
        return {
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18,
          },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        };
      case 31337: // Hardhat
        return {
          chainId: '0x7a69',
          chainName: 'Hardhat',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['http://127.0.0.1:8545'],
          blockExplorerUrls: [],
        };
      default:
        return null;
    }
  };

  // Switch network
  const handleSwitchNetwork = async () => {
    if (!signingEventDetails?.contractDetails.chainId) {
      console.log('No chain ID available');
      return;
    }
    
    if (!switchChain) {
      console.log('switchChain function not available');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network switching not supported by this wallet",
      });
      return;
    }

    try {
      console.log('Attempting to switch to chain:', signingEventDetails.contractDetails.chainId);
      await switchChain({ chainId: signingEventDetails.contractDetails.chainId });
      
      toast({
        title: "Success",
        description: `Switched to chain ${signingEventDetails.contractDetails.chainId}`,
      });
    } catch (error: any) {
      console.error('Error switching network:', error);
      console.log('Error details:', {
        code: error?.code,
        message: error?.message,
        name: error?.name
      });
      
      // Check if the error indicates the chain is not configured
      if (error?.code === 4902 || 
          error?.message?.includes('Unrecognized chain ID') ||
          error?.message?.includes('not configured') ||
          error?.message?.includes('not found')) {
        console.log('Chain not configured error detected');
        toast({
          variant: "destructive",
          title: "Chain Not Configured",
          description: `Chain ${signingEventDetails.contractDetails.chainId} is not configured in your wallet. Click "Add Chain" to add it.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to switch network. Please try switching manually in your wallet.",
        });
      }
    }
  };

  // Check if connected wallet can sign as ISSUER
  const canSignAsIssuer = () => {
    if (!isConnected || !signingEventDetails || !address) return false;
    
    const issuerParty = signingEventDetails.parties.find(party => party.role === SigningPartyRole.ISSUER);
    if (!issuerParty) return false;
    
    return address.toLowerCase() === issuerParty.walletAddress.toLowerCase();
  };

  // Sign document as ISSUER
  const signDocumentAsIssuer = async () => {
    if (!canSignAsIssuer() || !isCorrectNetwork() || !signingEventDetails) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot sign document. Please ensure you're connected with the correct wallet and network.",
      });
      return;
    }

    try {
      setIsSigning(true);
      
      // Download the promissory note file as buffer
      const { buffer, contentType, error } = await getIssuedPromissoryNoteFileAsBuffer(processingDetails.dealId);
      if (error || !buffer) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Failed to get document file",
        });
        return;
      }

      // Create DocumentSigningService instance
      const { rpcUrl, contractAddress, documentId } = signingEventDetails.contractDetails;
      const signingService = new DocumentSigningService(rpcUrl, contractAddress);

      // Get the signer from the connected wallet
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Sign the document
      const transactionHash = await signingService.signDocument(signer, buffer, documentId);
      
      console.log('Document signed successfully. Transaction hash:', transactionHash);
      
      toast({
        title: "Success",
        description: "Document signed successfully as ISSUER",
      });
      
      // Refresh the page to get updated signing status
      router.refresh();
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign document",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleSign = async (party: 'lender' | 'borrower') => {
    try {
      setIsSigning(true);
      const signedBy = party === 'lender' ? 'John Smith' : accountDetails.accountName;
      await signPromissoryNote(dealDetails.id, party, signedBy);
      toast({
        title: "Success",
        description: "Promissory note signed successfully",
      });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign promissory note",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { data, contentType, error } = await getIssuedPromissoryNoteFileDataUrl(processingDetails._id);
      if (error || !data || !contentType) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Failed to download promissory note",
        });
        return;
      }
      
      // Create a blob from the array buffer
      const blob = new Blob([new Uint8Array(data)], { type: contentType });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promissory-note-${processingDetails.dealId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download promissory note",
      });
    }
  };

  const formData = processingDetails.promissoryNote.content;

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Signing Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Signing Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSigningDetails ? (
              <div className="text-center py-4">
                <Clock className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading signing details...</p>
              </div>
            ) : signingEventDetails ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{signingEventDetails.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(signingEventDetails.createdAt), "PPp")}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Expires</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(signingEventDetails.expiryDate), "PPp")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Document Status</h4>
                  {isLoadingBlockchainData ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading blockchain status...</span>
                    </div>
                  ) : documentStatus !== null ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          documentStatus === DocumentSigningStatus.SIGNED ? "default" :
                          documentStatus === DocumentSigningStatus.EXPIRED ? "destructive" :
                          documentStatus === DocumentSigningStatus.REVOKED ? "destructive" :
                          "secondary"
                        }
                      >
                        {documentStatus}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchBlockchainData}
                        disabled={isLoadingBlockchainData}
                      >
                        {isLoadingBlockchainData ? "Refreshing..." : "Refresh"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No blockchain data available (documentStatus: {String(documentStatus)})
                    </div>
                  )}
                  
                </div>

                {/* Wallet Connection Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Connect the Issuer Wallet to sign this document on behalf of Paperless</h4>
                  
                  {documentStatus !== DocumentSigningStatus.IN_PROGRESS ? (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        Document signing is not available. Current status: {documentStatus}
                      </span>
                    </div>
                  ) : (() => {
                    // Check if ISSUER has already signed
                    const issuerParty = signingEventDetails.parties.find(party => party.role === SigningPartyRole.ISSUER);
                    const issuerHasSigned = issuerParty ? partySigningStatus[issuerParty.walletAddress] : false;
                    
                    if (issuerHasSigned) {
                      return (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-sm">
                            Document has been signed by the ISSUER. No further action required.
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {!isConnected ? (
                          <Button
                            onClick={handleConnectWallet}
                            disabled={isConnecting}
                            className="flex items-center gap-2"
                          >
                            <Wallet className="h-4 w-4" />
                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Connected</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {address?.slice(0, 6)}...{address?.slice(-4)}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnectWallet}
                              >
                                Disconnect
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Network:</span>
                              <Badge variant={isCorrectNetwork() ? "default" : "destructive"}>
                                Chain ID: {chainId}
                              </Badge>
                              {signingEventDetails?.contractDetails?.chainId && (
                                <span className="text-xs text-muted-foreground">
                                  (Expected: {signingEventDetails.contractDetails.chainId})
                                </span>
                              )}
                              {!isCorrectNetwork() && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSwitchNetwork}
                                    disabled={isSwitching}
                                  >
                                    {isSwitching ? "Switching..." : `Switch to Chain ${signingEventDetails.contractDetails.chainId}`}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addChainToWallet}
                                  >
                                    Add Chain
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* ISSUER Signing Section */}
                            {canSignAsIssuer() && isCorrectNetwork() ? (
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">Ready to sign as ISSUER</span>
                                <Button
                                  onClick={signDocumentAsIssuer}
                                  disabled={isSigning}
                                  size="sm"
                                >
                                  {isSigning ? "Signing..." : "Sign on behalf of PAPERLESS"}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">
                                  {!canSignAsIssuer() 
                                    ? "Connected wallet is not authorized to sign as on behalf of PAPERLESS"
                                    : "Please switch to the correct network to sign"
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

           

                <div>
                  <h4 className="font-medium mb-2">Required Signers</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signingEventDetails.parties.map((party, index) => {
                        const hasSigned = partySigningStatus[party.walletAddress];
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {party.role}
                            </TableCell>
                            <TableCell>
                              {party.name || 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {party.walletAddress}
                            </TableCell>
                            <TableCell>
                              {isLoadingBlockchainData ? (
                                <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : hasSigned !== undefined ? (
                                <div className="flex items-center gap-2">
                                  {hasSigned ? (
                                    <>
                                      <Check className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-green-600">Signed</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">Awaiting Signature</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unknown</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No signing event details available</p>
              </div>
            )}
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Promissory Note Details</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Note
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Borrower</h4>
                  <div className="text-sm space-y-1">
                    <p>{formData.borrower?.name}</p>
                    <p className="whitespace-pre-line text-muted-foreground">{formData.borrower?.address}</p>
                    <p className="text-muted-foreground">Country: {formData.borrower?.country}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Lender</h4>
                  <div className="text-sm space-y-1">
                    <p>{formData.lender?.name}</p>
                    <p className="whitespace-pre-line text-muted-foreground">{formData.lender?.address}</p>
                    <p className="text-muted-foreground">Country: {formData.lender?.country}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Loan Details</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: formData.loanDetails.amount.currency || 'USD'
                    }).format(formData.loanDetails.amount.value || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{formData.loanDetails.interestRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {format(new Date(formData.issueDate || ''), 'PP')} to{' '}
                    {format(new Date(formData.maturityDate || ''), 'PP')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Payment Terms</h4>
                <p className="text-sm whitespace-pre-line">{formData.loanDetails.paymentTerms}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Special Conditions</h4>
                <p className="text-sm whitespace-pre-line">{formData.specialConditions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 