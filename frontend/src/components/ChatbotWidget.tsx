"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, ShieldAlert } from "lucide-react";
import { client } from "../lib/lemma";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

// RAG Fixed Knowledge Store
const KNOWLEDGE_STORE = {
  vaaddoc_overview: {
    title: "VaadDoc Product & Features",
    content: "VaadDoc is a production-grade AI litigation drafting copilot designed for Indian advocates. Deployed serverless on Lemma Cloud, it automates compilation of raw case notes/transcripts into court-ready Civil Plaints (CPC), Criminal Bail Applications (BNS/BNSS or IPC/CrPC), or Cheque Dishonour Notices (Section 138 NI Act). It features a 7-agent pipeline, source grounding, and statutory deadlines tracker."
  },
  pipeline_architecture: {
    title: "7-Agent Pipeline Layout",
    content: "VaadDoc executes drafting via 7 specialized agents: A1 Input Handler (Unicode normalization), A2 Legal Cleaner (structures Hinglish/dialogue records), A3 Entity Extractor (maps litigation parameters with verbatim citations), A4 Validator Gate (Human-in-the-loop form query for missing data), A5 Law Router (statute assignment), A6 Doc Builder (Word jinja generation), and A7 QC Guard (fuzzy grounding confidence checks)."
  },
  law_router_transition: {
    title: "BNS vs IPC Statutory Routing",
    content: "On July 1, 2024, India replaced old colonial criminal codes (IPC, CrPC, Evidence Act) with new statutes (BNS, BNSS, BSA). VaadDoc uses the date of the offense to route cases: Offences before July 1, 2024 are drafted under IPC/CrPC (e.g., bail under CrPC 437/438, cheating under IPC 420). Offences on or after July 1, 2024 are drafted under BNS/BNSS (e.g., bail under BNSS 479/482, cheating under BNS 318)."
  },
  statutory_timelines: {
    title: "Statutory Deadlines & Limitation periods",
    content: "VaadDoc calculates timelines: Cheque notice must be sent within 30 days of the bank return memo; written statement must be filed within 30 days of summons service (extendable to 90 days under CPC, 120 days for commercial suits); general civil recovery suits have a 3-year limitation period from cause of action. Default bail applies after 60 days (minor offences) or 90 days (10+ years imprisonment offences) of custody."
  },
  citation_warnings: {
    title: "AI citation risks",
    content: "Citing AI-hallucinated judgments constitutes professional misconduct under the Advocates Act. The Supreme Court of India issues strict warnings: all research outputs from generative LLMs must be manually verified against official reporters like SCC, AIR, or court websites before filing."
  }
};

// Local fallback DB for offline/API-failure matches
const FAKE_DB = [
  {
    keywords: ["bns", "ipc", "difference", "replace", "transition", "new law", "old law"],
    response: KNOWLEDGE_STORE.law_router_transition.content
  },
  {
    keywords: ["bail", "bnss", "crpc", "anticipatory", "regular", "438", "482", "479"],
    response: KNOWLEDGE_STORE.law_router_transition.content
  },
  {
    keywords: ["cheque", "dishonour", "ni act", "notice", "138", "demand notice"],
    response: KNOWLEDGE_STORE.statutory_timelines.content
  },
  {
    keywords: ["written statement", "summons", "order viii", "cpc", "extension", "timeline", "defense"],
    response: KNOWLEDGE_STORE.statutory_timelines.content
  },
  {
    keywords: ["limitation", "civil", "time limit", "period", "limitation act"],
    response: KNOWLEDGE_STORE.statutory_timelines.content
  },
  {
    keywords: ["court fee", "valuation", "delhi", "fees", "ad valorem"],
    response: "Court fees in India are state-specific and calculated ad valorem (based on the suit valuation) under the Court Fees Act, 1870. The valuation must be declared clearly in the plaint."
  },
  {
    keywords: ["citation", "judgment", "hallucination", "fake", "research"],
    response: KNOWLEDGE_STORE.citation_warnings.content
  },
  {
    keywords: ["default bail", "167", "187", "custody", "charge sheet"],
    response: KNOWLEDGE_STORE.statutory_timelines.content
  },
  {
    keywords: ["pipeline", "agent", "architecture", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "how it works"],
    response: KNOWLEDGE_STORE.pipeline_architecture.content
  },
  {
    keywords: ["vaaddoc", "features", "overview", "product"],
    response: KNOWLEDGE_STORE.vaaddoc_overview.content
  }
];

// List of keywords indicating legal or product relevance
const RELEVANT_KEYWORDS = [
  "bns", "ipc", "bnss", "crpc", "cpc", "ni act", "cheque", "dishonour", "notice", "written statement",
  "summons", "order viii", "limitation", "court fee", "valuation", "bail", "anticipatory", "citation",
  "judgment", "hallucination", "default bail", "lawyer", "advocate", "litigation", "plaint", "vaaddoc",
  "pipeline", "agent", "draft", "legal", "court", "act", "section", "charge"
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

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: "user", text, time: timeStr }]);
    setInput("");
    setLoading(true);

    const qLower = text.toLowerCase().trim();

    // STEP 1: Query Classification (Check domain relevance)
    const isRelated = RELEVANT_KEYWORDS.some((k) => qLower.includes(k));
    if (!isRelated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "This is outside the scope of VaadDoc's legal assistant. Please ask a relevant question regarding Indian legal procedures, the statutory BNS/IPC transition, or our drafting tool.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    // STEP 2: RAG Retrieval via native Lemma Pod Agent
    try {
      // 1. Run the native chatbot_agent
      const conv = (await client.agents.run("chatbot_agent", text)) as any;
      
      // 2. Poll the conversation message list until the assistant replies
      let assistantReply = "";
      for (let attempt = 0; attempt < 25; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const response = await client.conversations.messages.list(conv.id);
        const msgs = response.items || [];
        
        // Find messages written by the assistant containing text content
        const assistantMsgs = msgs.filter(
          (m) => (m.role === "assistant" || m.role === "bot") && m.text
        );
        if (assistantMsgs.length > 0) {
          assistantReply = assistantMsgs[assistantMsgs.length - 1].text || "";
          break;
        }
      }

      if (assistantReply.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: assistantReply.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Lemma Pod chatbot agent run failed, falling back to local database.", err);
    }

    // Local RAG database lookup (fallback if API key is missing or fails)
    setTimeout(() => {
      let botResponse = "";

      for (const record of FAKE_DB) {
        if (record.keywords.some((k) => qLower.includes(k))) {
          botResponse = record.response;
          break;
        }
      }

      if (!botResponse) {
        botResponse = `Regarding your query on "${text}", under the Indian legal procedure, such matters are subject to the rules of the local jurisdictional court, the relevant provisions of the Code of Civil Procedure (CPC, 1908) or Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023), and the Limitation Act, 1963.`;
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
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-semibold text-xs tracking-wider uppercase text-white flex items-center gap-1.5">
                  Legal Assistant
                  <span className="bg-emerald-950/60 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded border border-emerald-900/50 font-mono">
                    RAG CLASSIFIER
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
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Retrieving & Classifying...</span>
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
            <span>RAG Query Classification Enforced</span>
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
              className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-555 disabled:from-slate-800 disabled:to-slate-850 text-white rounded-xl p-2 px-3.5 transition shadow-lg hover:shadow-emerald-500/10"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-555 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group border border-emerald-500/20"
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
