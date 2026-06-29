#input_type_name: HandleInputRequest
#output_type_name: HandleInputResponse
#function_name: handle_input

import re
import unicodedata
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class HandleInputRequest(BaseModel):
    raw_input: str
    document_type: str
    session_id: str

class HandleInputResponse(BaseModel):
    normalized_text: str
    language: str
    quality_score: float
    ok: bool

async def handle_input(ctx: FunctionContext, data: HandleInputRequest) -> HandleInputResponse:
    # 1. Normalize Unicode (NFC standard)
    normalized = unicodedata.normalize("NFC", data.raw_input)
    
    # 2. Minimum length check
    if len(normalized.strip()) < 50:
        raise ValueError("Input case notes too short (minimum 50 characters required).")
        
    # 3. Detect script/language (mixed-script Hindi/English check)
    has_devanagari = any('\u0900' <= char <= '\u097F' for char in normalized)
    has_english = any('a' <= char.lower() <= 'z' for char in normalized)
    
    language = "English"
    if has_devanagari and has_english:
        language = "Hinglish (Mixed Devanagari/English)"
    elif has_devanagari:
        language = "Hindi"
    
    # 4. Legal keyword density scoring
    keywords = ["possession", "damages", "cheque", "dishonour", "arrest", "bail", "plaintiff", "defendant", "summons", "cpc", "ipc", "bns", "bnss"]
    matched = [kw for kw in keywords if re.search(r'\b' + kw + r'\b', normalized.lower())]
    quality_score = len(matched) / max(len(keywords), 1)

    # 5. Save input text to pod document store
    pod = Pod.from_env()
    try:
        pod.files.write_text(f"/inputs/input_{data.session_id}.txt", normalized)
    except Exception:
        pass # ignore if running without pod credentials configured

    return HandleInputResponse(
        normalized_text=normalized,
        language=language,
        quality_score=quality_score,
        ok=True
    )
