import React, { useEffect, useState } from 'react';
import { Landmark, TrendingUp, ShieldAlert, Activity, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { macroApi } from '../services/api';

const MacroMarketTicker = () => {
  const [macroData, setMacroData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMacro = async () => {
    try {
      const res = await macroApi.getCurrent();
      if (res?.success && res.data) {
        setMacroData(res.data);
      }
    } catch (e) {
      console.warn('Macro ticker fetch warning:', e);
    }
  };

  useEffect(() => {
    fetchMacro();
    const interval = setInterval(fetchMacro, 60000); // 1-minute live poll
    return () => clearInterval(interval);
  }, []);

  const repo = macroData?.rbiRepoRate ?? 6.50;
  const inflation = macroData?.cpiInflationRate ?? 5.10;
  const gsec = macroData?.gSec10YYield ?? 7.05;
  const mclr = macroData?.mclr1Year ?? 8.85;
  const riskWeight = macroData?.rbiUnsecuredRiskWeight ?? 125;

  return (
    <div className="bg-[#0f0f0f] border-b border-[#222] px-4 py-1.5 flex items-center justify-between text-[11px] overflow-x-auto no-scrollbar select-none">
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 text-white font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>RBI EBLR MARKET FEED</span>
        </div>

        <div className="flex items-center gap-1 text-gray-300">
          <span className="text-gray-500 uppercase font-semibold">RBI Repo Rate:</span>
          <span className="font-bold font-mono text-white">{repo.toFixed(2)}%</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-gray-300">
          <span className="text-gray-500 uppercase font-semibold">10Y G-Sec:</span>
          <span className="font-bold font-mono text-white">{gsec.toFixed(2)}%</span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-gray-300">
          <span className="text-gray-500 uppercase font-semibold">1Y MCLR:</span>
          <span className="font-bold font-mono text-white">{mclr.toFixed(2)}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-gray-300">
          <span className="text-gray-500 uppercase font-semibold">CPI Inflation:</span>
          <span className="font-bold font-mono text-white">{inflation.toFixed(2)}%</span>
        </div>

        <div className="hidden xl:flex items-center gap-1 text-gray-300">
          <span className="text-gray-500 uppercase font-semibold">Unsecured Risk Weight:</span>
          <span className="font-bold font-mono text-white">{riskWeight}%</span>
        </div>
      </div>

      <Link
        to="/macro-benchmarks"
        className="flex items-center gap-1 text-gray-400 hover:text-white font-medium hover:underline transition-colors shrink-0 ml-4"
      >
        <span>Macro Rates & MPC Studio</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

export default MacroMarketTicker;
