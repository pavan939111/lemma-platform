"use client";

import { useState } from "react";
import { MessageSquare, X, Send, AlertTriangle } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const FIXED_QA: Record<string, string> = {
  "what is the deadline to file a cheque dishonour complaint":
    "Under NI Act Section 138, you must send a demand notice within 30 days of dishonour. " +
    "If payment is not made within 15 days of the notice, file the complaint within 1 month " +
    "of the cause of action arising. Verify with your jurisdictional court rules.",

  "what is the difference between bns and ipc":
    "BNS (Bharatiya Nyaya Sanhita 2023) replaced IPC from July 1, 2024. " +
    "Offences committed before July 1, 2024 are prosecuted under IPC. " +
    "Offences on or after July 1, 2024 are prosecuted under BNS. " +
    "Section numbers have changed significantly — e.g. cheating is 420 IPC / 318 BNS.",

  "what sections apply for bail":
    "For offences after July 1 2024: Section 479 BNSS (regular bail), " +
    "Section 482 BNSS (anticipatory bail). " +
    "For offences before July 1 2024: Section 437 CrPC (regular bail), " +
    "Section 438 CrPC (anticipatory bail). Always verify the offence date.",

  "what is the written statement deadline":
    "Under CPC Order VIII Rule 1, a defendant must file their written statement " +
    "within 30 days of service of summons. The court may extend this up to 90 days " +
    "on sufficient cause shown. Missing this deadline can result in ex parte proceedings.",

  "what is the limitation period for civil suits":
    "Most civil suits have a 3-year limitation period from the date of cause of action " +
    "(Limitation Act 1963). Property suits may have 12 years. " +
    "The exact period depends on the nature of the suit — verify Article 113 or the " +
    "relevant article of the Limitation Act Schedule.",

  "can i use ai-generated case citations":
    "No. The Supreme Court of India (February 2026) declared that citing " +
    "AI-hallucinated judgments constitutes professional misconduct under the Advocates Act. " +
    "Always verify citations against SCC Online, Indian Kanoon, or official court records " +
    "before including them in any filing.",

  "what court fees apply for civil plaints":
    "Court fees in India are state-specific and calculated on the valuation of the suit. " +
    "Refer to your state's Court Fees Act. For Delhi: plaint valuation × applicable slab rate. " +
    "Always calculate fees from the official state schedule — VaadDoc does not compute court fees.",

  "what is default bail under bnss":
    "Under BNSS Section 187 (formerly CrPC 167), an accused is entitled to default bail " +
    "if the investigation is not completed within 60 days (minor offences) or " +
    "90 days (offences punishable with death, life, or 10+ years imprisonment) " +
    "from the date of arrest. The accused must apply for bail before the chargesheet is filed.",
};

const CHATBOT_SYSTEM_PROMPT = `You are a knowledgeable Indian legal procedure assistant.

STRICT RULES:
1. Only answer questions about Indian legal procedures, court processes, statutory deadlines,
   and the BNS/BNSS/BSA vs IPC/CrPC/Evidence Act transition.
2. NEVER generate or suggest specific case citations or judgment references.
3. NEVER give legal advice on strategy or likely outcomes.
4. End EVERY answer with: "Verify this with applicable court rules or consult your Bar Association."
5. If asked about anything outside Indian legal procedure, say: "This is outside my scope.
   Please consult a qualified lawyer."
6. Keep answers under 150 words. Be precise.`;

const fixedQuestions = [
  { label: "NI Act Notice Timeline", q: "what is the deadline to file a cheque dishonour complaint" },
  { label: "Difference BNS vs IPC", q: "what is the difference between bns and ipc" },
  { label: "Bail Sections Transition", q: "what sections apply for bail" },
  { label: "Written Statement Deadline", q: "what is the written statement deadline" },
  { label: "Civil Suit Limitation", q: "what is the limitation period for civil suits" },
  { label: "Court Fees Guide", q: "what court fees apply for civil plaints" },
  { label: "AI Citation Risk", q: "can i use ai-generated case citations" },
  { label: "Default Bail Rules", q: "what is default bail under bnss" }
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hello Counsel! I am your Indian procedural assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);

    const qLower = text.toLowerCase().trim();
    let botResponse = "";

    // 1. Check fixed questions
    for (const key of Object.keys(FIXED_QA)) {
      if (key.includes(qLower) || qLower.includes(key)) {
        botResponse = FIXED_QA[key] + "\n\nVerify this with applicable court rules or consult your Bar Association.";
        break;
      }
    }

    if (botResponse) {
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
      setLoading(false);
      return;
    }

    // 2. Direct Gemini Call
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "VITE_GEMINI_API_KEY is not configured in your environment." }
      ]);
      setLoading(false);
      return;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${CHATBOT_SYSTEM_PROMPT}\n\nQuestion: ${text}` }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300
          }
        })
      });

      if (response.ok) {
        const body = await response.json();
        const output = body?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to retrieve an answer.";
        setMessages((prev) => [...prev, { sender: "bot", text: output.trim() }]);
      } else {
        throw new Error("Gemini call failed.");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "I was unable to retrieve an answer. Please consult Indian Kanoon, SCC Online, or your Bar Association for this query." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="w-96 h-[500px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex justify-between items-center shadow">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <div>
                <h4 className="font-semibold text-sm">Legal Assistant</h4>
                <p className="text-[10px] text-teal-100">Procedural queries only</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 p-1 rounded transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages view */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col bg-slate-950">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-teal-600 text-white self-end rounded-br-none"
                    : "bg-slate-800 text-slate-200 self-start rounded-bl-none border border-slate-700/50"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="bg-slate-800 text-slate-400 self-start rounded-xl rounded-bl-none p-3 text-xs border border-slate-700/50 animate-pulse">
                Consulting statutory framework...
              </div>
            )}
          </div>

          {/* Quick options panel */}
          <div className="p-2 border-t border-slate-800 bg-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {fixedQuestions.map((fq, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(fq.q)}
                disabled={loading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 rounded-full px-3 py-1 text-[10px] transition shrink-0 inline-block disabled:opacity-50"
              >
                {fq.label}
              </button>
            ))}
          </div>

          {/* Alert label */}
          <div className="bg-amber-950/20 border-t border-slate-800 p-2 flex items-center gap-1.5 text-[9px] text-amber-500/90 px-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Never cite hallucinated judgments. Procedure only.</span>
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask procedural questions..."
              disabled={loading}
              className="flex-1 bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white rounded-xl p-2 px-3 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 group border border-teal-500/20"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out font-semibold text-xs whitespace-nowrap">
            Ask Legal Assistant
          </span>
        </button>
      )}
    </div>
  );
}
