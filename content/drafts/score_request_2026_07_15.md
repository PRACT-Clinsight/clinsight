# Content Scoring Request (2026_07_15)

Please score the following 80 items. Rank each item from 1-10 on:
- **Novelty** (Weight: 20%)
- **Virality** (Weight: 25%)
- **Educational value** (Weight: 20%)
- **Evergreen potential** (Weight: 15%)
- **Business relevance** (Weight: 20%)

Write a JSON block containing the scored items. Format it exactly like this:
```json
{
  "scoredItems": [
    {
      "title": "Item Title",
      "link": "Item URL",
      "source": "Item Source",
      "description": "Description",
      "category": "Category",
      "scores": {
        "novelty": 8,
        "virality": 9,
        "educationalValue": 7,
        "evergreenPotential": 6,
        "businessRelevance": 8
      },
      "explanation": "Explanation here"
    }
  ]
}
```

## Raw Items

### [1] Jurassic Park computers in excruciating detail
- **Link:** https://fabiensanglard.net/jurrasic_park_computers/index.html
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 364 by vinhnx with 86 comments

### [2] RISC-V Is Inevitable: State of the Union Keynote Argues
- **Link:** https://www.eetimes.com/risc-v-is-inevitable-state-of-the-union-keynote-argues/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 39 by signa11 with 13 comments

### [3] I tricked Claude into leaking your deepest, darkest secrets
- **Link:** https://www.ayush.digital/blog/the-memory-heist
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 188 by macleginn with 73 comments

### [4] Vancouver PD website features Quick Escape button that wipes itself from history
- **Link:** https://vpd.ca/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 253 by LookAtThatBacon with 99 comments

### [5] TS-2026-009: Insecure argument handling in Tailscale SSH permitted root access
- **Link:** https://tailscale.com/security-bulletins
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 141 by jervant with 62 comments

### [6] Bonsai 27B: A 27B-Class model that runs on a phone
- **Link:** https://prismml.com/news/bonsai-27b
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 570 by xenova with 206 comments

### [7] Andon (manufacturing)
- **Link:** https://en.wikipedia.org/wiki/Andon_(manufacturing)
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 43 by tony with 8 comments

### [8] The Tower Keeps Rising
- **Link:** https://lucumr.pocoo.org/2026/7/13/the-tower-keeps-rising/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 452 by cdrnsf with 215 comments

### [9] Dependabot version updates introduce default package cooldown
- **Link:** https://github.blog/changelog/2026-07-14-dependabot-version-updates-introduce-default-package-cooldown/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 168 by woodruffw with 107 comments

### [10] Cursor 0day: When Full Disclosure Becomes the Only Protection Left
- **Link:** https://mindgard.ai/blog/cursor-0day-when-full-disclosure-becomes-the-only-protection-left
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 348 by Synthetic7346 with 160 comments

### [11] How I use HTMX with Go
- **Link:** https://www.alexedwards.net/blog/how-i-use-htmx-with-go
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 224 by gnabgib with 55 comments

### [12] Solving 20 Erdős Problems with 20 Codex Accounts Running in Parallel
- **Link:** https://www.starfleetmath.com/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 124 by colin7snyder with 56 comments

### [13] Microsoft has released software updates to plug at least 570 security holes
- **Link:** https://krebsonsecurity.com/2026/07/microsoft-patches-a-record-570-security-flaws/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 115 by robin_reala with 58 comments

### [14] Surprising lessons from my research scientist job search
- **Link:** https://yongzx.github.io/blog/2026/06/24/job-search/
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 7 by gmays with 1 comments

### [15] How to stop Claude from saying load-bearing
- **Link:** https://jola.dev/posts/how-to-stop-claude-from-saying-load-bearing
- **Source:** Hacker News (Tech News & Discussions)
- **Info:** Score: 519 by shintoist with 543 comments

### [16] Discord Server Link
- **Link:** https://www.reddit.com/r/singularity/comments/1tg1y16/discord_server_link/
- **Source:** r/singularity (AI News & Future)
- **Info:** submitted by    /u/DnDNecromantic  
 [link]   [comments]

### [17] Keio University made these soft, helium-filled flying robots; they can follow you, wake you up, remind you of stuff, and even be your study buddy
- **Link:** https://www.reddit.com/r/singularity/comments/1uwc0oi/keio_university_made_these_soft_heliumfilled/
- **Source:** r/singularity (AI News & Future)
- **Info:** from clankr
    submitted by    /u/Distinct-Question-16  
 [link]   [comments]

### [18] Well it finally happened: we’re not using models because of cost
- **Link:** https://www.reddit.com/r/singularity/comments/1uwa1mv/well_it_finally_happened_were_not_using_models/
- **Source:** r/singularity (AI News & Future)
- **Info:** Hey all! 
 I’ve been working for a large company (Fortune 500) for 3 years now. We’re an “AI First” company. When I onboarded it was made explicit to me that it was absolutely imperative that I was not only allowed to use Artificial Intelligence in my work but the expectation was that all my work would involve AI.
 My org was quite serious about the process. For a full year we all had training. Developer, managers, sales people. Everyone was trained on the tooling. We were “full steam ahead”. Everyone was given Copilot and Claude. We had biweekly demos of people sharing use cases for AI in various projects around the company.
 We eventually had a very large project using AI. It was a pilot project to discover a workflow for AI and see what its capabilities were. Unfortunately, the project failed. The project was a rewrite of a legacy application. We asked the Agents to define the rules of the system “as written” by the code. However, the Agents constantly missed small details and had issues just writing a clear specification of the code written. The thinking was the rewrite would be first, essentially using the legacy code to define a specification document for the new system. We couldn’t even get there. The business rules were apparently too complex.
 Nonetheless, leadership’s position was still optimistic. They saw the project as the first step in a series of steps. Our lead architects were to take what they learned and apply that to future opportunities.
 In the meantime, we continued using AI to solve our problems from the day to day. Personally, I kept having mixed results. It was amazing for tiny refactors but for larger things it would just do insane stuff. The most egregious so far was SQL code that was dropping constraints on all the tables the code was doing inserts and deletes into. Which is, special. Of course we have proper dev practices so that code never saw production but it was not uncommon for generated code to sometimes just be weird. 
 Finally, today I find out we’re pulling back on AI. We have lost access to Claude and we’re being told to limit usage because of costs. The company is still encouraging AI usage but we have stopped the training and demos. Our architects have told us to just use older models for tasks. 
 The reason this hit my radar was because Ed Zitron, who has reported extensively on AI has been saying for a while that AI will be in trouble because the costs will be too high and now I’m seeing a lot more conversations about the costs of AI at work.
 If AI is to have any success long term they’re going to need to get the costs down.
    submitted by    /u/BlueAndYellowTowels  
 [link]   [comments]

### [19] Opus 5 Could Be Out As Soon As This Week Per Reliable Leaker On Twitter
- **Link:** https://www.reddit.com/r/singularity/comments/1uwftum/opus_5_could_be_out_as_soon_as_this_week_per/
- **Source:** r/singularity (AI News & Future)
- **Info:** https://x.com/i/status/2077085180175544375
    submitted by    /u/141_1337  
 [link]   [comments]

### [20] Deepmind Internally Delays Gemini 3.5 Pro Again According To Renowned Leaker
- **Link:** https://www.reddit.com/r/singularity/comments/1uwiq9q/deepmind_internally_delays_gemini_35_pro_again/
- **Source:** r/singularity (AI News & Future)
- **Info:** https://x.com/i/status/2077108367299117348
 Apparently delayed all the way until August: 
 https://x.com/i/status/2077109051339469097
    submitted by    /u/141_1337  
 [link]   [comments]

### [21] Differences Between GPT-5.5 Pro and GPT-5.6 Sol on MineBench
- **Link:** https://www.reddit.com/r/singularity/comments/1uwhvws/differences_between_gpt55_pro_and_gpt56_sol_on/
- **Source:** r/singularity (AI News & Future)
- **Info:** Notes
  
Average Inference Time: 25m 16s (1516.2s) 
 GPT-5.5 Pro averaged 21m 23s (1283.3s) for context; so slightly longer inference times
 
 Total Cost (for 15 builds): $710.82 ($47.39 per build) 
 Most expensive model benchmarked to-date; previous was GPT-5.5 Pro at $223.90
 Thanks to all supporters for helping fund the benchmark!
 
  
Subjectively speaking, GPT-5.6 Sol seems to create the most detailed builds MineBench has seen thus far, while for the most part doing so with great creative choices. I think, personally, there are only a handful of builds I would argue are not clear improvements over GPT-5.5 Pro (like the astronaut and worldtree). On average, GPT-5.6 Sol also creates the largest JSON files across all of its builds by a significant portion. 
 That being said, this model was also the most expensive model MineBench has benchmarked to date; the previous most expensive model was GPT-5.5 Pro at $223.90 – so 5.6 Sol totaled to being over 3x as expensive. If you're lucky enough to ignore the cost, then yes, the model created the most detailed generations yet. For example, in its cottage build, it added a scarecrow in the garden, added clothes drying on a rack, etc. Its builds also seemed to have a better sense of scale and proportions overall, like the arcade.
 We might benchmark GPT-5.6 Terra if there's enough interest, as that would technically be a closer comparison to GPT-5.5 (as Sol is technically the successor to GPT-5.5 Pro, which would also explain the cost).
 TLDR: Model is amazing, doesn't tend to be conservative (good or bad depending on your use case), but it's extremely expensive.
 Full release-notes/thoughts on the GitHub release
  
If you enjoy these posts please feel free to help fund the benchmark 
 Sharing the benchmark and starring the Git repository also helps :)
 
  
Benchmark: https://minebench.ai/
 Git Repository: https://github.com/Ammaar-Alam/minebench
 Previous Posts:
  
Comparing Opus 4.8 and Fable 5
 Comparing Opus 4.7 and Opus 4.8
 Comparing GPT 5.4 and GPT 5.5
 Comparing Kimi K2.5 and Kimi K2.6
 Comparing Opus 4.6 and Opus 4.7
 Comparing GPT 5.4 and GPT 5.4-Pro
 Comparing GPT 5.2 and GPT 5.4
 Comparing GPT 5.2 and GPT 5.3-Codex
 Comparing Opus 4.5 and 4.6, also answered some questions about the benchmark
 Comparing Opus 4.6 and GPT-5.2 Pro
 Comparing Gemini 3.0 and Gemini 3.1
  
Extra Information (if you're confused):
 Essentially it's a benchmark that tests how well a model can create a 3D Minecraft like structure.
 So the models are given a palette of blocks (think of them like legos) and a prompt of what to build, so like the first prompt you see in the post was a fighter jet. Then the models had to build a fighter jet by returning a JSON in which they gave the coordinate of each block/lego (x, y, z). It's interesting to see which model is able to create a better 3D representation of the given prompt.
 The smarter models tend to design much more detailed and intricate builds. The repository readme might provide might help give a better understanding.
 (Disclaimer: This is a public benchmark I created, so technically self-promotion : )
    submitted by    /u/ENT_Alam  
 [link]   [comments]

### [22] Kimi k3 launching soon (probably more than 2 trillion para acc to leaks)
- **Link:** https://www.reddit.com/r/singularity/comments/1uwctrz/kimi_k3_launching_soon_probably_more_than_2/
- **Source:** r/singularity (AI News & Future)
- **Info:** submitted by    /u/Independent-Wind4462  
 [link]   [comments]

### [23] Demis Hassabis shared a rare essay on X: AGI is few years away, we're in the singularity foothills, proposes US-led Frontier AI Standards Body with eventual mandatory safety testing
- **Link:** https://www.reddit.com/r/singularity/comments/1uw40fb/demis_hassabis_shared_a_rare_essay_on_x_agi_is/
- **Source:** r/singularity (AI News & Future)
- **Info:** read full essay here: https://x.com/demishassabis/status/2076957440109625718
 Key points (some of these things he had already said before)
  
AGI is likely only a few years away and describes this moment as the “foothills of the singularity”
 AGI should not be compared to normal technological breakthroughs like the internet or smartphones, but more like the discovery of electricity or fire
 He predicts the impact could be “10x the Industrial Revolution at 10x the speed”
 He warns that frontier AI systems could introduce serious risks in areas like cybersecurity, biology, and increasingly autonomous agents
 He proposes creating a Frontier AI Standards Body to evaluate the most advanced models, similar in spirit to financial self-regulatory organizations like FINRA
 He also proposes voluntary pre-release AGI testing that could later become mandatory for “Frontier Labs” in the US (with aim to make this global)
 The framework would apply to frontier models regardless of whether they are open or closed, with labs sharing models for evaluation before deployment.
 AGI development should be guided by scientific evaluation, international cooperation, and responsible deployment.
  
   submitted by    /u/TorturedPoet30  
 [link]   [comments]

### [24] I feel like some degrees are beginning to shine even more
- **Link:** https://www.reddit.com/r/singularity/comments/1uwg6rf/i_feel_like_some_degrees_are_beginning_to_shine/
- **Source:** r/singularity (AI News & Future)
- **Info:** prompt engineering is a temporary adaptation, evaluation engineering imo is the future (for now). trends of companies like prism eval, rolific, telus, outlier AI, mechanize, other frontier AI labs (anthropic/open AI etc) be more leaning to people outside technical backgrounds is quite interesting. eval testing and human decision making is extremely difficult and requires good logic ofc, but it's funny to know the original meme is pretty much ironic now. This isn't to say my reasoning is brand new, but it was initially difficult to put a finger on the analytics; yet now with the stats and resources it's becoming more obvious to where things are shifting :)
    submitted by    /u/balkanragebaiter  
 [link]   [comments]

### [25] Super Dario: One More Week
- **Link:** https://www.reddit.com/r/singularity/comments/1uwbkxt/super_dario_one_more_week/
- **Source:** r/singularity (AI News & Future)
- **Info:** submitted by    /u/RecmacfonD  
 [link]   [comments]

### [26] Agently
- **Link:** https://www.producthunt.com/products/agently
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [27] Crustdata Recruiter
- **Link:** https://www.producthunt.com/products/crustdata-2
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [28] Campus
- **Link:** https://www.producthunt.com/products/flutterflow
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [29] nudge2.0
- **Link:** https://www.producthunt.com/products/nudge-26
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [30] QuickQuill
- **Link:** https://www.producthunt.com/products/quickquill-2
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [31] ccshare
- **Link:** https://www.producthunt.com/products/ccshare
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [32] DeskMat 1.3
- **Link:** https://www.producthunt.com/products/deskmat-for-mac
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [33] Keepresso
- **Link:** https://www.producthunt.com/products/keepresso
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [34] Flodesk Studio
- **Link:** https://www.producthunt.com/products/flodesk-studio
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [35] Copresent
- **Link:** https://www.producthunt.com/products/co-present
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [36] EQK
- **Link:** https://www.producthunt.com/products/eqk-eq-with-ai
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [37]  Professional Email Templates
- **Link:** https://www.producthunt.com/products/professional-email-templates
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [38] Jam-Pod
- **Link:** https://www.producthunt.com/products/jam-pod
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [39] Review by Eddie AI
- **Link:** https://www.producthunt.com/products/eddie-your-ai-video-editor
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [40] Velo 3.0
- **Link:** https://www.producthunt.com/products/velo-4
- **Source:** Product Hunt (Product Releases)
- **Info:** Discussion
            |
            Link

### [41] Do AI Agents Know When a Task Is Simple? Toward Complexity-Aware Reasoning and Execution
- **Link:** http://arxiv.org/abs/2607.13034v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Large language model (LLM) agents increasingly automate multi-step engineering and informatics workflows, yet they rarely ask how much effort a task actually requires. They often follow a maximum-context-first strategy--re-reading files and dependencies they have already seen--turning a one-line edi...

### [42] The Seriality Gap in Video Diffusion Models
- **Link:** http://arxiv.org/abs/2607.13031v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** When one ball strikes another, then another, video models should predict the consequences of each bounce. In controlled experiments on multi-ball hard-sphere dynamics, we find that the performance of standard bidirectional video diffusion degrades as the causal chain lengthens, even when provided mo...

### [43] TerraZero: Procedural Driving Simulation for Zero-Demonstration Self-Play at Scale
- **Link:** http://arxiv.org/abs/2607.13028v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Training robust autonomous driving agents requires a simulator that is fast enough for reinforcement learning at scale, realistic enough to ground behavior in real-world map structure, and diverse enough to cover the safety-critical long tail that logged data rarely contains. We present TerraZero, a...

### [44] PalmClaw: A Native On-Device Agent Framework for Mobile Phones
- **Link:** http://arxiv.org/abs/2607.13027v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Large Language Model (LLM) agents have moved beyond generating responses to executing multi-step tasks by calling tools, observing the results, and iteratively deciding the next action. Most agent systems run on desktops or servers, which support tool use and task automation. Mobile devices are also...

### [45] A Shortcut to Statistically Steady-State Turbulence with Flow Matching
- **Link:** http://arxiv.org/abs/2607.13022v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Many nonlinear physical systems exhibit an initial transient phase in which perturbations grow before nonlinear interactions lead to a statistically steady state. While this saturated regime is of primary interest, direct numerical simulations must resolve the full transient dynamics before reaching...

### [46] Audio-Native Speech Recognition with a Frozen Discrete-Diffusion Language Model
- **Link:** http://arxiv.org/abs/2607.13013v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Automatic speech recognition is dominated by autoregressive decoders that emit one token at a time. We ask whether a discrete diffusion language model can transcribe speech instead, refining a whole transcript in parallel over a small number of denoising steps. We train an audio-native interface for...

### [47] Inclusive Federated Learning Through Compliance-Weighted Noise Allocation in Healthcare AI
- **Link:** http://arxiv.org/abs/2505.22108v4
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Background: Federated learning (FL) enables collaborative training of clinical AI models without centralizing patient data, but adoption is limited by privacy concerns, heterogeneous institutional compliance, and resource disparities; standard differential privacy (DP) applies uniform noise to all c...

### [48] Dynamic Resource Allocation for Ensemble Determinization MCTS
- **Link:** http://arxiv.org/abs/2607.13007v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** Simulation-based algorithms are especially suited for high-uncertainty environments such as adversarial board games with significant elements of randomness and hidden information. In particular, several Monte Carlo Tree Search (MCTS) variants are commonly used in such domains. In this paper, we prop...

### [49] The Spectrum Is Not Enough: When Context Helps Time-Series Forecasting
- **Link:** http://arxiv.org/abs/2607.13006v1
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** A growing family of indices scores how predictable a series is from its spectrum. Practitioners increasingly read these scores as answering a different question: whether \emph{adding context}, a longer lookback, a retrieval plug-in, or a pretrained model, will help. These are not the same question. ...

### [50] Propheticus: Machine Learning Framework for the Development of Predictive Models for Reliable and Secure Software
- **Link:** http://arxiv.org/abs/1809.01898v2
- **Source:** arXiv CS.AI (Research Papers)
- **Info:** The growing complexity of software calls for innovative solutions that support the deployment of reliable and secure software. Machine Learning (ML) has shown its applicability to various complex problems and is frequently used in the dependability domain, both for supporting systems design and veri...

### [51] Bird flu H5N1 in Australia: protect Australian species from bird flu virus
- **Link:** https://www.nature.com/articles/d41586-026-02188-y
- **Source:** Nature Journal (Biotech & Pharma)
- **Info:** 

### [52] Academia should recognize community partnerships as having societal impact
- **Link:** https://www.nature.com/articles/d41586-026-02190-4
- **Source:** Nature Journal (Biotech & Pharma)
- **Info:** 

### [53] The Enhanced Games and the normalization of doping: a public health concern
- **Link:** https://www.nature.com/articles/d41586-026-02189-x
- **Source:** Nature Journal (Biotech & Pharma)
- **Info:** 

### [54] AI models: one country’s fears become everyone’s constraint
- **Link:** https://www.nature.com/articles/d41586-026-02187-z
- **Source:** Nature Journal (Biotech & Pharma)
- **Info:** 

### [55] How the calendar came to be
- **Link:** https://www.nature.com/articles/d41586-026-02102-6
- **Source:** Nature Journal (Biotech & Pharma)
- **Info:** 

### [56] Bungee-jumping mice may reveal why astronauts skip on the Moon
- **Link:** https://www.science.org/content/article/bungee-jumping-mice-may-reveal-why-astronauts-skip-moon
- **Source:** Science Magazine (Biotech & Pharma)
- **Info:** Low gravity puts a bounce in the step of humans and rodents alike

### [57] U.S. researchers outraged at proposed changes to federal grants
- **Link:** https://www.science.org/content/article/u-s-researchers-outraged-proposed-changes-federal-grants
- **Source:** Science Magazine (Biotech & Pharma)
- **Info:** White House receives 340,000 comments on rules many fear would politicize science

### [58] Astrónomo maya identificado por primera vez gracias a firma en un mural
- **Link:** https://www.science.org/content/article/astronomo-maya-identificado-por-primera-vez-gracias-firma-en-un-mural
- **Source:** Science Magazine (Biotech & Pharma)
- **Info:** La firma acompaña a una fórmula matemática que sincroniza calendarios con movimiento de planetas

### [59] Scrawled signature names a Maya astronomer for the first time
- **Link:** https://www.science.org/content/article/scrawled-signature-names-maya-astronomer-first-time
- **Source:** Science Magazine (Biotech & Pharma)
- **Info:** The autograph accompanies formulas devised to sync calendars with planetary movement

### [60] Plan to turn major monkey research facility into sanctuary may be dead
- **Link:** https://www.science.org/content/article/plan-turn-major-monkey-research-facility-sanctuary-may-be-dead
- **Source:** Science Magazine (Biotech & Pharma)
- **Info:** Lack of federal funds may have forced Oregon university to drop idea of converting national primate center into science-free refuge

### [61] Setmelanotide for the Treatment of Acquired Hypothalamic Obesity
- **Link:** https://www.nejm.org/doi/full/10.1056/NEJMoa2512275?af=R
- **Source:** NEJM (Biotech & Pharma)
- **Info:** New England Journal of Medicine, Volume 395, Issue 2, Page 138-150, July 9, 2026.

### [62] Ensartinib in Resected ALK-Positive Non–Small-Cell Lung Cancer
- **Link:** https://www.nejm.org/doi/full/10.1056/NEJMoa2518990?af=R
- **Source:** NEJM (Biotech & Pharma)
- **Info:** New England Journal of Medicine, Volume 395, Issue 2, Page 151-161, July 9, 2026.

### [63] Phase 3 Trials of Inhaled Treprostinil for Idiopathic Pulmonary Fibrosis
- **Link:** https://www.nejm.org/doi/full/10.1056/NEJMoa2501488?af=R
- **Source:** NEJM (Biotech & Pharma)
- **Info:** New England Journal of Medicine, Volume 395, Issue 2, Page 115-126, July 9, 2026.

### [64] Inhaled Treprostinil for Idiopathic Pulmonary Fibrosis
- **Link:** https://www.nejm.org/doi/full/10.1056/NEJMoa2512911?af=R
- **Source:** NEJM (Biotech & Pharma)
- **Info:** New England Journal of Medicine, Volume 395, Issue 2, Page 127-137, July 9, 2026.

### [65] Nutrition Therapy in Critically Ill Adults
- **Link:** https://www.nejm.org/doi/full/10.1056/NEJMra2506111?af=R
- **Source:** NEJM (Biotech & Pharma)
- **Info:** New England Journal of Medicine, Volume 395, Issue 2, Page 162-174, July 9, 2026.

### [66] Map of spiking activity underlying change detection in the mouse visual system
- **Link:** https://www.cell.com/cell/fulltext/S0092-8674(26)00745-2?rss=yes
- **Source:** Cell (Biotech & Pharma)
- **Info:** Large-scale Neuropixels recordings across the mouse visual system during an image-change detection task map how sensory, motor, and task engagement signals are distributed across the cortex, thalamus, and midbrain. Task and novelty signals differentially modulate activity along this hierarchy, and combined decoding and optogenetics suggest mice detect changes via an adaptation-based strategy within a critical time window.

### [67] A viral ORFeome library for systems-level genetic dissection of host-pathogen interactions
- **Link:** https://www.cell.com/cell/fulltext/S0092-8674(26)00583-0?rss=yes
- **Source:** Cell (Biotech & Pharma)
- **Info:** A scalable library of ∼13,000 barcoded viral open reading frames from >500 viral species enables functional genomic screens across the virome. Applying this platform identified viral regulators of cellular proliferation, antigen presentation, and interferon signaling. This platform enables systematic exploration of viral protein function.

### [68] Four-dimensional molecular mapping from a spatial snapshot reveals the dynamics of hair follicle organogenesis
- **Link:** https://www.cell.com/cell/fulltext/S0092-8674(26)00702-6?rss=yes
- **Source:** Cell (Biotech & Pharma)
- **Info:** A deep-tissue spatial transcriptomics method simultaneously captures hundreds of hair follicles spanning organogenesis in mouse skin. Ordering follicles by molecular age transforms this snapshot into a map of organogenesis in both space and time, revealing the choreography of organ assembly and how it goes awry in genetically hairless mice.

### [69] Co-option of lysosomal machinery shapes the evolution of the intracellular photosymbiosis supporting coral reefs
- **Link:** https://www.cell.com/cell/fulltext/S0092-8674(26)00701-4?rss=yes
- **Source:** Cell (Biotech & Pharma)
- **Info:** Corals harbor intracellular algal symbionts in specialized organelles that enable them to build diverse reef ecosystems. Corals and other cnidarians have repeatedly evolved this symbiosis through the co-option of lysosomal machinery to simultaneously support photosynthesis and extract photosynthetic products from the algae.

### [70] Recurrent patterns of TOP1-mediated neuronal genomic damage shared by major neurodegenerative disorders
- **Link:** https://www.cell.com/cell/fulltext/S0092-8674(26)00700-2?rss=yes
- **Source:** Cell (Biotech & Pharma)
- **Info:** Single-cell whole-genome sequencing reveals a shared pattern of excessive somatic mutations across C9ORF72 ALS, C9ORF72 FTD, and Alzheimer’s disease, dominated by 2-bp deletions. These mutations arise from aberrant topoisomerase 1 (TOP1)-mediated mutagenesis linked to oxidative DNA damage, identifying a unifying mechanism of neuronal genomic instability in neurodegeneration.

### [71] Microsoft’s Secure Boot has been broken for a decade and no one noticed until now
- **Link:** https://arstechnica.com/security/2026/07/microsoft-secure-boot-has-been-broken-for-most-of-its-existence/
- **Source:** Ars Technica (Deep Tech & Startups)
- **Info:** Old and forgotten "shims" Microsoft failed to revoke have made Secure Boot bypasses simple.

### [72] The US government warns that Russia state hackers are coming after your router
- **Link:** https://arstechnica.com/security/2026/07/the-us-government-warns-that-russia-state-hackers-are-coming-after-your-router/
- **Source:** Ars Technica (Deep Tech & Startups)
- **Info:** With residential proxies all the rage, CISA urges router users to be vigilant.

### [73] Now, defenders are embracing the prompt injection, too
- **Link:** https://arstechnica.com/security/2026/07/now-defenders-are-embracing-the-prompt-injection-too/
- **Source:** Ars Technica (Deep Tech & Startups)
- **Info:** "Context bombing" tricks hacking agents into shutting down before they can do harm.

### [74] Patch for Windows Defender 0-day could allow attackers to fill hard disk
- **Link:** https://arstechnica.com/security/2026/07/patch-for-windows-defender-0-day-could-allow-attackers-to-fill-hard-disk/
- **Source:** Ars Technica (Deep Tech & Startups)
- **Info:** The feud between NightmareEclipse and Microsoft shows no signs of resolving soon.

### [75] Allstate accuses Broadcom of auditing it because it quit VMware, CA
- **Link:** https://arstechnica.com/information-technology/2026/07/allstate-accuses-broadcom-of-auditing-it-because-it-quit-vmware-ca/
- **Source:** Ars Technica (Deep Tech & Startups)
- **Info:** Broadcom accuses Allstate of dodging VMware audits.

### [76] I’m de-influencing you from buying the RingConn 3 (even though it’s pretty)
- **Link:** https://techcrunch.com/2026/07/14/ringconn-3-review/
- **Source:** TechCrunch Hardware (Deep Tech & Startups)
- **Info:** The RingConn 3 actually looks like real jewelry, not a wearable -- but its fitness tracking and headache detection features are disappointing.

### [77] Pinwheel launches a retro-inspired landline phone for kids
- **Link:** https://techcrunch.com/2026/07/14/pinwheel-launches-a-retro-inspired-landline-phone-for-kids/
- **Source:** TechCrunch Hardware (Deep Tech & Startups)
- **Info:** Kid-friendly tech company Pinwheel announced the launch of a new landline phone designed to let children stay connected without the distractions of a smartphone.

### [78] This slushie machine was a lifesaver during NYC’s heat wave
- **Link:** https://techcrunch.com/2026/07/11/this-slushie-machine-was-a-lifesaver-during-nycs-heat-wave/
- **Source:** TechCrunch Hardware (Deep Tech & Startups)
- **Info:** Ninja's latest slushie machine builds on the popularity of the original Slushi, but with a big upgrade.

### [79] Smart glasses without a camera? Even Realities bets productivity beats recording everyone
- **Link:** https://techcrunch.com/2026/07/11/smart-glasses-without-a-camera-even-realities-bets-productivity-beats-recording-everyone/
- **Source:** TechCrunch Hardware (Deep Tech & Startups)
- **Info:** The glasses are targeted at people who might be constantly in meetings, giving presentations, and traveling to countries where different languages are spoken.

### [80] SK Hynix raises $26.5B in the biggest foreign IPO in US history, is urged to build new US fabs
- **Link:** https://techcrunch.com/2026/07/10/sk-hynix-raises-26-5b-in-the-biggest-foreign-ipo-in-us-history-is-urged-to-build-new-us-fabs/
- **Source:** TechCrunch Hardware (Deep Tech & Startups)
- **Info:** The AI chip boom just produced its biggest Wall Street moment yet. Now SK Hynix and Samsung are being asked to build U.S. factories.

