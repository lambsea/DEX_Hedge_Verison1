export interface FundingRate {
  symbol: string;
  rate: number; // Percentage (e.g., 0.01 for 0.01%)
  platform: 'Aster' | 'Lighter' | 'Variational' | 'Based';
  timestamp: number;
}

export interface MarketRateMap {
  [symbol: string]: {
    [platform: string]: number | null;
  };
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  longPlatform: string;
  shortPlatform: string;
  longRate: number;
  shortRate: number;
  spread: number; // The profit spread
  timestamp: number;
}

export interface TradeConfig {
  amountUSDC: number;
  leverage: number;
}

export enum ConnectionStatus {
  Connecting = 'Connecting',
  Connected = 'Connected',
  Error = 'Error',
  Mock = 'Mock Mode',
}