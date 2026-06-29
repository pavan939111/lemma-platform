# VaadDoc Native Lemma Pod

This directory represents the native **Lemma Pod Bundle** for the VaadDoc 7-agent legal document drafting and transition routing pipeline.

## Structure
- `tables/`: Relational datastore schemas for sessions, cases, and calculated deadlines.
- `agents/`: LLM prompt instructions (A2 Cleaner, A3 Extractor) powered by Gemini 2.5 Flash.
- `functions/`: Python execution scripts (A1, A4, A5, A6, A7) running deterministically in the Lemma runner.
- `workflows/`: The orchestrator graph mapping the complete flow.

## Deployment
Validate and deploy the bundle onto `lemma.work` using the `lemma` CLI:
```bash
lemma pods import . --dry-run
lemma pods import .
```
