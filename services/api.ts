import { FundingRate, ConnectionStatus } from '../types';
import { LIGHTER_STATIC_MAP } from '../constants';

// --- ASTER SERVICE ---
export const fetchAsterRates = async (): Promise<FundingRate[]> => {
  try {
    const response = await fetch('https://fapi.asterdex.com/fapi/v1/premiumIndex');
    if (!response.ok) throw new Error('Failed to fetch Aster');
    const data = await response.json();
    
    // Check if data is array
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      symbol: item.symbol,
      rate: parseFloat(item.lastFundingRate || '0') * 100,
      platform: 'Aster' as const,
      timestamp: Date.now()
    })).filter((r: { rate: number }) => r.rate !== 0);
  } catch (error) {
    console.error("Aster API Error", error);
    return [];
  }
};

// --- BASED (HYPERLIQUID) SERVICE ---
export const fetchBasedRates = async (): Promise<FundingRate[]> => {
  try {
    // Using Hyperliquid info endpoint
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' })
    });
    
    if (!response.ok) throw new Error('Failed to fetch Based/Hyperliquid');
    const data = await response.json();
    
    // Hyperliquid returns [universe, assetCtxs]
    const universe = data[0].universe;
    const assetCtxs = data[1];

    const rates: FundingRate[] = [];

    universe.forEach((asset: any, index: number) => {
      const ctx = assetCtxs[index];
      if (ctx) {
        // Hyperliquid funding is hourly
        const funding = parseFloat(ctx.funding || '0') * 100;
        rates.push({
          symbol: `${asset.name}USDT`, // Standardize naming
          rate: funding,
          platform: 'Based',
          timestamp: Date.now()
        });
      }
    });

    return rates;
  } catch (error) {
    console.error("Based API Error", error);
    return [];
  }
};

// --- LIGHTER SERVICE (WebSocket + Dynamic Discovery) ---
export class LighterService {
  private ws: WebSocket | null = null;
  private onUpdate: (rates: FundingRate[]) => void;
  private statusCallback: (status: ConnectionStatus) => void;
  private rateCache: Map<string, number> = new Map();
  
  // Dynamic map to store ID -> Symbol (e.g. 0 -> BTCUSDC)
  private marketMap: Record<number, string> = { ...LIGHTER_STATIC_MAP };

  constructor(onUpdate: (rates: FundingRate[]) => void, onStatus: (status: ConnectionStatus) => void) {
    this.onUpdate = onUpdate;
    this.statusCallback = onStatus;
  }

  // Fetch accurate market mapping from Lighter API
  private async fetchMarketConfig() {
    try {
      // Try the elliot.ai endpoint which mirrors the WS host
      const response = await fetch('https://mainnet.zklighter.elliot.ai/v1/order-book');
      if (!response.ok) throw new Error('Failed to fetch Lighter config');
      
      const data = await response.json();
      
      // Structure can vary, handling common Lighter response formats
      // Expected: { order_books: [ { id: 0, symbol: "BTC-USDC" }, ... ] }
      
      const newMap: Record<number, string> = {};
      
      const processMarket = (id: number, symbolRaw: string) => {
        // Normalize symbol: BTC-USDC -> BTCUSDC
        // Note: Lighter uses USDC mostly. We keep it as USDC or normalized.
        // If we want to arb against USDT pairs, we might treat USDC/USDT as 1:1 for funding estimation.
        const symbol = symbolRaw.replace(/[-_]/g, ''); 
        newMap[id] = symbol;
      };

      if (data.order_books) {
        if (Array.isArray(data.order_books)) {
          data.order_books.forEach((m: any) => processMarket(m.id, m.symbol));
        } else {
          // If object
          Object.entries(data.order_books).forEach(([id, m]: [string, any]) => {
            processMarket(parseInt(id), m.symbol);
          });
        }
      }

      if (Object.keys(newMap).length > 0) {
        this.marketMap = { ...this.marketMap, ...newMap };
        console.log("Lighter Market Map Updated:", this.marketMap);
      }
    } catch (error) {
      console.warn("Lighter Config Fetch Failed, using static map:", error);
    }
  }

  async connect() {
    this.statusCallback(ConnectionStatus.Connecting);
    
    // Fetch config before or during connection to ensure symbols are correct
    await this.fetchMarketConfig();

    this.ws = new WebSocket('wss://mainnet.zklighter.elliot.ai/stream');

    this.ws.onopen = () => {
      this.statusCallback(ConnectionStatus.Connected);
      console.log('Lighter WS Connected');
      
      // Subscribe to all discovered markets + some buffer
      const maxId = Math.max(...Object.keys(this.marketMap).map(Number), 19);
      
      for (let i = 0; i <= maxId + 5; i++) {
        this.ws?.send(JSON.stringify({
          type: "subscribe",
          channel: `market_stats/${i}`
        }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'update/market_stats' || data.type === 'subscribed/market_stats') {
          const stats = data.market_stats || data.stats;
          if (!stats) return;

          const marketId = data.market_index ?? stats.market_id;
          if (marketId === undefined) return;

          const rateStr = stats.funding_rate || stats.current_funding_rate;
          if (!rateStr) return;

          const rate = parseFloat(rateStr) * 100;
          
          // Use dynamic map
          const symbol = this.marketMap[marketId] || `MARKET_${marketId}`;
          
          this.rateCache.set(symbol, rate);
          
          const rates: FundingRate[] = Array.from(this.rateCache.entries()).map(([sym, r]) => ({
            symbol: sym,
            rate: r,
            platform: 'Lighter' as const,
            timestamp: Date.now()
          }));
          
          this.onUpdate(rates);
        }
      } catch (e) {
        console.error("Lighter WS Parse Error", e);
      }
    };

    this.ws.onerror = () => {
      this.statusCallback(ConnectionStatus.Error);
    };

    this.ws.onclose = () => {
      this.statusCallback(ConnectionStatus.Error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// --- VARIATIONAL SERVICE (Simulation / Proxy) ---
// Solution for No API:
// 1. Ideal: Use a backend proxy to read the contract state from Arbitrum directly via RPC.
// 2. Browser-only: Use ethers.js/viem to call `getFundingRate` on the Variational smart contracts if ABI/Address is known.
// 3. Current: Simulation.
export const fetchVariationalRates = async (): Promise<FundingRate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'XPLUSDT', 'SOLUSDT', 'ARBUSDT'];
      const rates = symbols.map(sym => {
        const base = (Math.random() - 0.5) * 0.05; 
        return {
          symbol: sym,
          rate: base,
          platform: 'Variational' as const,
          timestamp: Date.now()
        };
      });
      resolve(rates);
    }, 500);
  });
};