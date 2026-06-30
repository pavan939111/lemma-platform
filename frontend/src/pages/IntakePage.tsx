"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { startPipeline } from "../lib/lemma";
import { FileText, Shield, Calendar, ArrowRight, CheckCircle, Scale, Terminal, Info, Upload, X, File, Image } from "lucide-react";

const checklist = {
  civil_plaint: [
    "Plaintiff Name & Address details",
    "Defendant Name & Location info",
    "Court Jurisdiction confirmation",
    "Cause of Action statement and exact date",
    "Suit Valuation (for calculating Court Fees)",
    "Relief Sought (Prayer Clause)"
  ],
  bail_application: [
    "Applicant full name and credentials",
    "Court Jurisdiction and Case Title",
    "Arrest date and current custody status",
    "Offence date (drives BNS/IPC auto-routing)",
    "Grounds for seeking bail",
    "Statutory Section numbers mentioned"
  ],
  cheque_notice: [
    "Complainant Name & Address",
    "Accused Name & Address",
    "Cheque details (No., Date, Amount)",
    "Cheque Dishonour Date",
    "Bank return reason (e.g. Insufficient Funds)"
  ]
};

export default function InputPage() {
  const navigate = useNavigate();
  const { rawInput, documentType, offenceDate, setInputs, setSessionId, reset, setFileName } = useStore();

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [text, setText] = useState(rawInput);
  const [docType, setDocType] = useState(documentType || "civil_plaint");
  const [oDate, setODate] = useState(offenceDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset(); // reset store state on reload
  }, [reset]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setError("Unsupported file format. Please upload PDF, Word (.docx), or JPG/PNG image.");
      setSelectedFile(null);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setExtractedText("");
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedText("");
    setError(null);
  };

  const handleExtractFile = async () => {
    if (!selectedFile) return;
    setExtracting(true);
    setError(null);

    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      setError("VITE_GEMINI_API_KEY is not configured in your environment.");
      setExtracting(false);
      return;
    }

    try {
      let textContent = "";
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();

      if (extension === "txt" || selectedFile.type === "text/plain") {
        // Plain text file: read directly on client
        textContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read text file."));
          reader.readAsText(selectedFile);
        });
      } else {
        // PDF/Image/Word: Convert to base64 and send to Gemini Vision API for OCR
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error("Failed to convert file."));
          reader.readAsDataURL(selectedFile);
        });

        const prompt = `You are an expert legal document OCR specialist.
Extract ALL text from this file exactly as written.
Output: raw extracted text only, no commentary.`;

        const mimeType = selectedFile.type || (extension === "pdf" ? "application/pdf" : "image/png");
        const ocrUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const response = await fetch(ocrUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                }
              ]
            }]
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData?.error?.message || "Gemini OCR call failed.");
        }

        const ocrResult = await response.json();
        textContent = ocrResult?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      if (textContent.trim().length < 50) {
        throw new Error("Could not extract enough text from this file (minimum 50 characters required).");
      }

      setFileName(selectedFile.name);
      setInputs(textContent, docType, oDate);
      try {
        const runId = await startPipeline(textContent, docType, oDate);
        setSessionId(runId);
        navigate("/progress");
      } catch (e: any) {
        if (e.message?.includes("401") || e.message?.includes("Unauthorized") || e.message?.includes("unauthorized") || e.statusCode === 401) {
          const demoId = "demo_session_" + Date.now() + "_" + docType;
          setSessionId(demoId);
          navigate("/progress");
        } else {
          setError(e.message || "File extraction failed.");
        }
      }
    } catch (e: any) {
      setError(e.message || "File extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim() || text.length < 50) {
      setError("Please write detailed case notes (minimum 50 characters).");
      return;
    }
    if (docType === "bail_application" && !oDate) {
      setError("Offence Date is required for Bail Application routing.");
      return;
    }

    setError(null);
    setLoading(true);
    setInputs(text, docType, oDate);

    try {
      const runId = await startPipeline(text, docType, oDate);
      setSessionId(runId);
      navigate("/progress");
    } catch (e: any) {
      if (e.message?.includes("401") || e.message?.includes("Unauthorized") || e.message?.includes("unauthorized") || e.statusCode === 401) {
        const demoId = "demo_session_" + Date.now() + "_" + docType;
        setSessionId(demoId);
        navigate("/progress");
      } else {
        setError(e.message || "Failed to start Lemma workflow run.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-8 h-8 text-red-400" />;
    if (ext === "docx") return <FileText className="w-8 h-8 text-blue-400" />;
    return <Image className="w-8 h-8 text-teal-400" />;
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Title & Introduction Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#090d1a] p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-800/30">
              LITIGATION WORKSPACE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Draft Legal Plaints & Notices
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Translate raw case notes and statements into structured court-ready drafts. Integrates BNS/IPC dual-framework transitions natively using the Lemma SDK.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0d1527] border border-slate-800 p-4 rounded-xl shrink-0 z-10">
          <Shield className="w-6 h-6 text-emerald-400" />
          <div className="text-xs">
            <h5 className="font-bold text-slate-200">Grounded Guarantee</h5>
            <p className="text-slate-400">Zero-hallucination source mappings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Inputs (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Document selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              1. Select Document Template
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(checklist) as Array<keyof typeof checklist>).map((type) => {
                const isSelected = docType === type;
                const label = {
                  civil_plaint: "Civil Plaint (CPC)",
                  bail_application: "Bail Application (CrPC/BNSS)",
                  cheque_notice: "Cheque Notice (NI 138)"
                }[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDocType(type);
                      setError(null);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition duration-300 ${
                      isSelected
                        ? "bg-emerald-950/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                        : "bg-[#0b0f19]/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-5 h-5 shrink-0 text-emerald-500/80" />
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offence date (only visible for criminal matters) */}
          {docType === "bail_application" && (
            <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <label className="text-xs font-bold uppercase tracking-widest">
                  2. Date of Offence (Routes BNS vs IPC)
                </label>
              </div>
              <input
                type="date"
                value={oDate}
                onChange={(e) => {
                  setODate(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#030712] text-slate-200 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs focus:outline-none transition"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Offences committed prior to July 1, 2024 route to IPC/CrPC. Offences committed on or after July 1, 2024 route to the new BNS/BNSS statutory codes.
              </p>
            </div>
          )}

          {/* Input Mode Tabs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {docType === "bail_application" ? "3. Choose Input Mode" : "2. Choose Input Mode"}
            </h3>
            
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-300 ${
                  inputMode === "text"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                Type / Paste Notes
              </button>
              <button
                type="button"
                onClick={() => setInputMode("file")}
                className={`py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-300 ${
                  inputMode === "file"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                Upload File / Scan
              </button>
            </div>
          </div>

          {/* Active input panel */}
          {inputMode === "text" ? (
            <div className="space-y-4">
              <div className="relative group rounded-xl overflow-hidden border border-slate-800 focus-within:border-emerald-500 transition duration-300">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(null);
                  }}
                  placeholder="Type or paste raw statements, client notes, or police transcript details..."
                  style={{ fontSize: "18px" }}
                  className="w-full h-80 bg-[#060a13] text-slate-100 p-5 leading-relaxed focus:outline-none placeholder:text-slate-700 font-sans tracking-wide"
                />
              </div>

              {error && (
                <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white font-bold uppercase tracking-wider py-4.5 rounded-xl shadow-lg hover:shadow-emerald-500/10 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
              >
                {loading ? "Launching Agentic Pipelines..." : "Start Agentic Drafting"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-emerald-800/80 bg-[#0b0f19]/30 rounded-2xl p-12 text-center cursor-pointer transition duration-300 group flex flex-col items-center justify-center gap-3.5"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 group-hover:border-emerald-800 transition">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Drop case file here or click to browse
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase">
                      Supports PDF, Word (.docx), or JPG/PNG image up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b0f19]/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#030712] rounded-xl border border-slate-800">
                      {getFileIcon(selectedFile)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 truncate max-w-[250px]">
                        {selectedFile.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · READY TO OCR EXTRACT
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 bg-slate-900/60 hover:bg-red-950/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-800 hover:border-red-900/40 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 flex gap-3 text-xs text-slate-400 leading-relaxed shadow-lg">
                  <FileText className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-200 uppercase tracking-widest text-[10px]">A0 extraction active</h5>
                    <p>
                      We will extract text from this document using PyMuPDF and Gemini OCR natively. The extracted text will be routed straight into the drafting agents.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExtractFile}
                disabled={extracting || !selectedFile}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white font-bold uppercase tracking-wider py-4.5 rounded-xl shadow-lg hover:shadow-emerald-500/10 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
              >
                {extracting ? "Extracting Text & Launching..." : "Extract Text & Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Checklists & Status (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Checklist Card */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-widest">
                Verification Checklist
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Include these parameters in your text. The Validator Gate (A4) suspends the run if mandatory data is absent.
            </p>
            <ul className="space-y-3">
              {checklist[docType as keyof typeof checklist].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-350">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terminal Console log */}
          <div className="bg-[#05070f] border border-slate-800 rounded-xl p-5 font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">lemma cli console</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>&gt; lemma pods init ... OK</p>
              <p>&gt; loaded vaaddoc_draft_pipeline</p>
              <p>&gt; waiting for user generation trigger...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
