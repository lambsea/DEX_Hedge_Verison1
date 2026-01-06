
// Expanded Lighter Map based on typical ID ordering. 
// In a production app, we would query the API for this map if available.
export const LIGHTER_STATIC_MAP: Record<number, string> = {
  0: 'BTCUSDT',
  1: 'ETHUSDT',
  2: 'XPLUSDT',
  3: 'SOLUSDT',
  4: 'MATICUSDT',
  5: 'AVAXUSDT',
  6: 'ARBUSDT',
  7: 'OPUSDT',
  8: 'BNBUSDT',
  9: 'LINKUSDT',
  // Add placeholders for discovery
};

export const REFRESH_INTERVAL = 30000; // 30 seconds
export const ARB_THRESHOLD = 0.005; // 0.005% minimum spread to show

// Network Configuration for Arbitrum One
export const ARBITRUM_CHAIN_ID = 42161;
export const ARBITRUM_CHAIN_ID_HEX = '0xa4b1'; // Hex for 42161

export const ARBITRUM_NETWORK_PARAMS = {
  chainId: ARBITRUM_CHAIN_ID_HEX,
  chainName: 'Arbitrum One',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://arbiscan.io/'],
};
