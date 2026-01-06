import React from 'react';
import { ArbitrageOpportunity, TradeConfig } from '../types';
import { ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

interface OpportunityCardProps {
  opp: ArbitrageOpportunity;
  onExecute: (opp: ArbitrageOpportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opp, onExecute }) => {
  // Determine color intensity based on spread
  const intensity = opp.spread > 0.1 ? 'border-green-500/50 shadow-green-900/20' : 'border-gray-700 shadow-none';

  return (
    <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border ${intensity} p-5 shadow-lg flex flex-col justify-between h-full transition-transform hover:-translate-y-1`}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {opp.symbol}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
              Arbitrage
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              +{opp.spread.toFixed(4)}%
            </div>
            <div className="text-xs text-gray-500">Est. Hourly Yield</div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-950/50 p-3 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-xs text-red-400 font-bold mb-1">SHORT</div>
            <div className="text-sm text-gray-300">{opp.shortPlatform}</div>
            <div className="text-xs text-green-400 font-mono">+{opp.shortRate.toFixed(4)}%</div>
          </div>
          
          <ArrowRight className="text-gray-600 w-4 h-4" />
          
          <div className="text-center">
            <div className="text-xs text-green-400 font-bold mb-1">LONG</div>
            <div className="text-sm text-gray-300">{opp.longPlatform}</div>
            <div className="text-xs text-gray-400 font-mono">{opp.longRate.toFixed(4)}%</div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onExecute(opp)}
        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <TrendingUp className="w-4 h-4" />
        Execute Trade
      </button>

      {opp.shortPlatform === 'Variational' || opp.longPlatform === 'Variational' ? (
        <div className="absolute top-2 right-2">
           <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default OpportunityCard;