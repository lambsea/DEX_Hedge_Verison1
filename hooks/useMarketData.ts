import { useState, useEffect, useRef } from 'react';
import { FundingRate, MarketRateMap, ArbitrageOpportunity, ConnectionStatus } from '../types';
import { fetchAsterRates, fetchBasedRates, fetchVariationalRates, LighterService } from '../services/api';
import { ARB_THRESHOLD, REFRESH_INTERVAL } from '../constants';

export const useMarketData = () => {
  const [rates, setRates] = useState<MarketRateMap>({});
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lighterStatus, setLighterStatus] = useState<ConnectionStatus>(ConnectionStatus.Connecting);
  
  // Use refs to store latest partial updates to avoid race conditions in state
  const ratesRef = useRef<MarketRateMap>({});

  const updateRates = (newRates: FundingRate[]) => {
    newRates.forEach(item => {
      if (!ratesRef.current[item.symbol]) {
        ratesRef.current[item.symbol] = {};
      }
      ratesRef.current[item.symbol][item.platform] = item.rate;
    });
    
    // Clone to trigger re-render
    setRates({ ...ratesRef.current });
    calculateArbitrage();
    setLastUpdated(new Date());
  };

  const calculateArbitrage = () => {
    const opps: ArbitrageOpportunity[] = [];
    const map = ratesRef.current;
    
    Object.keys(map).forEach(symbol => {
      const platforms = map[symbol];
      const platformNames = Object.keys(platforms);
      
      if (platformNames.length < 2) return;

      // Compare every pair
      for (let i = 0; i < platformNames.length; i++) {
        for (let j = 0; j < platformNames.length; j++) {
          if (i === j) continue;
          
          const pA = platformNames[i];
          const pB = platformNames[j];
          const rateA = platforms[pA];
          const rateB = platforms[pB];

          if (rateA === null || rateB === null) continue;

          // Strategy: Short the Positive Rate (Receive funding), Long the Negative Rate (Receive funding)
          // Or Short the Higher Positive, Long the Lower Positive.
          // Simply: We want (Rate_Short - Rate_Long) > Threshold
          
          // Scenario: Short on pA, Long on pB
          // Profit = Rate_Short(pA) - Rate_Long(pB)
          // Note: If pB is negative, we pay negative funding (receive money).
          // Formula: Cashflow = (Position * RateA) - (Position * RateB)
          
          const spread = rateA - rateB;

          if (spread > ARB_THRESHOLD) {
            opps.push({
              id: `${symbol}-${pA}-${pB}`,
              symbol,
              shortPlatform: pA,
              longPlatform: pB,
              shortRate: rateA,
              longRate: rateB,
              spread,
              timestamp: Date.now()
            });
          }
        }
      }
    });

    // Sort by highest spread
    setOpportunities(opps.sort((a, b) => b.spread - a.spread));
  };

  useEffect(() => {
    // 1. Setup Lighter Websocket
    const lighterService = new LighterService(
      (newRates) => updateRates(newRates),
      (status) => setLighterStatus(status)
    );
    lighterService.connect();

    // 2. Poll HTTP APIs
    const fetchData = async () => {
      const [aster, based, variational] = await Promise.all([
        fetchAsterRates(),
        fetchBasedRates(),
        fetchVariationalRates()
      ]);
      updateRates([...aster, ...based, ...variational]);
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      lighterService.disconnect();
      clearInterval(interval);
    };
  }, []);

  return {
    rates,
    opportunities,
    lastUpdated,
    lighterStatus
  };
};