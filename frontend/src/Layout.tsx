import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import ChatbotWidget from "./components/ChatbotWidget";

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col text-slate-100 relative">
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
            <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LEMMA.WORK ACTIVE
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout Container */}
      <div className="flex-1 flex flex-row overflow-hidden w-full max-w-[1920px] mx-auto h-[calc(100vh-80px)]">
        
        {/* Main Content Area (First 4 parts - 80% or flex-1) */}
        <main className={`flex-1 p-6 md:p-10 overflow-y-auto transition-all duration-300 ${isChatOpen ? 'max-w-[70%] lg:max-w-[76%] xl:max-w-[80%]' : 'max-w-7xl mx-auto w-full'}`}>
          <Outlet />
        </main>
        
        {/* Chatbot Sidebar Area (Remaining 1 part - 20% or 380px) */}
        <div className={`transition-all duration-300 border-l border-slate-800/80 bg-[#070b16]/95 backdrop-blur-md flex flex-col shrink-0 h-full ${isChatOpen ? 'w-[380px] opacity-100 visible' : 'w-0 opacity-0 invisible overflow-hidden border-l-transparent'}`}>
          {isChatOpen && (
            <ChatbotWidget isOpen={true} setIsOpen={setIsChatOpen} isSidebar={true} />
          )}
        </div>
      </div>

      {/* Floating launcher when chatbot is closed */}
      {!isChatOpen && (
        <ChatbotWidget isOpen={false} setIsOpen={setIsChatOpen} isSidebar={false} />
      )}
    </div>
  );
}
