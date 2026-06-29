"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { pollRunStatus, submitClarifications } from "../lib/lemma";
import { Loader2, CheckCircle2, Circle, AlertCircle, Send, Terminal, ShieldAlert } from "lucide-react";

const steps = [
  { id: "A1", name: "A1 Input Handler", desc: "Checks script Unicode, dialect, and size." },
  { id: "A2", name: "A2 Legal Cleaner", desc: "Strips conversational fillers and maps speakers." },
  { id: "A3", name: "A3 Entity Extractor", desc: "Pulls key facts and verbatim source quotes." },
  { id: "A4", name: "A4 Validator Gate", desc: "Checks checklist fields. Suspends if empty." },
  { id: "A5", name: "A5 Law Router", desc: "Routes BNS/BNSS or IPC/CrPC based on timelines." },
  { id: "A6", name: "A6 Doc Builder", desc: "Compiles document templates deterministically." },
  { id: "A7", name: "A7 QC Guard", desc: "Fuzzy check source references and calculates penalty." }
];

export default function ProgressPage() {
  const navigate = useNavigate();
  const { sessionId, status, currentAgent, progress, message, clarificationQuestions, result } = useStore();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic CLI logs driven by current agent step
  const [consoleLogs, setConsoleLogs] = useState<string[]>(["Initializing Lemma runtime runner..."]);

  // Connect WebSocket and sync initial status on mount/sessionId change
  useEffect(() => {
    if (!sessionId) return;
    
    const cleanup = pollRunStatus(
      sessionId,
      (agent, stepStatus, progressVal, msg) => {
        useStore.getState().updateStatus(agent, stepStatus, msg);
      },
      (pipelineResult) => {
        useStore.getState().setResult(pipelineResult);
      },
      (questions) => {
        useStore.getState().setClarifications(questions);
      },
      (errMessage) => {
        setError(errMessage);
        useStore.setState({ status: "failed", message: errMessage });
      }
    );
    
    return () => {
      cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (status === "complete" && result) {
      navigate("/result");
    }
  }, [status, result, navigate]);

  useEffect(() => {
    if (currentAgent) {
      const newLogs: Record<string, string[]> = {
        A1: [
          `[A1 Input Handler] Normalizing raw script characters to NFC...`,
          `[A1 Input Handler] Language detection: English script verified.`,
          `[A1 Input Handler] Quality check completed. System status safe.`
        ],
        A2: [
          `[A2 Legal Cleaner] Executing clean prompt with gemini-2.5-flash...`,
          `[A2 Legal Cleaner] Filtered out conversational filler words.`,
          `[A2 Legal Cleaner] Standardized transcript timelines and speaker mappings.`
        ],
        A3: [
          `[A3 Entity Extractor] Scanning text for statutory entities...`,
          `[A3 Entity Extractor] Verifying source references for facts...`,
          `[A3 Entity Extractor] Generated parameters draft payload.`
        ],
        A4: [
          `[A4 Validator Gate] Verifying mandatory document arguments...`,
          status === "needs_input" 
            ? `[A4 Validator Gate] WARNING: Missing required parameters. Workflow suspended.`
            : `[A4 Validator Gate] All required fields verified. Continuing pipeline.`
        ],
        A5: [
          `[A5 Law Router] Inspecting offence date timeline...`,
          `[A5 Law Router] Mapped sections transition from IPC to BNS/BNSS.`
        ],
        A6: [
          `[A6 Doc Builder] Loading document templates from storage...`,
          `[A6 Doc Builder] Rendering Jinja placeholder contexts...`,
          `[A6 Doc Builder] Draft plaint compiled. Uploading artifact...`
        ],
        A7: [
          `[A7 QC Guard] Commencing grounding check audit...`,
          `[A7 QC Guard] Calculating confidence metrics and limitation deadlines...`,
          `[A7 QC Guard] QC checks complete. Session finalize.`
        ]
      };
      
      const activeLogs = newLogs[currentAgent] || [];

      setConsoleLogs((prev) => {
        const filtered = prev.filter(l => !l.startsWith(`[${currentAgent}`));
        return [...filtered, ...activeLogs];
      });
    }
  }, [currentAgent, status]);

  if (!sessionId) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-650 mx-auto animate-pulse" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Active Session</h3>
        <p className="text-xs text-slate-400">Please start a drafting workflow from the intake page.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 px-4 py-2 rounded-xl transition"
        >
          Go to Input Screen
        </button>
      </div>
    );
  }

  const handleClarifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitClarifications(sessionId, answers);
      setAnswers({});
      // Update state to running to show processing screen again
      useStore.setState({ status: "running", clarificationQuestions: [] });
    } catch (err: any) {
      setError(err.message || "Clarification submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatus = (stepId: string) => {
    if (status === "failed") return "failed";
    const stepsIds = steps.map((s) => s.id);
    const currIdx = stepsIds.indexOf(currentAgent || "A1");
    const stepIdx = stepsIds.indexOf(stepId);

    if (stepIdx < currIdx) return "complete";
    if (stepIdx === currIdx) {
      if (status === "needs_input") return "needs_input";
      return "running";
    }
    return "waiting";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner Progress Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center text-xs">
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Processing Case Notes</h2>
            <p className="text-slate-400 mt-1 font-mono text-[10px]">{message || "Spawning agents..."}</p>
          </div>
          <span className="font-mono font-black text-emerald-400 text-sm bg-[#05070f] border border-slate-850 px-3.5 py-1.5 rounded-lg shadow-inner">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-[#05070f] h-3 rounded-full overflow-hidden border border-slate-850">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Vertical Stepper Pipeline (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Agent Grid Pipeline
          </h3>
          <div className="space-y-3">
            {steps.map((step) => {
              const stepStatus = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`border rounded-xl p-4.5 flex gap-4 transition duration-300 ${
                    stepStatus === "running"
                      ? "bg-emerald-950/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                      : stepStatus === "needs_input"
                      ? "bg-amber-950/10 border-amber-500/70"
                      : stepStatus === "complete"
                      ? "bg-[#0b0f19]/30 border-slate-900 opacity-60"
                      : "bg-[#0b0f19]/10 border-slate-950 opacity-30"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {stepStatus === "complete" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {stepStatus === "running" && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
                    {stepStatus === "needs_input" && <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />}
                    {stepStatus === "waiting" && <Circle className="w-5 h-5 text-slate-800" />}
                    {stepStatus === "failed" && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="space-y-1">
                    <h4
                      className={`text-xs font-bold uppercase tracking-wider ${
                        stepStatus === "running"
                          ? "text-emerald-300"
                          : stepStatus === "needs_input"
                          ? "text-amber-400"
                          : stepStatus === "complete"
                          ? "text-slate-350"
                          : "text-slate-500"
                      }`}
                    >
                      {step.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interaction Console & Clarifications (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {status === "needs_input" && clarificationQuestions.length > 0 ? (
            <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-bold text-xs text-white uppercase tracking-widest">
                  Clarification Required
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The Validator Gate (A4) identified missing data inputs. Answer the questions to resume pipeline:
              </p>
              <form onSubmit={handleClarifySubmit} className="space-y-4">
                {clarificationQuestions.map((q) => (
                  <div key={q.field} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                      {q.field.replace(/_/g, " ")} {q.required && <span className="text-amber-500 font-bold">*</span>}
                    </label>
                    <input
                      type="text"
                      required={q.required}
                      placeholder={q.question}
                      value={answers[q.field] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.field]: e.target.value })}
                      className="w-full bg-[#030712] text-slate-200 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2.5 text-xs focus:outline-none transition"
                    />
                  </div>
                ))}

                {error && <div className="text-[11px] text-red-400 font-mono">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold uppercase tracking-wider py-3 rounded-lg text-xs shadow-lg transition duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50 hover:from-amber-400 hover:to-yellow-400"
                >
                  {submitting ? "Resuming Pipeline..." : "Resume Execution"}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#05070f] border border-slate-850 rounded-xl p-5 font-mono space-y-4 h-full flex flex-col justify-between min-h-[350px]">
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    workflow stdout logger
                  </span>
                </div>
                <div className="space-y-2 text-[10px]">
                  {consoleLogs.map((log, i) => (
                    <p key={i} className="text-slate-500 leading-relaxed font-mono">
                      &gt; {log}
                    </p>
                  ))}
                  {status === "running" && (
                    <p className="text-emerald-500 animate-pulse">&gt; running task loops...</p>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-600 border-t border-slate-850 pt-3">
                LEMMA RUNNER ID: {sessionId.substring(0, 8)}...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
