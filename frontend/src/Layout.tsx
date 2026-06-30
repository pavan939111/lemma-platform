import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { Settings, ShieldAlert, CheckCircle, HelpCircle, X } from "lucide-react";
import ChatbotWidget from "./components/ChatbotWidget";

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Connection states
  const [token, setToken] = useState("");
  const [podId, setPodId] = useState("");
  const [hasToken, setHasToken] = useState(false);

  // Load values on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("lemma_token") || "";
    const savedPodId = localStorage.getItem("lemma_pod_id") || "019f1181-ece3-75a3-b428-fc49449d1adb";
    
    setToken(savedToken);
    setPodId(savedPodId);
    setHasToken(!!savedToken);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem("lemma_token", token.trim());
    } else {
      localStorage.removeItem("lemma_token");
    }

    if (podId.trim()) {
      localStorage.setItem("lemma_pod_id", podId.trim());
    } else {
      localStorage.removeItem("lemma_pod_id");
    }

    setIsConfigOpen(false);
    // Reload the page to re-initialize the Lemma SDK client with the new credentials
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem("lemma_token");
    localStorage.removeItem("lemma_pod_id");
    setToken("");
    setPodId("019f1181-ece3-75a3-b428-fc49449d1adb");
    setHasToken(false);
    setIsConfigOpen(false);
    window.location.reload();
  };

  return (
    <div className={`min-h-screen bg-[#050814] flex flex-col text-slate-100 relative transition-all duration-300 ${isChatOpen ? 'pr-[380px]' : ''}`}>
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 bg-[#070b16]/70 backdrop-blur-md border-b border-slate-800/80 h-20 shrink-0">
        <div className="max-w-[1920px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent tracking-tight">
                VaadDoc
              </span>
              <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-[9px] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">
                POD RUNTIME
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-850/50 border border-transparent hover:border-slate-800/50 transition duration-300"
              >
                Draft Plaint
              </Link>
              <Link
                to="/deadlines"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-850/50 border border-transparent hover:border-slate-800/50 transition duration-300"
              >
                Deadlines
              </Link>
              <Link
                to="/law-router"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-850/50 border border-transparent hover:border-slate-800/50 transition duration-300"
              >
                IPC / BNS Router
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Indicator Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className={`text-[10px] font-mono font-bold px-4 py-2 rounded-full flex items-center gap-2 border transition duration-300 ${
                hasToken
                  ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                  : "text-amber-400 bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasToken ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${hasToken ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {hasToken ? "SESSION CONNECTED" : "LINK SESSION CONTEXT"}
              <Settings className="w-3 h-3 ml-1.5 opacity-70" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300">
        <Outlet />
      </main>

      {/* Chatbot Sidebar Area (Full screen height sidebar) */}
      <div className={`fixed top-0 right-0 h-screen z-50 border-l border-slate-800/80 bg-[#070b16]/95 backdrop-blur-md flex flex-col shrink-0 transition-all duration-300 ${isChatOpen ? 'w-[380px] opacity-100 visible' : 'w-0 opacity-0 invisible overflow-hidden border-l-transparent'}`}>
        {isChatOpen && (
          <ChatbotWidget isOpen={true} setIsOpen={setIsChatOpen} isSidebar={true} />
        )}
      </div>

      {/* Floating launcher when chatbot is closed */}
      {!isChatOpen && (
        <ChatbotWidget isOpen={false} setIsOpen={setIsChatOpen} isSidebar={false} />
      )}

      {/* Glassmorphic Session Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#070b16]/40">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Configure Pod Connection</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">Authorization Settings</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* Guidelines / Help */}
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-350">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white uppercase tracking-wider text-[10px]">Session Token & Auth Instructions:</span>
                  <p>Lemma Cloud Pod endpoints are protected. Guests can authorize in two ways:</p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-semibold text-emerald-400">Method A: Pod Membership (No Token Required)</span>
                      <p className="text-[10px] text-slate-450 mt-0.5">Add the guest's email to the Pod Members list in your Lemma Web Console. Once they log in to <a href="https://lemma.work" target="_blank" rel="noopener noreferrer" className="underline text-emerald-300">lemma.work</a> in their browser, this app automatically authenticates them via session cookies.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-400">Method B: Paste Developer Token</span>
                      <ol className="list-decimal pl-4 space-y-1 mt-1 font-mono text-[10px] text-slate-400">
                        <li>Run: <code className="text-emerald-300">lemma auth login</code></li>
                        <li>Run: <code className="text-emerald-300">lemma auth print-token</code></li>
                        <li>Paste the printed token string below.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pod ID Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Target Pod ID
                </label>
                <input
                  type="text"
                  value={podId}
                  onChange={(e) => setPodId(e.target.value)}
                  placeholder="e.g., 019f1181-ece3-75a3-b428-fc49449d1adb"
                  required
                  className="w-full bg-[#050814] text-slate-200 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition font-mono"
                />
              </div>

              {/* API Token Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Lemma API Token (Bearer)
                </label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your eyJraWQiOi... token here"
                  rows={4}
                  required
                  className="w-full bg-[#050814] text-slate-200 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition font-mono resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-wider"
                >
                  Clear & Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-555 text-white text-xs font-bold transition uppercase tracking-wider shadow-lg hover:shadow-emerald-500/10"
                >
                  Save & Reload
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
