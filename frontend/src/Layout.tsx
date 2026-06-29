import React from "react";
import { Link, Outlet } from "react-router-dom";
import ChatbotWidget from "./components/ChatbotWidget";

export default function Layout() {
  return (
    <>
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 bg-[#070b16]/70 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800/30 border border-transparent hover:border-slate-800/50 transition duration-300"
              >
                Draft Plaint
              </Link>
              <Link
                to="/deadlines"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800/30 border border-transparent hover:border-slate-800/50 transition duration-300"
              >
                Deadlines
              </Link>
              <Link
                to="/law-router"
                className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800/30 border border-transparent hover:border-slate-800/50 transition duration-300"
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

      {/* Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 relative">
        <Outlet />
      </main>

      {/* Chatbot Assistant */}
      <ChatbotWidget />
    </>
  );
}
