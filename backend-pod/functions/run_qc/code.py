#input_type_name: RunQCRequest
#output_type_name: RunQCResponse
#function_name: run_qc

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import difflib
from lemma_sdk import FunctionContext, Pod

class Flag(BaseModel):
    field: str
    severity: str  # HIGH, MEDIUM, LOW
    message: str

class SourceMapRef(BaseModel):
    field: str
    value: str
    source_ref: Optional[str]

class Deadline(BaseModel):
    title: str
    basis: str
    target_date: str
    days_remaining: int

class RunQCRequest(BaseModel):
    entities: Dict[str, Any]
    cleaned_transcript: str
    document_type: str
    legal_framework: str
    session_id: str
    docx_url: str

class RunQCResponse(BaseModel):
    final_confidence: float
    source_map: List[SourceMapRef]
    flags: List[Flag]
    deadlines: List[Deadline]
    ok: bool

def fuzzy_grounding_match(val: str, source_ref: str, transcript: str) -> bool:
    """Fuzzy checks if the source_ref is contained within the raw/cleaned case text."""
    if not source_ref or not source_ref.strip():
        return False
    if source_ref.lower() in transcript.lower():
        return True
    
    # Token-ratio matching fallback
    words_ref = source_ref.lower().split()
    words_transcript = transcript.lower().split()
    matched_count = sum(1 for w in words_ref if w in words_transcript)
    if len(words_ref) > 0 and (matched_count / len(words_ref)) >= 0.75:
        return True
        
    return False

def resolve_nested(data: Dict, path: str) -> Any:
    parts = path.split(".")
    curr = data
    for part in parts:
        if not isinstance(curr, dict):
            return None
        curr = curr.get(part)
    return curr

def calculate_deadlines(entities: Dict, doc_type: str) -> List[Deadline]:
    deadlines = []
    
    # Limitation timeline
    coa = entities.get("cause_of_action", {})
    coa_date_str = coa.get("date")
    if coa_date_str:
        try:
            coa_date = datetime.strptime(coa_date_str, "%d/%m/%Y").date()
        except Exception:
            try:
                coa_date = datetime.strptime(coa_date_str, "%Y-%m-%d").date()
            except Exception:
                coa_date = None
        
        if coa_date:
            if doc_type == "civil_plaint":
                target = coa_date + timedelta(days=3*365) # 3 years
                deadlines.append(Deadline(
                    title="CPC Plaint Limitation Period",
                    basis="3 years from cause of action (Limitation Act 1963 Schedule Article 113)",
                    target_date=target.strftime("%d/%m/%Y"),
                    days_remaining=(target - datetime.now().date()).days
                ))
                
    # Cheque Notice timelines
    dishonour_date_str = entities.get("cheque_dishonour_date")
    if dishonour_date_str and doc_type == "cheque_notice":
        try:
            dishonour_date = datetime.strptime(dishonour_date_str, "%d/%m/%Y").date()
        except Exception:
            try:
                dishonour_date = datetime.strptime(dishonour_date_str, "%Y-%m-%d").date()
            except Exception:
                dishonour_date = None
                
        if dishonour_date:
            target_notice = dishonour_date + timedelta(days=30)
            deadlines.append(Deadline(
                title="Cheque Notice Issuance Window",
                basis="30 days from dishonour under NI Act Section 138",
                target_date=target_notice.strftime("%d/%m/%Y"),
                days_remaining=(target_notice - datetime.now().date()).days
            ))
            
    # Default bail timelines
    offence_date_str = entities.get("offence_date")
    if offence_date_str and doc_type == "bail_application":
        try:
            offence_date = datetime.strptime(offence_date_str, "%d/%m/%Y").date()
        except Exception:
            try:
                offence_date = datetime.strptime(offence_date_str, "%Y-%m-%d").date()
            except Exception:
                offence_date = None
                
        if offence_date:
            # Default bail threshold dates from arrest/offence
            target_default = offence_date + timedelta(days=60)
            deadlines.append(Deadline(
                title="BNSS/CrPC Default Bail Window",
                basis="60 days threshold for minor offence custody",
                target_date=target_default.strftime("%d/%m/%Y"),
                days_remaining=(target_default - datetime.now().date()).days
            ))

    return deadlines

async def run_qc(ctx: FunctionContext, data: RunQCRequest) -> RunQCResponse:
    entities = data.entities
    transcript = data.cleaned_transcript
    doc_type = data.document_type
    
    # 1. Grounding check of mapped fields
    source_map = []
    flags = []
    
    fields_to_check = [
      ("plaintiff.name", "plaintiff.source_ref"),
      ("plaintiff.address", "plaintiff.source_ref"),
      ("defendant.name", "defendant.source_ref"),
      ("defendant.address", "defendant.source_ref"),
      ("court.name", "court.source_ref"),
      ("cause_of_action.description", "cause_of_action.source_ref"),
      ("cause_of_action.date", "cause_of_action.source_ref"),
      ("valuation_of_suit", "cause_of_action.source_ref")
    ]
    
    grounded_count = 0
    checked_count = 0
    
    for val_path, ref_path in fields_to_check:
        val = resolve_nested(entities, val_path)
        ref = resolve_nested(entities, ref_path)
        
        if val:
            checked_count += 1
            source_map.append(SourceMapRef(
                field=val_path,
                value=str(val),
                source_ref=ref
            ))
            
            # Grounding trace check
            if not ref or not fuzzy_grounding_match(str(val), ref, transcript):
                flags.append(Flag(
                    field=val_path,
                    severity="HIGH",
                    message=f"Value '{val}' in field '{val_path}' cannot be verified from case notes."
                ))
            else:
                grounded_count += 1
        else:
            # Null audit check
            flags.append(Flag(
                field=val_path,
                severity="MEDIUM",
                message=f"Field '{val_path}' is empty in the document. Fill before filing."
            ))
            
    # 2. Score confidence
    base_confidence = grounded_count / max(checked_count, 1)
    
    high_count = sum(1 for f in flags if f.severity == "HIGH")
    med_count = sum(1 for f in flags if f.severity == "MEDIUM")
    
    final_confidence = base_confidence - (0.15 * high_count) - (0.05 * med_count)
    final_confidence = max(min(final_confidence, 1.0), 0.0)
    
    # 3. Calculate deadlines
    deadlines = calculate_deadlines(entities, doc_type)
    
    # 4. Save deadlines to Lemma tables if pod configured
    pod = Pod.from_env()
    if pod:
        try:
            for dl in deadlines:
                pod.records.create("deadlines", {
                    "case_id": data.session_id,
                    "title": dl.title,
                    "basis": dl.basis,
                    "target_date": dl.target_date,
                    "days_remaining": dl.days_remaining
                })
        except Exception:
            pass

    return RunQCResponse(
        final_confidence=final_confidence,
        source_map=source_map,
        flags=flags,
        deadlines=deadlines,
        ok=True
    )
