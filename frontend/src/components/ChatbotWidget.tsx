"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

interface FakeQARecord {
  keywords: string[];
  response: string;
}

const FAKE_DB: FakeQARecord[] = [
  {
    keywords: ["bns", "ipc", "difference", "replace", "transition", "new law", "old law"],
    response: "BNS (Bharatiya Nyaya Sanhita, 2023) completely replaced the IPC (Indian Penal Code) on July 1, 2024. For offences committed before July 1, 2024, the IPC applies. For offences committed on or after that date, BNS applies. Section numbers have shifted significantly (e.g., Cheating is now BNS Sec. 318 instead of IPC Sec. 420; Theft is BNS Sec. 303 instead of IPC Sec. 379)."
  },
  {
    keywords: ["bail", "bnss", "crpc", "anticipatory", "regular", "438", "482", "479"],
    response: "Bail procedures depend on the date of offence. For cases registered after July 1, 2024, regular bail is filed under Section 479 of the BNSS (replacing CrPC 437/439), and anticipatory bail is filed under Section 482 of the BNSS (replacing CrPC 438). For prior cases, the old CrPC provisions still apply."
  },
  {
    keywords: ["cheque", "dishonour", "ni act", "notice", "138", "demand notice"],
    response: "Under Section 138 of the Negotiable Instruments (NI) Act, you must issue a statutory demand notice to the drawer within 30 days of receiving the bank return memo. The drawer is given 15 days to make payment. If they fail, a criminal complaint must be filed before the Magistrate within 1 month from the date the cause of action arises."
  },
  {
    keywords: ["written statement", "summons", "order viii", "cpc", "extension", "timeline", "defense"],
    response: "Under CPC Order VIII Rule 1, the defendant must file a written statement of defense within 30 days of being served with summons. The court may extend this up to a maximum of 90 days (or 120 days in commercial suits, which is a strict, non-extendable statutory cutoff) upon recording sufficient reasons."
  },
  {
    keywords: ["limitation", "civil", "time limit", "period", "limitation act"],
    response: "Civil suit limitation periods are governed by the Limitation Act, 1963. The default period for most contracts, torts, and recovery suits is 3 years from the date the cause of action arises (Schedule Article 113). Land recovery suits allow up to 12 years. Always verify specific schedule articles before filing."
  },
  {
    keywords: ["court fee", "valuation", "delhi", "fees", "ad valorem"],
    response: "Court fees in India are state-specific and calculated ad valorem (based on the suit valuation) under the Court Fees Act, 1870. The valuation must be declared clearly in the plaint. For recovery/damages, it is calculated based on the total claim amount. Commercial suits require strict compliance with valuation guidelines."
  },
  {
    keywords: ["citation", "judgment", "hallucination", "fake", "research"],
    response: "Citing AI-hallucinated judgments or non-existent citations constitutes professional misconduct under the Advocates Act. The Supreme Court of India issues strict warnings: all research outputs from generative LLMs must be manually verified against official reporters like SCC, AIR, or court websites before filing."
  },
  {
    keywords: ["default bail", "167", "187", "custody", "charge sheet"],
    response: "Default bail is a statutory right under BNSS Sec. 187 (formerly CrPC 167) if the police fail to file a chargesheet within 60 days (for offences punishable with under 10 years) or 90 days (for offences punishable with death, life, or 10+ years) of arrest."
  }
];

const fixedQuestions = [
  { label: "BNS vs IPC Difference", q: "What is the difference between BNS and IPC?" },
  { label: "Bail Sections (BNSS)", q: "What sections apply for bail under BNSS?" },
  { label: "Cheque Notice Limit", q: "What is the deadline for a cheque notice?" },
  { label: "Written Statement Days", q: "What is the written statement deadline?" }
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Welcome to VaadDoc Legal Assistant. Ask me any procedural questions regarding Indian Civil Procedure, Criminal Code transitions (BNS/IPC), or statutory limitation timelines.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: "user", text, time: timeStr }]);
    setInput("");
    setLoading(true);

    // Simulate database lookup latency for realistic micro-physics feel
    setTimeout(() => {
      const qLower = text.toLowerCase().trim();
      let botResponse = "";

      // 1. Scan fake database for keyword matches
      for (const record of FAKE_DB) {
        if (record.keywords.some((k) => qLower.includes(k))) {
          botResponse = record.response;
          break;
        }
      }

      // 2. Generic fallback if no keyword matches (guarantees a smart response)
      if (!botResponse) {
        botResponse = `Regarding your query on "${text}", under the Indian legal procedure, such matters are subject to the rules of the local jurisdictional court, the relevant provisions of the Code of Civil Procedure (CPC, 1908) or Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023), and the Limitation Act, 1963. Please consult the Bar Association directives or official high court registries to verify the exact filing rules.`;
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botResponse + "\n\nVerify this with applicable court rules or consult your Bar Association.",
          time: botTime
        }
      ]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="w-[380px] h-[500px] bg-[#070b16]/95 border border-emerald-500/25 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-lg animate-fade-in relative">
          
          {/* Decorative Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[1px]"></div>

          {/* Header */}
          <div className="bg-[#0b1329]/80 border-b border-slate-800 p-4 text-white flex justify-between items-center relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  VD
                </div>
                {/* Status Indicator */}
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-semibold text-xs tracking-wider uppercase text-white flex items-center gap-1.5">
                  Legal Assistant
                  <span className="bg-emerald-950/60 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded border border-emerald-900/50 font-mono">
                    DB ACTIVE
                  </span>
                </h4>
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Procedural Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white bg-slate-850/50 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages view */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col bg-[#050814] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed flex flex-col relative ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-emerald-600/90 to-teal-650/90 text-white self-end rounded-tr-none shadow-[0_4px_12px_rgba(16,185,129,0.08)] border border-emerald-500/10"
                    : "bg-[#0b1329]/60 text-slate-200 self-start rounded-tl-none border border-slate-800/80 shadow-inner"
                }`}
              >
                <span className="whitespace-pre-wrap">{m.text}</span>
                <span className={`text-[8px] mt-2 self-end font-mono ${m.sender === "user" ? "text-emerald-200" : "text-slate-500"}`}>
                  {m.time}
                </span>
              </div>
            ))}
            
            {loading && (
              <div className="bg-[#0b1329]/60 text-slate-400 self-start rounded-2xl rounded-tl-none p-4 text-xs border border-slate-800/80 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Consulting Statutory DB...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick options panel */}
          <div className="p-3 border-t border-slate-800/80 bg-[#070b16] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            {fixedQuestions.map((fq, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(fq.q)}
                disabled={loading}
                className="bg-[#0b1329] hover:bg-[#101b38] text-slate-350 hover:text-emerald-400 border border-slate-800/60 hover:border-emerald-800/50 rounded-full px-3.5 py-1.5 text-[9px] transition font-mono uppercase tracking-widest font-bold shrink-0 inline-block disabled:opacity-50"
              >
                {fq.label}
              </button>
            ))}
          </div>

          {/* Alert label */}
          <div className="bg-emerald-950/10 border-t border-slate-800/80 p-2.5 flex items-center gap-2 text-[9px] text-emerald-400/90 px-4 font-mono uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verify citations. Procedure lookup only.</span>
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-slate-800/80 bg-[#070b16] flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask procedural questions..."
              disabled={loading}
              className="flex-1 bg-[#050814] text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50 placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 disabled:from-slate-800 disabled:to-slate-850 text-white rounded-xl p-2 px-3.5 transition shadow-lg hover:shadow-emerald-500/10"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group border border-emerald-500/20"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out font-bold text-xs uppercase tracking-widest whitespace-nowrap">
            Ask Legal Assistant
          </span>
        </button>
      )}
    </div>
  );
}
