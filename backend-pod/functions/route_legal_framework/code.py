#input_type_name: RouteFrameworkRequest
#output_type_name: RouteFrameworkResponse
#function_name: route_legal_framework

from datetime import datetime, date
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class RouteFrameworkRequest(BaseModel):
    offence_date: Optional[str]
    document_type: str
    extracted_sections: List[str]

class MappedSection(BaseModel):
    offence: str
    ipc: str
    bns: str
    crpc: str
    bnss: str
    notes: str

class RouteFrameworkResponse(BaseModel):
    framework: str
    substantive_code: str
    procedural_code: str
    mapped_sections: List[MappedSection]
    transition_warning: Optional[str]

# Static mappings database
SECTION_DATABASE = {
    "302": MappedSection(offence="Murder", ipc="302", bns="103", crpc="—", bnss="—", notes="BNS Section 103 contains punishment for murder."),
    "420": MappedSection(offence="Cheating", ipc="420", bns="318", crpc="—", bnss="—", notes="BNS Section 318(4) replaces IPC Section 420 for cheating."),
    "506": MappedSection(offence="Criminal Intimidation", ipc="506", bns="351", crpc="—", bnss="—", notes="BNS Section 351 replaces IPC Section 506."),
    "379": MappedSection(offence="Theft", ipc="379", bns="303", crpc="—", bnss="—", notes="BNS Section 303 replaces IPC 379."),
    "323": MappedSection(offence="Voluntarily Causing Hurt", ipc="323", bns="115", crpc="—", bnss="—", notes="BNS Section 115 replaces IPC 323."),
    "498a": MappedSection(offence="Cruelty by Husband", ipc="498A", bns="85", crpc="—", bnss="—", notes="BNS Section 85 replaces IPC 498A."),
    "406": MappedSection(offence="Criminal Breach of Trust", ipc="406", bns="316", crpc="—", bnss="—", notes="BNS Section 316 replaces IPC 406."),
    "376": MappedSection(offence="Rape", ipc="376", bns="64", crpc="—", bnss="—", notes="BNS Section 64 replaces IPC 376."),
    "307": MappedSection(offence="Attempt to Murder", ipc="307", bns="109", crpc="—", bnss="—", notes="BNS Section 109 replaces IPC 307."),
    "138": MappedSection(offence="Cheque Dishonour", ipc="138 NI Act", bns="138 NI Act", crpc="—", bnss="—", notes="Negotiable Instruments Act is unchanged by the transition."),
    "bail": MappedSection(offence="Regular Bail", ipc="—", bns="—", crpc="437", bnss="479", notes="BNSS Section 479 covers bail conditions."),
    "anticipatory_bail": MappedSection(offence="Anticipatory Bail", ipc="—", bns="—", crpc="438", bnss="482", notes="BNSS Section 482 replaces CrPC 438."),
    "default_bail": MappedSection(offence="Default Remand Bail", ipc="—", bns="—", crpc="167(2)", bnss="187", notes="BNSS Section 187 extends initial police custody limit up to 15 days within first 40/60 days.")
}

TRANSITION_DATE = date(2024, 7, 1)

async def route_legal_framework(ctx: Any, data: RouteFrameworkRequest) -> RouteFrameworkResponse:
    # 1. Determine timeline framework
    offence_dt = None
    if data.offence_date:
        try:
            offence_dt = datetime.strptime(data.offence_date, "%Y-%m-%d").date()
        except Exception:
            try:
                offence_dt = datetime.strptime(data.offence_date, "%d/%m/%Y").date()
            except Exception:
                pass

    framework = "IPC (1860) & CrPC (1973)"
    sub_code = "IPC"
    proc_code = "CrPC"
    warning = None

    if data.document_type == "civil_plaint":
        framework = "Code of Civil Procedure (CPC 1908)"
        sub_code = "CPC"
        proc_code = "CPC"
    elif data.document_type == "cheque_notice":
        framework = "Negotiable Instruments Act (NI Act 1881)"
        sub_code = "NI Act"
        proc_code = "CrPC"
    elif offence_dt:
        if offence_dt >= TRANSITION_DATE:
            framework = "BNS (2023) & BNSS (2023)"
            sub_code = "BNS"
            proc_code = "BNSS"
            
        # Transition date straddle check (60 days boundary)
        diff_days = abs((offence_dt - TRANSITION_DATE).days)
        if diff_days <= 60:
            warning = f"Straddle Warning: Offence date is within {diff_days} days of July 1, 2024 boundary. Verify exact filing status."

    # 2. Extract matched sections from sections database
    mapped = []
    for raw_sec in data.extracted_sections:
        clean_sec = raw_sec.lower().replace("section", "").strip()
        matched = None
        for key, val in SECTION_DATABASE.items():
            if key in clean_sec:
                matched = val
                break
        if matched:
            mapped.append(matched)

    return RouteFrameworkResponse(
        framework=framework,
        substantive_code=sub_code,
        procedural_code=proc_code,
        mapped_sections=mapped,
        transition_warning=warning
    )
