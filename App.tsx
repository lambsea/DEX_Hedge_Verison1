
import React, { useState } from 'react';
import { useMarketData } from './hooks/useMarketData';
import RateTable from './components/RateTable';
import OpportunityCard from './components/OpportunityCard';
import TradeModal from './components/TradeModal';
import { useWallet } from './contexts/WalletContext';
import { ArbitrageOpportunity, ConnectionStatus } from './types';
import { ARBITRUM_CHAIN_ID } from './constants';
import { Activity, RefreshCw, Zap, Wallet, AlertOctagon, LogOut, Network } from 'lucide-react';

function Dashboard() {
  const { rates, opportunities, lastUpdated, lighterStatus } = useMarketData();
  const { account, connectWallet, disconnectWallet, isConnected, chainId, switchNetwork } = useWallet();
  const [selectedOpp, setSelectedOpp] = useState<ArbitrageOpportunity | null>(null);

  const isWrongNetwork = isConnected && chainId !== ARBITRUM_CHAIN_ID;

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <Zap className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">ArbFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
                <span className={`w-2 h-2 rounded-full ${lighterStatus === ConnectionStatus.Connected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                Lighter: {lighterStatus}
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              {!isConnected ? (
                <button 
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {isWrongNetwork && (
                    <button 
                      onClick={switchNetwork}
                      className="bg-red-900/50 hover:bg-red-900/70 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Network className="w-4 h-4" />
                      Switch to Arb
                    </button>
                  )}
                  <button 
                    onClick={disconnectWallet}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700"
                  >
                    <span className={`w-2 h-2 rounded-full ${isWrongNetwork ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                    <LogOut className="w-3 h-3 ml-1 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time funding rate monitoring across Aster, Lighter, Based, and Variational.</p>
          
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <strong className="text-yellow-400 block mb-1">System Notice</strong>
              Trading execution requires a Web3 wallet (e.g., MetaMask). Ensure you are on Arbitrum One for execution.
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Active Opportunities
            </h2>
            <span className="text-sm text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
              {opportunities.length} found
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center">
              <RefreshCw className="w-10 h-10 mb-4 animate-spin opacity-50" />
              <p>Scanning markets for spread &gt; 0.005%...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map(opp => (
                <OpportunityCard 
                  key={opp.id} 
                  opp={opp} 
                  onExecute={(o) => setSelectedOpp(o)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Full Market Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Market Overview</h2>
          <RateTable rates={rates} />
        </div>
      </main>

      {/* Modals */}
      {selectedOpp && (
        <TradeModal 
          opp={selectedOpp} 
          onClose={() => setSelectedOpp(null)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
