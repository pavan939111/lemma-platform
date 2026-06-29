# VaadDoc — End-to-End Use Case Testing Guide

This guide contains structured, step-by-step use cases to demonstrate and verify the core capabilities of VaadDoc running natively on **Lemma Cloud**.

---

## 📋 Prerequisites
*   Ensure you have a modern web browser.
*   Open the live workspace: 👉 **[https://vaaddoc-frontend.apps.lemma.work](https://vaaddoc-frontend.apps.lemma.work)**
*   Make sure you are logged into your Lemma Cloud console in the same browser session.

---

## 🏛️ Use Case 1: Civil Plaint (CPC) & Human-in-the-Loop Validation

### Objective
Verify that the pipeline cleans input facts, extracts civil suit parameters, suspends execution at the **A4 Validator Gate** for a missing parameter (`valuation_of_suit`), resumes upon lawyer input, compiles the Word draft, and displays the source citation highlight.

### Step-by-Step Test Procedure
1.  Open the website: **[https://vaaddoc-frontend.apps.lemma.work](https://vaaddoc-frontend.apps.lemma.work)**
2.  Select **Civil Plaint (CPC)** tab under **1. Select Document Template**.
3.  Under the **Intake Mode**, choose **Text Input** and paste the following case notes:
    ```text
    Client: Ramesh Gupta, S/o Mohan Gupta, Sector 14, Gurgaon, Haryana.
    His brother Suresh Gupta, S/o Mohan Gupta, Plot 12, DLF Phase 2, Gurgaon locked
    him out of Plot 44B, Sector 14 on March 15, 2026 without any legal right.
    Ramesh has the original registered sale deed from 1987 in his name.
    He wants possession restored and damages of Rs. 20 lakhs.
    Court: District Court, Gurgaon.
    ```
4.  Click **"Start Agentic Drafting"**.
5.  You will be automatically redirected to the **Live Progress** page (`/progress`).
    *   Observe **A1** (Input Handler), **A2** (Cleaner), and **A3** (Entity Extractor) completing in succession.
6.  When the pipeline reaches **A4 Validator Gate**, the pipeline will enter a **WAITING** status.
    *   An inline form titled **"Clarification Required"** will pop up on the screen asking:
        *   *“What is the valuation of the suit for court fee purposes?”*
7.  Type **`2000000`** into the input box and click **"Submit & Resume"**.
8.  The pipeline will resume, run through **A5** (CPC law router), **A6** (Doc Builder compiling the templates), and **A7** (QC grounding checks), then redirect you to the **Result** page (`/result`).

### Verification Checks
*   **Source Citation Highlighting**: Click on **`Plaintiff Name`** or **`Relief Sought`** on the left. The right panel (Original Case Notes) should highlight the corresponding source sentence verbatim.
*   **Download Draft**: Click **"Download Word Plaint"** to verify that the compiled `.docx` file has all Jinja2 placeholders replaced correctly.

---

## ⚖️ Use Case 2: Criminal Bail Application (BNS vs. IPC Law Router)

### Objective
Verify that the pipeline automatically routes sections between the old criminal codes (IPC / CrPC) and the new criminal codes (BNS / BNSS) based on the date of the offense.

### Procedure A: Old Code Routing (Before July 1, 2024)
1.  Go to the home page, select **Bail Application** template.
2.  Paste the following case statement:
    ```text
    Accused: Vikram Singh, arrested on charges of cheating and voluntarily causing hurt on MG Road, Faridabad.
    Complainant: Amit Kumar.
    Court: Sessions Court, Faridabad.
    ```
3.  Pick the Offence Date: **`15/05/2024`** (before the transition boundary).
4.  Click **"Start Agentic Drafting"** and let the pipeline complete.
5.  On the **Result** page:
    *   Verify that **`IPC Sec. 420`** (Cheating) and **`IPC Sec. 323`** (Hurt) are mapped.
    *   Verify that bail is routed under **`CrPC Sec. 437 / 438`** (procedural code).

### Procedure B: New Code Auto-Routing (After July 1, 2024)
1.  Go to the home page, select **Bail Application** template.
2.  Keep the same text, but change the Offence Date to: **`25/11/2025`** (after the transition boundary).
3.  Click **"Start Agentic Drafting"** and let it run.
4.  On the **Result** page:
    *   Verify that the primary charge is routed under **`BNS Sec. 318`** (Cheating) and **`BNS Sec. 115`** (Hurt).
    *   Verify that the procedural bail section is routed under **`BNSS Sec. 479 / 482`**.

---

## 📅 Use Case 3: Cheque Dishonour Notice & Deadlines Severity Alert

### Objective
Verify that cheque dishonour timelines are calculated accurately, displaying appropriate severity alerts based on statutory limits.

### Step-by-Step Test Procedure
1.  Go to the home page, select the **Cheque Dishonour Notice (NI Act)** tab.
2.  Paste the following intake facts:
    ```text
    Complainant: Mehta Enterprises, Gurgaon.
    Accused: Shashi Kapoor, S/o Raj Kapoor, Delhi.
    Shashi issued cheque No. 448291 for Rs. 5 Lakhs dated May 10, 2026.
    The bank returned the cheque dishonoured (insufficiency of funds) with a bank return memo dated June 15, 2026.
    ```
3.  Click **"Start Agentic Drafting"** and let it complete.
4.  Navigate to the **Deadlines Dashboard** (`/deadlines`).
5.  Select the active cheque dishonour session from the Case Directory sidebar.

### Verification Checks
*   **Timelines Calculation**: The statutory limit to issue a demand notice is **30 days** from the bank return memo receipt (`June 15, 2026`). Verify that the dashboard calculates the target date as **`July 15, 2026`**.
*   **Severity Alerts**: Verify that the dashboard accurately reflects color-coded alerts based on the remaining days until the deadline.
