"use client";

import { useState } from "react";
import { Scale, Search, Calendar, ShieldAlert, ArrowRight, BookOpen } from "lucide-react";

interface MappedSection {
  offence: string;
  ipc: string | null;
  bns: string | null;
  crpc: string | null;
  bnss: string | null;
  notes?: string;
}

const SUBSTANTIVE_MAPPINGS = {
  murder: { ipc: "302", bns: "103", desc: "Murder" },
  culpable_homicide: { ipc: "304", bns: "105", desc: "Culpable homicide not amounting to murder" },
  attempt_murder: { ipc: "307", bns: "109", desc: "Attempt to commit murder" },
  rape: { ipc: "376", bns: "64", desc: "Rape" },
  sexual_assault: { ipc: "354", bns: "74", desc: "Assault or criminal force to woman" },
  kidnapping: { ipc: "363", bns: "137", desc: "Kidnapping" },
  theft: { ipc: "378", bns: "303", desc: "Theft" },
  theft_punishment: { ipc: "379", bns: "303", desc: "Punishment for theft" },
  robbery: { ipc: "390", bns: "309", desc: "Robbery" },
  dacoity: { ipc: "391", bns: "310", desc: "Dacoity" },
  cheating: { ipc: "420", bns: "318", desc: "Cheating and dishonestly inducing delivery of property" },
  cheating_general: { ipc: "415", bns: "316", desc: "Cheating" },
  criminal_breach_trust: { ipc: "406", bns: "316", desc: "Criminal breach of trust" },
  cbt_by_public_servant: { ipc: "409", bns: "316", desc: "CBT by public servant" },
  hurt: { ipc: "319", bns: "115", desc: "Hurt" },
  voluntarily_causing_hurt: { ipc: "323", bns: "115", desc: "Voluntarily causing hurt" },
  grievous_hurt: { ipc: "325", bns: "117", desc: "Voluntarily causing grievous hurt" },
  criminal_intimidation: { ipc: "506", bns: "351", desc: "Criminal intimidation" },
  cruelty_husband: { ipc: "498A", bns: "85", desc: "Cruelty by husband or relatives" },
  dowry_death: { ipc: "304B", bns: "80", desc: "Dowry death" },
  mischief: { ipc: "425", bns: "324", desc: "Mischief" },
  wrongful_confinement: { ipc: "340", bns: "126", desc: "Wrongful confinement" },
  wrongful_restraint: { ipc: "339", bns: "125", desc: "Wrongful restraint" },
  assault: { ipc: "351", bns: "130", desc: "Assault" },
  forgery: { ipc: "463", bns: "336", desc: "Forgery" },
  using_forged_document: { ipc: "471", bns: "338", desc: "Using as genuine a forged document" },
  defamation: { ipc: "499", bns: "356", desc: "Defamation" },
  public_nuisance: { ipc: "268", bns: "270", desc: "Public nuisance" },
  sedition: { ipc: "124A", bns: "152", desc: "Acts endangering sovereignty" },
  unlawful_assembly: { ipc: "141", bns: "189", desc: "Unlawful assembly" },
  rioting: { ipc: "146", bns: "191", desc: "Rioting" },
  cheque_dishonour: { ipc: "138 NI Act", bns: "138 NI Act (unchanged)", desc: "Cheque dishonour — NI Act unchanged" }
};

const PROCEDURAL_MAPPINGS = {
  bail: { crpc: "437", bnss: "479", desc: "Bail in bailable and non-bailable offences" },
  anticipatory_bail: { crpc: "438", bnss: "482", desc: "Anticipatory bail" },
  default_bail: { crpc: "167(2)", bnss: "187", desc: "Default bail (remand window)" },
  hc_inherent_powers: { crpc: "482", bnss: "528", desc: "Inherent powers of High Court" },
  appeal_acquittal: { crpc: "378", bnss: "419", desc: "Appeal against acquittal" },
  fir_registration: { crpc: "154", bnss: "173", desc: "FIR registration" },
  remand: { crpc: "167", bnss: "187", desc: "Remand" },
  charge_framing: { crpc: "228", bnss: "251", desc: "Framing of charges" },
  cognizance: { crpc: "190", bnss: "210", desc: "Cognizance of offences" },
  police_custody: { crpc: "167", bnss: "187", desc: "Police custody remand" },
  summons: { crpc: "61", bnss: "64", desc: "Form of summons" },
  warrant: { crpc: "70", bnss: "73", desc: "Form of warrant of arrest" },
  discharge: { crpc: "227", bnss: "250", desc: "Discharge of accused" },
  acquittal: { crpc: "232", bnss: "256", desc: "Acquittal" },
  revision: { crpc: "397", bnss: "438", desc: "Revision" },
  appeal_conviction: { crpc: "374", bnss: "415", desc: "Appeal from conviction" }
};

export default function LawRouterPage() {
  const [offence, setOffence] = useState("");
  const [offenceDate, setOffenceDate] = useState("2026-06-28");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    framework: string;
    matching_sections: MappedSection[];
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offence.trim()) return;

    setLoading(true);
    // Mimic uvicorn sleep briefly for UI feel
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const transitionDate = new Date("2024-07-01");
    const selectedDate = new Date(offenceDate);
    
    let frameworkStr = "IPC (1860) & CrPC (1973)";
    if (selectedDate >= transitionDate) {
      frameworkStr = "BNS (2023) & BNSS (2023)";
    }
    
    const descLower = offence.toLowerCase();
    const matches: MappedSection[] = [];
    
    Object.keys(SUBSTANTIVE_MAPPINGS).forEach(key => {
      if (key.replace(/_/g, " ").includes(descLower) || descLower.includes(key.replace(/_/g, " "))) {
        const m = (SUBSTANTIVE_MAPPINGS as any)[key];
        matches.push({
          offence: m.desc,
          ipc: m.ipc,
          bns: m.bns,
          crpc: null,
          bnss: null
        });
      }
    });

    Object.keys(PROCEDURAL_MAPPINGS).forEach(key => {
      if (key.replace(/_/g, " ").includes(descLower) || descLower.includes(key.replace(/_/g, " "))) {
        const m = (PROCEDURAL_MAPPINGS as any)[key];
        matches.push({
          offence: m.desc,
          ipc: null,
          bns: null,
          crpc: m.crpc,
          bnss: m.bnss
        });
      }
    });

    setResults({
      framework: frameworkStr,
      matching_sections: matches
    });
    setLoading(false);
  };

  const isNearTransition = () => {
    if (!offenceDate) return false;
    const dateObj = new Date(offenceDate);
    const transition = new Date("2024-07-01");
    const diffTime = Math.abs(dateObj.getTime() - transition.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Intro banner */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 md:p-8 flex justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
              Statutory Law Router
            </h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-sans">
            Cross-reference criminal sections instantly. Automatically map old IPC/CrPC sections to BNS/BNSS codes depending on the date of offence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Search Form (col-span-4) */}
        <div className="lg:col-span-4 bg-[#0b0f19] border border-slate-800 rounded-xl p-5 space-y-5 h-fit shadow-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Offence Search
          </h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Offence Term
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. cheating, murder, bail"
                  value={offence}
                  onChange={(e) => setOffence(e.target.value)}
                  className="w-full bg-[#030712] text-slate-200 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none transition"
                />
                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Offence Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={offenceDate}
                  onChange={(e) => setOffenceDate(e.target.value)}
                  className="w-full bg-[#030712] text-slate-200 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none transition"
                />
                <Calendar className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !offence.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-605 text-white font-bold uppercase tracking-wider py-3 rounded-lg text-xs shadow-lg transition duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Lookup Mapping"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Side: Terminals (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Mapping Compare Terminals
            </h3>
          </div>

          {results ? (
            <div className="space-y-5">
              {/* Transition Warning */}
              {isNearTransition() && (
                <div className="bg-[#1a1107] border border-amber-950/80 rounded-xl p-5 flex gap-3 text-xs text-amber-500 leading-relaxed shadow-lg">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-amber-400 uppercase tracking-widest text-[11px]">TransitionStraddle alert</h5>
                    <p>
                      This offence date falls within 60 days of the July 1, 2024 boundary. Confirm whether the police registered the FIR under IPC or BNS, as remand rules (CrPC 167 vs BNSS 187) may straddle the change.
                    </p>
                  </div>
                </div>
              )}

              {/* Active framework */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Applicable statutory code:</span>
                <span className="bg-emerald-950/20 text-emerald-400 border border-emerald-800/40 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold">
                  {results.framework}
                </span>
              </div>

              {results.matching_sections.length > 0 ? (
                <div className="space-y-4">
                  {results.matching_sections.map((sec, idx) => (
                    <div key={idx} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 space-y-5 shadow-2xl relative">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{sec.offence}</h4>
                      </div>

                      {/* Side by side comparison terminals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        {(sec.bns || sec.ipc) && (
                          <div className="bg-[#05070f] border border-slate-850 rounded-lg p-4 space-y-2">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Substantive Code Mapping</div>
                            <div className="font-bold text-slate-200">
                              {results.framework.includes("BNS") ? (
                                <span className="text-emerald-400">BNS Sec. {sec.bns} <span className="text-[10px] text-slate-500 font-sans block mt-1">(Replaced IPC Sec. {sec.ipc})</span></span>
                              ) : (
                                <span>IPC Sec. {sec.ipc}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {(sec.bnss || sec.crpc) && (
                          <div className="bg-[#05070f] border border-slate-850 rounded-lg p-4 space-y-2">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Procedural Code Mapping</div>
                            <div className="font-bold text-slate-200">
                              {results.framework.includes("BNS") ? (
                                <span className="text-emerald-400">BNSS Sec. {sec.bnss} <span className="text-[10px] text-slate-500 font-sans block mt-1">(Replaced CrPC Sec. {sec.crpc})</span></span>
                              ) : (
                                <span>CrPC Sec. {sec.crpc}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {sec.notes && (
                        <p className="text-[11px] text-slate-450 italic leading-relaxed pl-3 border-l-2 border-slate-800 font-sans">
                          {sec.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0b0f19]/30 border border-slate-850 rounded-xl p-8 text-center text-slate-500 text-xs">
                  No matching statutory offences found in router database. Try search terms like &quot;cheating&quot;, &quot;murder&quot;, or &quot;bail&quot;.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0b0f19]/30 border border-slate-850 rounded-xl p-8 text-center text-slate-500 text-xs">
              Enter offence term and date in the parameters panel to run section lookups.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
