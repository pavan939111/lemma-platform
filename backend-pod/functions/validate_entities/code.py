#input_type_name: ValidateEntitiesRequest
#output_type_name: ValidateEntitiesResponse
#function_name: validate_entities

from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union

class Question(BaseModel):
    field: str
    question: str
    required: bool

class ValidateEntitiesRequest(BaseModel):
    extracted_entities: Any
    document_type: str
    clarification_answers: Optional[Dict[str, Any]] = None
    offence_date: Optional[str] = None

class ValidateEntitiesResponse(BaseModel):
    valid: bool
    confirmed_entities: Dict[str, Any]
    clarification_questions: List[Question]

# Required fields per draft type (A4 map)
REQUIRED_FIELDS_MAP = {
    "civil_plaint": [
        ("plaintiff.name", "What is the plaintiff's name?"),
        ("plaintiff.address", "What is the plaintiff's address?"),
        ("defendant.name", "What is the defendant's name?"),
        ("court.name", "What is the name of the Court?"),
        ("cause_of_action.description", "What is the description of the cause of action?"),
        ("cause_of_action.date", "What was the date of the cause of action?"),
        ("relief_sought", "What is the relief sought?"),
        ("valuation_of_suit", "What is the valuation of the suit for court fee purposes?")
    ],
    "bail_application": [
        ("plaintiff.name", "What is the applicant's name?"),
        ("court.name", "What is the name of the Court?"),
        ("cause_of_action.description", "What are the grounds or facts of arrest?"),
        ("statutory_sections_mentioned", "Which statutory sections apply?")
    ],
    "cheque_notice": [
        ("plaintiff.name", "What is the complainant's name?"),
        ("plaintiff.address", "What is the complainant's address?"),
        ("defendant.name", "What is the accused's name?"),
        ("defendant.address", "What is the accused's address?"),
        ("cheque_dishonour_date", "What was the cheque dishonour date?")
    ]
}

def resolve_nested_val(data: Dict, path: str) -> Any:
    parts = path.split(".")
    curr = data
    for part in parts:
        if not isinstance(curr, dict):
            return None
        curr = curr.get(part)
    return curr

def set_nested_val(data: Dict, path: str, val: Any):
    parts = path.split(".")
    curr = data
    for part in parts[:-1]:
        if part not in curr or not isinstance(curr[part], dict):
            curr[part] = {}
        curr = curr[part]
    curr[parts[-1]] = val

async def validate_entities(ctx: Any, data: ValidateEntitiesRequest) -> ValidateEntitiesResponse:
    raw_entities = data.extracted_entities
    if isinstance(raw_entities, str):
        import json
        import re
        clean_str = raw_entities.strip()
        if clean_str.startswith("```"):
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_str)
            if match:
                clean_str = match.group(1).strip()
        try:
            entities = json.loads(clean_str)
        except Exception as e:
            entities = {"error": f"Failed to parse JSON: {e}", "raw": raw_entities}
    elif isinstance(raw_entities, dict):
        entities = dict(raw_entities)
    else:
        entities = {}

    if not isinstance(entities, dict):
        entities = {"raw": raw_entities}

    if data.offence_date:
        entities["offence_date"] = data.offence_date
    
    # 1. Apply any answers submitted by the user
    if data.clarification_answers:
        for path, val in data.clarification_answers.items():
            if val and str(val).strip():
                set_nested_val(entities, path, val)
                
    # 2. Check for missing required fields
    doc_type = data.document_type
    req_list = REQUIRED_FIELDS_MAP.get(doc_type, [])
    
    questions = []
    for path, q_text in req_list:
        val = resolve_nested_val(entities, path)
        # Empty check: None, empty string, or empty list
        is_empty = False
        if val is None:
            is_empty = True
        elif isinstance(val, str) and not val.strip():
            is_empty = True
        elif isinstance(val, list) and len(val) == 0:
            is_empty = True
            
        if is_empty:
            questions.append(Question(
                field=path,
                question=q_text,
                required=True
            ))
            
    # 3. Determine overall validity
    valid = len(questions) == 0
    return ValidateEntitiesResponse(
        valid=valid,
        confirmed_entities=entities,
        clarification_questions=questions
    )
