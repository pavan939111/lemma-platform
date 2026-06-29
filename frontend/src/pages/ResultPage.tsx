"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { client, type PipelineResult } from "../lib/lemma";
import { Download, AlertTriangle, Scale, Eye, RefreshCw, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

export default function ResultPage() {
  const navigate = useNavigate();
  const { sessionId, rawInput, result, fileName, setResult } = useStore();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || result) return;
    setLoading(true);
    client.workflows.runs.get(sessionId)
      .then((run: any) => {
        const runStatus = run.status?.toUpperCase();
        if (runStatus === "COMPLETED") {
          const ctx = run.execution_context || {};
          const qc = ctx.a7_qc_guard || {};
          const builder = ctx.a6_doc_builder || {};
          const router = ctx.a5_law_router || {};
          const validator = ctx.a4_resume_validator || ctx.a4_validator || {};

          const pipelineResult: PipelineResult = {
            docx_url: builder.docx_url || "",
            confidence_score: qc.final_confidence || 1.0,
            source_map: qc.source_map || [],
            qc_flags: qc.flags || [],
            legal_framework: router.framework || "CPC (1908)",
            entities: validator.confirmed_entities || {},
          };
          setResult(pipelineResult);
        }
      })
      .catch((err: any) => console.error("Failed to load result from run:", err))
      .finally(() => setLoading(false));
  }, [sessionId, result, setResult]);

  if (!sessionId) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-650 mx-auto" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Active Session</h3>
        <p className="text-xs text-slate-400">Start a drafting workflow from the intake page.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 px-4 py-2 rounded-xl transition"
        >
          Go to Input Screen
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-650 mx-auto animate-pulse" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          {loading ? "Loading Results..." : "No Results Ready"}
        </h3>
        <p className="text-xs text-slate-400">
          {loading ? "Fetching drafted document from pipeline..." : "The pipeline has not completed drafting yet."}
        </p>
        {!loading && (
          <button
            onClick={() => navigate("/")}
            className="bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 px-4 py-2 rounded-xl transition"
          >
            Go to Input Screen
          </button>
        )}
      </div>
    );
  }

  const { confidence_score, source_map, qc_flags, legal_framework } = result;
  const safeSourceMap = Array.isArray(source_map) ? source_map : [];
  const safeFlags = Array.isArray(qc_flags) ? qc_flags : [];
  const activeMapping = safeSourceMap.find((m) => m.field === selectedField);
  const activeSourceRef = activeMapping?.source_ref || null;

  const renderHighlightedTranscript = () => {
    if (!activeSourceRef) return <p className="text-xs text-slate-450 whitespace-pre-wrap leading-relaxed">{rawInput}</p>;

    const idx = rawInput.toLowerCase().indexOf(activeSourceRef.toLowerCase());
    if (idx === -1) return <p className="text-xs text-slate-450 whitespace-pre-wrap leading-relaxed">{rawInput}</p>;

    const before = rawInput.substring(0, idx);
    const match = rawInput.substring(idx, idx + activeSourceRef.length);
    const after = rawInput.substring(idx + activeSourceRef.length);

    return (
      <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-sans">
        {before}
        <mark className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/30 font-bold">
          {match}
        </mark>
        {after}
      </p>
    );
  };

  const getFieldFlags = (field: string) => safeFlags.filter((f) => f.field === field);

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.9) return { color: "bg-emerald-950/20 text-emerald-400 border-emerald-800/40", label: "SAFE TO REVIEW & FILE" };
    if (score >= 0.7) return { color: "bg-amber-950/20 text-amber-400 border-amber-800/40", label: "CHECK WARNED FIELDS BEFORE FILING" };
    return { color: "bg-red-950/20 text-red-400 border-red-800/40", label: "MULTIPLE UNVERIFIED ENTITIES" };
  };

  const confidence = getConfidenceLevel(confidence_score);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Action Header Card */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`text-[10px] px-3.5 py-2 rounded-full border ${confidence.color} font-mono font-bold tracking-widest`}>
            {confidence.label} <span className="font-sans ml-1 text-xs">({Math.round(confidence_score * 100)}%)</span>
          </div>
          <span className="bg-[#030712] text-slate-350 border border-slate-800 text-[10px] px-3 py-2 rounded-lg font-bold tracking-widest uppercase flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            {legal_framework}
          </span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate("/")}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl px-4 py-3 text-xs transition font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Draft New
          </button>
          <a
            href={result.docx_url}
            download
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white rounded-xl px-5 py-3 text-xs transition font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg hover:shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            Download Word Plaint
          </a>
        </div>
      </div>

      {/* Split Review Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Drafted Preview (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Draft Document Fields
            </h3>
            <span className="text-[10px] text-slate-505 flex items-center gap-1 font-mono uppercase font-bold text-slate-400">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              INSPECT MAPPINGS
            </span>
          </div>

          <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6 overflow-y-auto max-h-[650px] shadow-2xl relative">
            {/* Blueprint Header */}
            <div className="border-b border-slate-800 pb-4 text-center">
              <div className="flex justify-center mb-2">
                <FileText className="w-8 h-8 text-emerald-500/40" />
              </div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest text-emerald-400">
                IN THE COURT OF THE CIVIL JUDGE (SENIOR DIVISION)
              </h4>
            </div>

            {/* List of drafted parameters */}
            <div className="space-y-4">
              {safeSourceMap.map((item) => {
                const flags = getFieldFlags(item.field);
                const hasFlags = flags.length > 0;
                const isSelected = selectedField === item.field;
                const isUnverified = !item.source_ref;

                return (
                  <div
                    key={item.field}
                    onClick={() => setSelectedField(item.field)}
                    className={`cursor-pointer border rounded-xl p-4 transition duration-300 ${
                      isSelected
                        ? "bg-[#0f1d2a] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                        : isUnverified
                        ? "bg-[#18090f] border-red-950/80 hover:border-red-900/60"
                        : hasFlags
                        ? "bg-[#1a1107] border-amber-950/80 hover:border-amber-900/60"
                        : "bg-[#05070f] border-slate-850 hover:border-slate-750"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-2">
                      <span className={isSelected ? "text-emerald-400" : "text-slate-500"}>
                        {item.field.replace(/_/g, " ")}
                      </span>
                      {isUnverified ? (
                        <span className="text-red-400 flex items-center gap-1 font-mono text-[9px] uppercase font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> UNVERIFIED
                        </span>
                      ) : hasFlags ? (
                        <span className="text-amber-400 flex items-center gap-1 font-mono text-[9px] uppercase font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> FLAG
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-mono text-[9px] uppercase font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GROUNDED
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${item.value ? "text-slate-100 font-medium" : "text-slate-650 italic font-mono"}`}>
                      {item.value || `[${item.field.replace(/_/g, " ").toUpperCase()} details empty]`}
                    </p>

                    {flags.map((flag, idx) => (
                      <div key={idx} className="mt-3 text-[10px] text-amber-500 flex items-start gap-2 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{flag.message}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Source Transcript (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Original Case Notes
            </h3>
            {fileName ? (
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1 bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-900/30">
                📄 Source: {fileName}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1 bg-slate-900/40 px-2.5 py-1 rounded-lg border border-slate-800">
                📝 Typed Notes
              </span>
            )}
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 h-[450px] flex flex-col justify-between shadow-2xl">
            <div className="flex-1 overflow-y-auto pr-1">
              {renderHighlightedTranscript()}
            </div>
            {selectedField && (
              <div className="border-t border-slate-800/80 pt-4 mt-4 bg-[#0b0f19]/50 font-sans">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                  Verbatim Source Segment:
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed pl-2.5 border-l-2 border-emerald-500">
                  {activeSourceRef ? `"${activeSourceRef}"` : "Not present in input transcript. Added during Validator (A4) step."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
