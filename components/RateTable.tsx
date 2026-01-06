import React from 'react';
import { MarketRateMap } from '../types';

interface RateTableProps {
  rates: MarketRateMap;
}

const RateTable: React.FC<RateTableProps> = ({ rates }) => {
  const platforms = ['Aster', 'Lighter', 'Based', 'Variational'];
  const symbols = Object.keys(rates).sort();

  const formatRate = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return <span className="text-gray-600">-</span>;
    const isPositive = rate > 0;
    const isNegative = rate < 0;
    
    return (
      <span className={`font-mono font-medium ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'}`}>
        {rate.toFixed(4)}%
      </span>
    );
  };

  return (
    <div className="overflow-x-auto bg-gray-900/50 rounded-xl border border-gray-800 shadow-xl backdrop-blur-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl">Symbol</th>
            {platforms.map(p => (
              <th key={p} className="px-6 py-4">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                Loading market data...
              </td>
            </tr>
          ) : (
            symbols.map((symbol, idx) => (
              <tr key={symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-200">{symbol}</td>
                {platforms.map(p => (
                  <td key={`${symbol}-${p}`} className="px-6 py-4">
                    {formatRate(rates[symbol]?.[p])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RateTable;