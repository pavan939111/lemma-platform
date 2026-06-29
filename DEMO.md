# VaadDoc — Hackathon Demo Video Script & Production Plan
**Role Perspectives: Senior Product Marketing Manager | Demo Video Specialist | Hackathon Judge (Grand Prize Lens)**

---

## 🎬 Production Blueprint & Pacing Overview
* **Target Length:** 3 Minutes (180 Seconds) — The sweet spot for hackathon submissions.
* **Music Track:** Cinematic, driving electronic beat (e.g., "Ambient Cyberpunk Tech") that builds in intensity as the tech demo unfolds.
* **Tone:** Professional, authoritative, visionary, and high-impact.
* **Core Value Prop:** Bridging the massive transition gap from IPC/CrPC to BNS/BNSS for Indian advocates using a deterministic, source-grounded 7-agent pipeline.

---

## 📽️ Scene-by-Scene Script

### SCENE 1: The Hook — The Legal Chaos (0:00 - 0:20)
* **Visuals:** 
  * **[AI Clip - Cinematic]** A dramatic, close-up shot of an Indian advocate's office. Stacks of leather-bound case files, dust floating in the light, and a lawyer typing stressed on a laptop. Lens flares, cinematic shallow depth of field.
  * *Prompt for AI Video Generator:* `Cinematic shot, Indian advocate, stressed typing in dark office filled with legal files, dust motes in light beams, hyper-realistic, 4k, slow zoom-in.`
* **Audio:** 
  * **[SFX]** Low, tense synthesizer drone. Faint sound of typing.
  * **[Voiceover (VO)]** "On July 1st, 2024, India underwent its largest legal reform in a century, replacing the colonial IPC and CrPC with the new BNS and BNSS. For over 1.5 million advocates, this meant instant chaos: manual timeline lookups, complex law-routing, and hours spent drafting."
* **On-Screen Text:** The Great Indian Legal Transition.

---

### SCENE 2: The Solution — VaadDoc (0:20 - 0:45)
* **Visuals:**
  * **[Screen Recording - App UI]** Smooth transition into the VaadDoc Landing/Intake UI. Showing the premium glassmorphic dark theme, with the pulsing "LEMMA.WORK ACTIVE" indicator.
  * **[Visual Effect]** Dynamic zoom in on the input text area. 
* **Audio:**
  * **[Music]** Synthesizer drone breaks. A clean, upbeat, high-tech electronic groove kicks in.
  * **[VO]** "Meet VaadDoc: the agentic legal drafting suite built specifically for Indian advocates. Powered by a deterministic 7-agent pipeline, VaadDoc ingests unstructured client notes, cleans and extracts legal facts, automatically routes the correct legal framework based on the offence date, and outputs court-ready plaints."

---

### SCENE 3: The Tech Stack & Agentic Pipeline (0:45 - 1:15)
* **Visuals:**
  * **[AI/Motion Graphics Animation]** A styled visual diagram of the 7-Agent Grid:
    * `A1 Input Handler` ➔ `A2 Legal Cleaner` ➔ `A3 Entity Extractor` ➔ `A4 Validator Gate` ➔ `A5 Law Router` ➔ `A6 Doc Builder` ➔ `A7 QC Guard`.
  * Highlight the **A4 Validator Gate** pulsing or turning orange.
* **Audio:**
  * **[Music]** The beat drives forward, sounding analytical and precise.
  * **[VO]** "Unlike generic LLM wrappers, VaadDoc is structured as a multi-agent grid. Each agent has a single responsibility. And at the center is our A4 Validator Gate. If the client notes lack critical inputs—like party names or cause of action dates—the pipeline doesn't hallucinate. It pauses, raises a gate, and asks the user for clarifications."

---

### SCENE 4: The Live Demo — Flow & Self-Healing Fallback (1:15 - 2:15)
* **Visuals:**
  * **[Screen Recording - App UI]** 
    1. Paste the Ramesh Gupta case details: *"Ramesh Gupta, Sector 14 Gurgaon, locked out of his property by brother Suresh Gupta on March 15, 2026..."*
    2. Click **Generate** and redirect to `/progress`.
    3. Show the vertical stepper loading. Highlight `A2` and `A3` completing instantly.
    4. *Crucial Narrative Moment:* Highlight the CLI workflow stdout log displaying: `[A2/A3 API Quota Exceeded] Proactively falling back to rule-based cleaner/extractor...`
    5. Show the stepper pausing at `A4 Validator Gate` with the orange **Clarification Required** form appearing.
    6. Fill in the missing answers and click **Resume Execution**.
    7. Watch the stepper proceed cleanly to 100% completion and redirect to `/result`.
* **Audio:**
  * **[VO]** "Watch it in action. We input case notes for a property dispute. As the pipeline runs, we showcase its robustness. Even if Gemini API rate limits are hit, our local rule-based agents automatically take over. The pipeline remains stable. At A4, the gate detects missing details and requests clarification. We input the required facts, resume, and the pipeline completes."

---

### SCENE 5: The Output — Source Grounding & Court-Ready Docs (2:15 - 2:45)
* **Visuals:**
  * **[Screen Recording - Result Page]**
    1. Show the final results page with the Confidence Score badge.
    2. Click on extracted entities to highlight the exact matching text in the client notes transcript (Source Grounding).
    3. Click **Download Word Plaint** and open the generated `.docx` file in Word, scrolling through the perfectly formatted legal document.
* **Audio:**
  * **[VO]** "The result? A 100% source-grounded analysis. By clicking any extracted legal fact, advocates see the exact sentence in the client's notes it was grounded in. No hallucinations, full auditability. In one click, download the court-ready Word Plaint document, formatted strictly according to High Court guidelines."

---

### SCENE 6: The Outro — The Winning Pitch (2:45 - 3:00)
* **Visuals:**
  * **[AI Clip - Futuristic Legal]** An advocate in court robes standing confidently, walking towards a high-tech modern courtroom or office. Bright, warm lighting.
  * *Prompt for AI Video Generator:* `Indian lawyer in court gown walking confidently, modern sleek high-tech office background, warm lighting, volumetric dust rays, cinematic, 4k.`
  * **[App Logo & URL Screen]** Transition to a dark, sleek glassmorphic slide showing:
    * `VaadDoc`
    * `Active on lemma.work`
* **Audio:**
  * **[Music]** Music swells to a grand, triumphant finish.
  * **[VO]** "VaadDoc saves hours of manual drafting, ensures compliance with the new BNS reforms, and operates with absolute local stability. It's not just an assistant—it's the future of Indian advocacy. Deployed and active on lemma.work. Try VaadDoc today."
  * **[SFX]** Clean audio whoosh / chime out.

---

## 🛠️ Post-Production Checklist for Video Specialist
1. **Resolution:** 1080p (1920x1080) at 60 FPS.
2. **Color Correction:** Cool cyan and emerald green tones for the app screenshots to match the VaadDoc dark color scheme; warm golden tones for the AI-generated real-world clips.
3. **Cursor Prominence:** Enable a circular yellow highlight around the mouse cursor for all screen recordings so judges can easily track clicks.
4. **Captions:** Hardcode sleek, bottom-third modern sans-serif captions (e.g., Montserrat or Inter) to allow silent viewing.
