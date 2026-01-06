import React, { useState } from 'react';
import { ArbitrageOpportunity } from '../types';
import { useWallet } from '../contexts/WalletContext';
import { executeArbitrageStrategy, TradeResult } from '../services/tradeExecutor';
import { X, CheckCircle, Loader2, AlertTriangle, Wallet } from 'lucide-react';

interface TradeModalProps {
  opp: ArbitrageOpportunity;
  onClose: () => void;
}

const TradeModal: React.FC<TradeModalProps> = ({ opp, onClose }) => {
  const { isConnected, signer, connectWallet } = useWallet();
  const [step, setStep] = useState<'config' | 'executing' | 'results'>('config');
  const [amount, setAmount] = useState(100);
  const [leverage, setLeverage] = useState(1);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [takeProfit, setTakeProfit] = useState<number | ''>('');
  const [results, setResults] = useState<{ short: TradeResult | null; long: TradeResult | null }>({ short: null, long: null });

  const handleExecute = async () => {
    if (!isConnected || !signer) return;

    setStep('executing');
    
    try {
      const { shortLeg, longLeg } = await executeArbitrageStrategy(
        signer,
        opp,
        amount,
        leverage,
        typeof stopLoss === 'number' ? stopLoss : 0,
        typeof takeProfit === 'number' ? takeProfit : 0
      );
      
      setResults({ short: shortLeg, long: longLeg });
      setStep('results');
    } catch (e) {
      console.error("Critical execution error", e);
      setStep('config'); // Reset on error
    }
  };

  const isMock = opp.shortPlatform === 'Variational' || opp.longPlatform === 'Variational';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-lg font-bold text-white">Execute Arbitrage</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'config' && (
            <>
              {/* Pair Info */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Target Pair</span>
                  <span className="text-white font-mono font-bold">{opp.symbol}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-center border-r border-gray-700">
                    <div className="text-xs text-red-400 font-bold">SHORT</div>
                    <div className="text-sm text-gray-200">{opp.shortPlatform}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-green-400 font-bold">LONG</div>
                    <div className="text-sm text-gray-200">{opp.longPlatform}</div>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount (USDC per leg)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Leverage ({leverage}x)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
                    <input 
                      type="number" 
                      placeholder="Optional"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
                    <input 
                      type="number" 
                      placeholder="Optional"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Warning/Mock Notice */}
              {isMock && (
                <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-xs text-yellow-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Contracts for Variational are simulated. This will return a mock hash.</span>
                </div>
              )}

              {/* Action Button */}
              {!isConnected ? (
                <button 
                  onClick={connectWallet}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Trade
                </button>
              ) : (
                <button 
                  onClick={handleExecute}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/50"
                >
                  Confirm Execution ({amount * 2} USDC Total)
                </button>
              )}
            </>
          )}

          {step === 'executing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h4 className="text-white font-medium text-lg">Executing Trades...</h4>
              <div className="text-gray-400 text-sm mt-4 space-y-1">
                <p>1. Interacting with {opp.shortPlatform} Contract</p>
                <p>2. Interacting with {opp.longPlatform} Contract</p>
                <p className="text-xs text-gray-500 mt-2">Please sign transactions in your wallet.</p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <h4 className="text-white font-bold text-xl mb-1">Execution Complete</h4>
                <p className="text-gray-400 text-sm">Review your trade status below</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Short Leg Result */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${results.short?.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                   <div className="flex items-center gap-3">
                      {results.short?.success ? <CheckCircle className="w-5 h-5 text-green-500"/> : <X className="w-5 h-5 text-red-500"/>}
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-400">SHORT ({opp.shortPlatform})</div>
                        <div className="text-sm text-white">{results.short?.success ? 'Success' : 'Failed'}</div>
                      </div>
                   </div>
                   {results.short?.txHash && (
                     <a href="#" className="text-xs text-indigo-400 hover:underline">View TX</a>
                   )}
                </div>

                {/* Long Leg Result */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${results.long?.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                   <div className="flex items-center gap-3">
                      {results.long?.success ? <CheckCircle className="w-5 h-5 text-green-500"/> : <X className="w-5 h-5 text-red-500"/>}
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-400">LONG ({opp.longPlatform})</div>
                        <div className="text-sm text-white">{results.long?.success ? 'Success' : 'Failed'}</div>
                      </div>
                   </div>
                   {results.long?.txHash && (
                     <a href="#" className="text-xs text-indigo-400 hover:underline">View TX</a>
                   )}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeModal;