# FutureLoop Briefing: Terry Tao's Agent Workflows & SK Hynix's $26.5B IPO

Welcome to FutureLoop. Today we dissect the hands-on coding agent logs of a Fields medalist, the massive capital scaling of the AI chip supply chain, and breakthroughs in genomic neurodegeneration research.

---

## 1. Terry Tao's Coding Agent Logs

*   **Source:** [Terry Tao's Blog](https://terrytao.wordpress.com/2026/07/11/old-and-new-apps-via-modern-coding-agents/)
*   **What happened:** Fields medalist mathematician Terry Tao published detailed logs of his workflows using modern coding agents to write software.
*   **Why it matters:** He noted that while agents excel at generating decoupled helper modules (like math parsers or regular expressions), they quickly lose coherence when editing complex, multi-file codebases in a single shot.
*   **What to do:** Keep your components strictly decoupled. Feed compiler errors and linter outputs directly back to the agent rather than correcting syntax manually.

---

## 2. SK Hynix's $26.5B IPO and US Fabs

*   **Source:** [TechCrunch Hardware](https://techcrunch.com/2026/07/10/sk-hynix-raises-26-5b-in-the-biggest-foreign-ipo-in-us-history-is-urged-to-build-new-us-fabs/)
*   **What happened:** Semiconductor memory giant SK Hynix raised $26.5 billion in a historic U.S. initial public offering.
*   **Why it matters:** Following the listing, U.S. policymakers are actively pressuring the HBM memory leader to construct local fabrication facilities inside the United States.
*   **What to do:** For deep tech builders and investors, monitor fab locations as indicators of high-scale regional hardware clusters over the next decade.

---

## 3. Mapping Spiking Activity in Visual Cortex

*   **Source:** [Cell Journal](https://www.cell.com/cell/fulltext/S0092-8674(26)00745-2?rss=yes)
*   **What happened:** A new computational neuroscience study used Neuropixels probes to map spiking activity across the mouse visual system.
*   **Why it matters:** The study mapped how sensory and motor signals correlate during change-detection tasks, demonstrating that mice detect visual changes using an adaptation-based strategy within a critical time window.
*   **What to do:** Computational neuroscientists can use these public spiking maps to calibrate virtual brain and vision models.

---

## 4. NSF Proposes Chinese Collaboration Ban

*   **Source:** [Science Magazine](https://www.science.org/content/article/new-nsf-policy-would-ban-almost-all-collaborations-chinese-scientists)
*   **What happened:** The U.S. National Science Foundation (NSF) drafted rules proposing a ban on collaborations with most Chinese research institutions.
*   **Why it matters:** This represents a major shift from previous risk-mitigation strategies to outright prohibition, affecting global science funding, co-authored papers, and international lab setups.
*   **What to do:** Academic researchers should audit current co-authorships and international grants to prepare for compliance before the draft becomes binding policy.

---

## 5. Unifying Mutagenesis Shared in Alzheimer's and ALS

*   **Source:** [Cell Journal](https://www.cell.com/cell/fulltext/S0092-8674(26)00700-2?rss=yes)
*   **What happened:** Single-cell whole-genome sequencing identified a shared signature of somatic mutations in ALS, FTD, and Alzheimer's disease brains.
*   **Why it matters:** These mutations are driven by aberrant topoisomerase 1 (TOP1) enzymes linked to oxidative DNA damage. This reveals a unifying mechanism of neuronal genomic instability in neurodegeneration.
*   **What to do:** Drug discovery teams should shift focus toward design of small-molecule TOP1 stabilizers to protect genomic stability rather than targeting downstream protein plaques.

---

## Actionable Takeaway

When building workflows with coding agents, keep modules under 150 lines. Test each module independently, and compile your system using automated integration scripts. Decoupling code prevents context drift in AI model prompts.
