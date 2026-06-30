import { LemmaClient } from "lemma-sdk";

const token = import.meta.env.VITE_LEMMA_TOKEN;
if (typeof window !== "undefined") {
  if (window.location.hostname.endsWith(".apps.lemma.work")) {
    localStorage.removeItem("lemma_token");
  } else if (token) {
    localStorage.setItem("lemma_token", token);
  }
}



export const client = new LemmaClient();


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

const nodeAgentMap: Record<string, string> = {
  a1_input_handler: "A1",
  a2_legal_cleaner: "A2",
  a3_entity_extractor: "A3",
  a4_validator: "A4",
  a4_resume_validator: "A4",
  a5_law_router: "A5",
  a6_doc_builder: "A6",
  a7_qc_guard: "A7",
};

export async function startPipeline(
  rawInput: string,
  documentType: string,
  offenceDate: string
): Promise<string> {
  // 1. Create workflow run
  const run = await client.workflows.runs.create("vaaddoc_draft_pipeline");
  if (!run.id) {
    throw new Error("Failed to create workflow run.");
  }

  // 2. Submit initial intake form
  await client.workflows.runs.submitForm(run.id, {
    node_id: "intake",
    inputs: {
      raw_input: rawInput,
      document_type: documentType,
      offence_date: offenceDate || "",
      session_id: run.id,
    },
  });

  return run.id;
}

export function pollRunStatus(
  runId: string,
  onUpdate: (agent: string, status: string, progress: number, message: string) => void,
  onComplete: (result: PipelineResult) => void,
  onNeedsInput: (questions: Question[]) => void,
  onError: (error: string) => void
) {
  let isStopped = false;
  let wasWaiting = false;

  const check = async () => {
    if (isStopped) return;
    try {
      const run = await client.workflows.runs.get(runId);
      const runStatus = run.status?.toUpperCase() || "RUNNING";

      if (runStatus === "COMPLETED") {
        isStopped = true;
        const ctx = run.execution_context || {};
        const qc = ctx.a7_qc_guard || {};
        const builder = ctx.a6_doc_builder || {};
        const router = ctx.a5_law_router || {};
        const validator = ctx.a4_resume_validator || ctx.a4_validator || {};

        const result: PipelineResult = {
          docx_url: builder.docx_url || "",
          confidence_score: qc.final_confidence || 1.0,
          source_map: qc.source_map || [],
          qc_flags: qc.flags || [],
          legal_framework: router.framework || "CPC (1908)",
          entities: validator.confirmed_entities || {},
        };
        onComplete(result);
        return;
      }

      if (runStatus === "FAILED") {
        isStopped = true;
        onError(run.error || "Workflow run failed.");
        return;
      }

      if (runStatus === "WAITING" && run.active_wait?.wait_type === "HUMAN") {
        if (!wasWaiting) {
          wasWaiting = true;
          const schema = run.active_wait?.payload?.input_schema as any;
          const properties = schema?.properties || {};
          const questions: Question[] = Object.keys(properties).map((key) => ({
            field: key,
            question: properties[key].title || `Please clarify ${key}`,
            required: schema.required?.includes(key) || false,
          }));
          onNeedsInput(questions);
        }
        return;
      }

      // Reset waiting flag if we transition out of WAITING back to RUNNING
      wasWaiting = false;

      // Default: currently running or pending
      const currentNodeId = run.current_node_id || "a1_input_handler";
      const agent = nodeAgentMap[currentNodeId] || "A1";
      const steps = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
      const idx = steps.indexOf(agent);
      const baseProgress = idx === -1 ? 0 : Math.floor(((idx + 1) / steps.length) * 100);
      const progress = runStatus === "RUNNING" ? Math.max(0, baseProgress - 5) : baseProgress;

      const friendlyMessages: Record<string, string> = {
        A1: "Normalizing input...",
        A2: "Cleaning case notes...",
        A3: "Extracting entities...",
        A4: "Validating inputs...",
        A5: "Determining legal framework...",
        A6: "Assembling document templates...",
        A7: "Conducting source grounding audits...",
      };
      const message = friendlyMessages[agent] || "Processing pipeline...";

      onUpdate(agent, runStatus.toLowerCase(), progress, message);
    } catch (e: any) {
      isStopped = true;
      onError(e.message || "Failed to query workflow run status.");
    }
  };

  // Run immediate first check
  check();

  const timer = setInterval(check, 2000);

  return () => {
    isStopped = true;
    clearInterval(timer);
  };
}

export async function submitClarifications(
  runId: string,
  answers: Record<string, any>
): Promise<void> {
  await client.workflows.runs.submitForm(runId, {
    node_id: "clarifications_node",
    inputs: answers,
  });
}
