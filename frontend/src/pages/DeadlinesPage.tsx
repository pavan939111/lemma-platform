"use client";

import { client } from "../lib/lemma";
import React, { useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { Clock, Calendar, AlertTriangle, Scale, ShieldAlert } from "lucide-react";

interface Deadline {
  title: string;
  basis: string;
  target_date: string;
  days_remaining: number;
}

const demoCases = [
  {
    id: "case-1",
    name: "Ramesh Gupta vs Suresh Gupta",
    type: "Civil Property Dispute (CPC)",
    date: "15/03/2026",
    deadlines: [
      { title: "Summons Written Statement Deadline", basis: "summons_date + 30 days (summons serviced on March 20, 2026)", target_date: "19/04/2026", days_remaining: -70 },
      { title: "Summons Extension WS Deadline", basis: "summons_date + 90 days maximum limit", target_date: "18/06/2026", days_remaining: -10 },
      { title: "Plaint Limitation Period", basis: "3 years from cause of action (March 15, 2026) under Limitation Act 1963", target_date: "15/03/2029", days_remaining: 990 }
    ]
  },
  {
    id: "case-2",
    name: "State of Haryana vs Amit Kumar",
    type: "Criminal Bail Application (BNSS)",
    date: "05/06/2026",
    deadlines: [
      { title: "Statutory Default Bail (60 Days)", basis: "arrest_date + 60 days (arrested on June 5, 2026) for minor offences", target_date: "04/08/2026", days_remaining: 37 },
      { title: "Statutory Default Bail (90 Days)", basis: "arrest_date + 90 days for major offences (punishable with 10+ years)", target_date: "03/09/2026", days_remaining: 67 }
    ]
  },
  {
    id: "case-3",
    name: "Mehta Enterprises vs Verma Trader",
    type: "Cheque Dishonour Notice (NI Act 138)",
    date: "20/06/2026",
    deadlines: [
      { title: "Demand Notice Issuance Window", basis: "30 days from dishonour date (dishonoured on June 20, 2026)", target_date: "20/07/2026", days_remaining: 22 },
      { title: "Complaint Filing Window", basis: "1 month from cause of action (notice period expiration + 15 days)", target_date: "04/09/2026", days_remaining: 68 }
    ]
  }
];

export default function DeadlinesPage() {
  const { sessionId } = useStore();
  const [casesList, setCasesList] = useState(demoCases);
  const [selectedCaseId, setSelectedCaseId] = useState(demoCases[0].id);
  const [deadlines, setDeadlines] = useState<Deadline[]>(demoCases[0].deadlines);

  // If there is an active session, fetch the deadlines dynamically and add to list
  useEffect(() => {
    if (sessionId) {
      const fetchDeadlines = async () => {
        try {
          const run = await client.workflows.runs.get(sessionId);
          const ctx = run.execution_context || {};
          const qc = ctx.a7_qc_guard || {};
          const runDeadlines = qc.deadlines || [];
          
          if (runDeadlines.length > 0) {
            const activeCase = {
              id: sessionId,
              name: "Active Case Draft",
              type: "Generated Drafted Case",
              date: new Date().toLocaleDateString(),
              deadlines: runDeadlines
            };
            
            setCasesList((prev) => {
              if (prev.some((c) => c.id === sessionId)) return prev;
              return [activeCase, ...prev];
            });
            
            setSelectedCaseId(sessionId);
            setDeadlines(runDeadlines);
          }
        } catch (e) {
          console.error("Error loading dynamic case deadlines", e);
        }
      };
      fetchDeadlines();
    }
  }, [sessionId]);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const matched = casesList.find((c) => c.id === caseId);
    if (matched) {
      setDeadlines(matched.deadlines);
    }
  };

  const getUrgencyClass = (days: number) => {
    if (days < 0) return { bg: "bg-[#090b10] border-slate-900 text-slate-500", badge: "bg-slate-900/60 text-slate-500 border-slate-800", status: "EXPIRED", bar: "bg-slate-800" };
    if (days < 7) return { bg: "bg-[#18090b] border-red-950/80 text-red-400", badge: "bg-red-950/50 text-red-400 border-red-800/40", status: "CRITICAL", bar: "bg-red-500" };
    if (days < 30) return { bg: "bg-[#1a1107] border-amber-950/80 text-amber-400", badge: "bg-amber-950/50 text-amber-400 border-amber-800/40", status: "URGENT", bar: "bg-amber-500" };
    return { bg: "bg-[#071310] border-emerald-950/80 text-emerald-400", badge: "bg-emerald-950/50 text-emerald-400 border-emerald-800/40", status: "SAFE", bar: "bg-emerald-500" };
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Intro banner */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 flex justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
              Statutory Deadlines
            </h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Calculates litigation milestones under the Limitation Act 1963, Code of Civil Procedure (CPC), and Code of Criminal Procedure (BNSS/CrPC) automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Selector (col-span-4) */}
        <div className="md:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Case Directory
          </h3>
          <div className="flex flex-col gap-3">
            {casesList.map((c) => {
              const isSelected = selectedCaseId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className={`w-full text-left p-4.5 rounded-xl border text-xs transition duration-300 ${
                    isSelected
                      ? "bg-emerald-950/20 border-emerald-500 text-emerald-350 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                      : "bg-[#0b0f19]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold uppercase tracking-wider truncate text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1.5 font-mono uppercase tracking-wider">{c.type}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timelines display (col-span-8) */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Statutory Milestones
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">calculated live</span>
          </div>

          <div className="space-y-4">
            {deadlines.map((dl, idx) => {
              const urgency = getUrgencyClass(dl.days_remaining);
              // Percentage calculation for the urgency bar
              const maxDays = dl.title.includes("Limitation") ? 3 * 365 : 90;
              const remaining = Math.max(0, Math.min(dl.days_remaining, maxDays));
              const percentage = Math.round((remaining / maxDays) * 100);

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 md:p-6 flex flex-col gap-4.5 transition duration-300 ${urgency.bg}`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${urgency.badge}`}>
                          {urgency.status}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{dl.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Basis: <span className="text-slate-350 font-medium">{dl.basis}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 ml-0.5 sm:ml-auto">
                      <div className="text-left sm:text-right">
                        <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Filing Deadline</div>
                        <div className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {dl.target_date}
                        </div>
                      </div>
                      <div className="border-l border-slate-800/80 pl-5 text-right">
                        <div className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Remaining</div>
                        <div className="text-xs font-bold font-mono text-slate-200 mt-1">
                          {dl.days_remaining < 0 ? (
                            <span className="text-slate-500">EXPIRED</span>
                          ) : (
                            `${dl.days_remaining} Days`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Urgency Progress Bar */}
                  {dl.days_remaining >= 0 && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-[#05070f] h-1.5 rounded-full overflow-hidden border border-slate-850">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${urgency.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Warning Banner */}
          <div className="bg-[#1a1107] border border-amber-950/80 rounded-xl p-5 flex gap-3 text-xs text-amber-500/90 leading-relaxed shadow-lg">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1 font-sans">
              <h5 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Advocate Disclaimer</h5>
              <p>
                Calculations are provided for drafting reference only under the Limitation Act 1963. Limitation periods vary by state amendments and court calendars. Verify with applicable local High Court Rules or Bar Association schedules before final submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
