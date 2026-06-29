import { create } from "zustand";

export interface Question {
  field: string;
  question: string;
  required: boolean;
}

export interface Flag {
  field: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

export interface SourceMapRef {
  field: string;
  value: string;
  source_ref: string | null;
}

export interface PipelineResult {
  docx_url: string;
  confidence_score: number;
  source_map: SourceMapRef[];
  qc_flags: Flag[];
  legal_framework: string;
  entities: Record<string, any>;
}

interface VaadDocState {
  rawInput: string;
  documentType: string;
  offenceDate: string;
  sessionId: string | null;
  status: "idle" | "running" | "needs_input" | "complete" | "failed";
  currentAgent: string | null;
  progress: number;
  message: string;
  clarificationQuestions: Question[];
  result: PipelineResult | null;
  fileName: string | null;

  setInputs: (rawInput: string, documentType: string, offenceDate: string) => void;
  setSessionId: (id: string | null) => void;
  updateStatus: (agent: string, status: any, message: string) => void;
  setClarifications: (questions: Question[]) => void;
  setResult: (res: PipelineResult) => void;
  setFileName: (name: string | null) => void;
  reset: () => void;
}

const steps = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];

const getProgressPercentage = (agent: string, status: string): number => {
  if (status === "complete" && agent === "A7") return 100;
  const idx = steps.indexOf(agent);
  if (idx === -1) return 0;
  const base = Math.floor(((idx + 1) / steps.length) * 100);
  return status === "running" ? base - 5 : base;
};

export const useStore = create<VaadDocState>((set) => ({
  rawInput: "",
  documentType: "civil_plaint",
  offenceDate: "",
  sessionId: null,
  status: "idle",
  currentAgent: null,
  progress: 0,
  message: "",
  clarificationQuestions: [],
  result: null,
  fileName: null,

  setInputs: (rawInput, documentType, offenceDate) =>
    set({ rawInput, documentType, offenceDate }),
  setSessionId: (sessionId) => set({ sessionId }),
  updateStatus: (agent, status, message) =>
    set(() => {
      const isComplete = agent === "A7" && status === "complete";
      return {
        currentAgent: agent,
        status: isComplete ? "complete" : status,
        progress: getProgressPercentage(agent, status),
        message: message || `${agent} is ${status}...`,
      };
    }),
  setClarifications: (clarificationQuestions) =>
    set({ clarificationQuestions, status: "needs_input" }),
  setResult: (result) => set({ result, status: "complete", progress: 100 }),
  setFileName: (fileName) => set({ fileName }),
  reset: () =>
    set({
      sessionId: null,
      status: "idle",
      currentAgent: null,
      progress: 0,
      message: "",
      clarificationQuestions: [],
      result: null,
      fileName: null,
    }),
}));
