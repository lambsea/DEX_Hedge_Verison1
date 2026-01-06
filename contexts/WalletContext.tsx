
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, ARBITRUM_NETWORK_PARAMS } from '../constants';

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  chainId: number | null;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Helper to switch network
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      // This error code 4902 means the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARBITRUM_NETWORK_PARAMS],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        const signerInstance = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);

        setProvider(browserProvider);
        setSigner(signerInstance);
        setAccount(accounts[0]);
        setChainId(currentChainId);
        
        console.log("Wallet connected:", accounts[0]);

        // Auto-switch to Arbitrum if on wrong chain
        if (currentChainId !== ARBITRUM_CHAIN_ID) {
           await switchNetwork();
           // Update provider/signer after switch might be needed depending on event flow,
           // but 'chainChanged' listener usually handles the reload/update.
        }

      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet to use this feature.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        // Ethers recommends reloading page on chain change to avoid state issues
        window.location.reload();
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ 
      account, 
      provider, 
      signer, 
      connectWallet, 
      disconnectWallet,
      isConnected: !!account,
      chainId,
      switchNetwork
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Add global type for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
