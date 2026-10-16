# Anthropic's Jacobian Lens & arXiv Metadata Leakage

*Date: 2026_07_13 | Sourced by TheFutureLoop (@thefutureloop_co)*

Welcome to FutureLoop. Today we dissect Anthropic's Jacobian Lens research, a critical Nature security audit exposing metadata leakage on arXiv, and Linux VM escape vulnerabilities.

## 🚀 Today's Top Stories

### 1. [Anthropic found a hidden space where Claude puzzles over concepts](https://www.technologyreview.com/2026/07/09/1140293/anthropic-found-a-hidden-space-where-claude-puzzles-over-concepts/)
Anthropic researchers developed the Jacobian Lens tool, revealing that models process logic in linear directions in high-dimensional embedding spaces. This provides a direct path to steering model outputs without fine-tuning.

### 2. [Whoops! Most arXiv papers contain information never meant to be shared](https://www.nature.com/articles/d41586-026-02057-8)
A security audit of 2.7 million preprints published in Nature shows that 88% of submissions containing LaTeX files leak private comments and to-do notes. While actual credential leaks (passwords and API keys) affected ~0.016%, a more alarming finding was that 7,326 preprints contained GPS-tagged images, with spot-checks showing 9 out of 10 pinpointing the author's home address.

### 3. [GhostLock: A 15-year-old stack-UAF in all Linux distributions](https://nebusec.ai/research/ionstack-part-2/)
The disclosure of GhostLock exposes a stack Use-After-Free flaw inside core Linux memory allocators, allowing untrusted local users to escalate privileges to root.

### 4. [Google pays $250K for Linux guest VM escape vulnerability](https://arstechnica.com/security/2026/07/high-severity-guest-vm-escape-is-1-of-2-linux-vulnerabilities-to-surface-this-week/)
A high-payout VM escape bug in Linux kernel virtualization layers allows root access on host nodes, representing a critical security risk for multi-tenant datacenters.

### 5. [The Download: a nuclear landmark, and China eyes Nvidia chips](https://www.technologyreview.com/2026/07/09/1140283/the-download-nuclear-power-milestone-nvidia-china-ai-chips/)
Gray-market leasing channels in Asia continue to secure remote access to Nvidia H100 clusters, highlighting the limits of physical export controls on compute availability.

## 💡 Actionable Takeaway

Always run Google's `arxiv_latex_cleaner` on your source directories and strip EXIF metadata from all images before uploading preprints. This prevents private comments, GPS tags, and credentials from entering public records.

---
*Thanks for reading! Retweet our daily insights on X: [@thefutureloop_co](https://x.com/thefutureloop_co)*
