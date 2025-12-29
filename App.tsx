
import React, { useState, useEffect } from 'react';
import { GameState, GameStats, SimulationOutput } from './types';
import GameEngine from './components/GameEngine';
import { api } from './api/mockServer';

const LOCAL_SIM_ENGINE = {
  briefings: [
    "Localized debris field detected. Calibrating shield resonance.",
    "Gravitational anomalies detected in Sector 4. Manual override required.",
    "Warning: High-speed kinetic projectiles approaching your vector.",
    "Awaiting pilot confirmation. Systems green. Engage when ready.",
    "Simulation cycle 1042-B ready. Difficulty curve optimized."
  ],
  getReport: (score: number) => {
    if (score < 500) return "Simulation terminated. Pilot reflexes below threshold.";
    if (score < 1500) return "Acceptable performance. Telemetry logged for review.";
    if (score < 3000) return "Excellent evasion patterns. You're exceeding expectations.";
    return "Elite status confirmed. Records shattered. Godspeed, Commander.";
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [simOutput, setSimOutput] = useState<SimulationOutput>({ briefing: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<'IDLE' | 'BUSY' | 'SYNCED'>('IDLE');
  const [highScore, setHighScore] = useState(0);

  // MERN-like Data Fetching
  const fetchGlobalData = async () => {
    setServerStatus('BUSY');
    try {
      const response = await api.getStats();
      if (response.success) {
        setHistory(response.data.history);
        setHighScore(response.data.highScore);
        setServerStatus('SYNCED');
      }
    } catch (e) {
      console.error("Backend unreachable");
    }
  };

  useEffect(() => {
    fetchGlobalData();
    setSimOutput({ 
      briefing: LOCAL_SIM_ENGINE.briefings[Math.floor(Math.random() * LOCAL_SIM_ENGINE.briefings.length)] 
    });
  }, []);

  const onGameOver = async (finalStats: GameStats) => {
    setGameState(GameState.GAME_OVER);
    setStats(finalStats);
    
    // Mimic 'POST' request to backend
    setServerStatus('BUSY');
    const response = await api.saveScore(finalStats.score, finalStats.obstaclesDodged);
    if (response.success) {
      await fetchGlobalData(); // Refresh history
    }

    setSimOutput(prev => ({ 
      ...prev, 
      report: LOCAL_SIM_ENGINE.getReport(finalStats.score) 
    }));
  };

  const reset = () => {
    setGameState(GameState.IDLE);
    setSimOutput({ 
      briefing: LOCAL_SIM_ENGINE.briefings[Math.floor(Math.random() * LOCAL_SIM_ENGINE.briefings.length)] 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Simulated Backend Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500 mb-1">
              ASTRO-MERN
            </h1>
            <div className="flex flex-col gap-2 mb-6">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'BUSY' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                SERVER: {serverStatus === 'BUSY' ? 'PROCESSING...' : 'ACTIVE'}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                DB: MONGODB_MOCK
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Mission Log</p>
                <p className="text-xs text-slate-300 italic leading-relaxed min-h-[40px]">
                  {simOutput.report || simOutput.briefing}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-end mb-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">DB History</p>
                  <p className="text-[10px] text-sky-400 font-bold">ALL-TIME: {highScore}</p>
                </div>
                <div className="space-y-2">
                  {history.length > 0 ? history.map((h, i) => (
                    <div key={h._id} className="flex justify-between items-center text-xs font-mono bg-slate-950/50 p-2 rounded border border-slate-800/50">
                      <span className="text-slate-600">ID: {h._id.slice(-4)}</span>
                      <span className="text-slate-300 font-bold">{h.score.toLocaleString()}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-700 italic">Database is empty.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main View: React Frontend */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <GameEngine gameState={gameState} onGameOver={onGameOver} />

            {/* Overlays */}
            {(gameState === GameState.IDLE || gameState === GameState.GAME_OVER) && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 rounded-2xl animate-in fade-in duration-500">
                {gameState === GameState.IDLE ? (
                  <div className="text-center space-y-8 max-w-sm">
                    <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto border border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                      <i className="fa-solid fa-server text-3xl text-sky-400"></i>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">MERN Simulation</h2>
                      <p className="text-slate-400 text-sm">Standalone architecture with virtualized backend and persistent database storage.</p>
                    </div>
                    <button 
                      onClick={() => setGameState(GameState.PLAYING)}
                      className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3 group"
                    >
                      INITIALIZE CLIENT
                      <i className="fa-solid fa-chevron-right text-xs group-hover:translate-x-1 transition-transform"></i>
                    </button>
                    <div className="text-[10px] font-mono text-slate-500 flex justify-center gap-6">
                      <span>FRONTEND: REACT</span>
                      <span>BACKEND: MOCK-EXPRESS</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-8 max-w-sm animate-in zoom-in duration-300">
                    <div className="space-y-1">
                      <h2 className="text-red-500 font-black text-5xl italic tracking-tighter">ERROR 500</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Critical Hardware Failure</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Last Score</p>
                        <p className="text-2xl font-black text-white font-mono">{stats?.score.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dodged</p>
                        <p className="text-2xl font-black text-white font-mono">{stats?.obstaclesDodged}</p>
                      </div>
                    </div>

                    <button 
                      onClick={reset}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-database text-xs text-sky-400"></i>
                      RE-SYNC DATABASE
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <i className="fa-solid fa-code-branch text-sky-500/50"></i> MERN_STACK_SIM
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <i className="fa-solid fa-cloud-slash text-red-500/50"></i> ZERO_EXTERNAL_API
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
              LOCAL_HOST :: 127.0.0.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
