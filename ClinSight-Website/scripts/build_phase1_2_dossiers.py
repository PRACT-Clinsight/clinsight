import json
import os
import html

TRIALS_DIR = "ClinSight-Website/trials"
TARGETS_DIR = "ClinSight-Website/targets/mettl3-inhibitors"
DATA_FILE = "ClinSight-Website/data/phase1_2_mettl3_extracted.json"
BASE_URL = "https://clinsight.ket-thm4u.workers.dev"

VERIFIED_CLASS_NCTS = ["NCT06975293", "NCT07163325", "NCT05584111"]

def escape_html(s):
    if not s:
        return ""
    return html.escape(str(s))

# Human-curated concise cell summaries derived strictly from the verified verbatim eligibility lines
# so a scientist or medical writer can compare organ cutoffs in 10 seconds instead of reading raw bullets.
HUMAN_LAB_SUMMARY = {
    "NCT06975293": {
        "regimen": "Oral STC-15 + Toripalimab (anti-PD-1)",
        "indications": "Advanced solid tumors: NSCLC, HNSCC, melanoma, endometrial cancer",
        "heme": "ANC, platelets & hemoglobin per protocol organ-function table (qualitative rule in public registry)",
        "renal_hepatic": "Adequate renal & hepatic function required (specific lab cutoffs in full protocol)",
        "cardiac_washout": "Prior therapy washout & QTc/LVEF per full protocol (requires ≥1 prior systemic regimen)",
        "synopsis": (
            "NCT06975293 (STORM Therapeutics) is a recruiting Phase 1b/2 multicenter study evaluating the oral METTL3 "
            "inhibitor STC-15 in combination with the anti-PD-1 antibody toripalimab across 21 sites in the United States, "
            "United Kingdom, and Australia. The Phase 1b portion uses a 3+3 dose-escalation design to evaluate safety, "
            "tolerability, and dose-limiting toxicities (DLTs), followed by a Simon's two-stage Phase 2 expansion across "
            "four disease-specific cohorts: non-small cell lung cancer (NSCLC), head and neck squamous cell carcinoma (HNSCC), "
            "melanoma, and endometrial cancer."
        )
    },
    "NCT07163325": {
        "regimen": "Oral EP102 monotherapy & combinations (+ pembrolizumab or + azacitidine/venetoclax)",
        "indications": "Advanced solid malignancies and relapsed/refractory myeloid malignancies (AML/MDS)",
        "heme": "Not detailed in brief public registry criteria",
        "renal_hepatic": "Not detailed in brief public registry criteria",
        "cardiac_washout": "Prior standard therapy required; washout window not specified in brief summary",
        "synopsis": (
            "NCT07163325 (Epics Therapeutics) is a recruiting Phase 1/2 first-in-human study of the oral METTL3 inhibitor "
            "EP102 in patients with advanced solid tumors and hematologic malignancies across 6 clinical sites in Belgium, "
            "France, and Spain. Dose escalation follows a Bayesian Optimal Interval (BOIN) design with a 21-day DLT assessment "
            "window after first administration to determine the maximum tolerated dose (MTD) and recommended expansion doses, "
            "evaluating EP102 both as monotherapy and in combination with pembrolizumab or azacitidine plus venetoclax."
        )
    },
    "NCT05584111": {
        "regimen": "Oral STC-15 monotherapy (4 dose-escalation cohorts)",
        "indications": "Advanced solid tumors refractory to standard therapy",
        "heme": "ANC, platelet & hemoglobin thresholds required (qualitative organ-function rule in registry)",
        "renal_hepatic": "Adequate renal (creatinine/CrCl) & hepatic (AST/ALT/bilirubin) function required",
        "cardiac_washout": "Systemic anti-cancer therapy washout required prior to first dose of STC-15",
        "synopsis": (
            "NCT05584111 (STORM Therapeutics) is the completed Phase 1 first-in-human (FIH) monotherapy study of the oral "
            "METTL3 RNA methyltransferase inhibitor STC-15 in patients with advanced solid malignancies across 6 United States "
            "cancer centers. The trial enrolled 4 sequential dose-escalation cohorts using a 3+3 design with modified Fibonacci "
            "dose increments to evaluate safety, pharmacokinetics, target engagement, and the Recommended Phase 2 Dose (RP2D), "
            "with peer-reviewed clinical results published in 2025 (PMID: 40751015)."
        )
    }
}

SHARED_CSS = '''
    :root {
      --bg-void: #07090e;
      --bg-base: #0b0f19;
      --bg-surface: #111827;
      --bg-card: rgba(17, 24, 39, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(56, 189, 248, 0.35);
      --cyan: #38bdf8;
      --cyan-glow: rgba(56, 189, 248, 0.12);
      --teal: #14b8a6;
      --teal-glow: rgba(20, 184, 166, 0.12);
      --purple: #c084fc;
      --amber: #fbbf24;
      --text-high: #f8fafc;
      --text-med: #cbd5e1;
      --text-low: #94a3b8;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color-scheme: dark;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-void);
      color: var(--text-med);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding: 0 0 64px;
      -webkit-font-smoothing: antialiased;
    }

    /* Site Navigation */
    .site-nav {
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-base);
      padding: 14px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }
    .nav-inner {
      max-width: 1120px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .nav-brand {
      display: flex;
      align-items: baseline;
      gap: 10px;
      text-decoration: none;
      color: var(--text-high);
    }
    .logo-text {
      font-size: 19px;
      font-weight: 700;
      color: var(--cyan);
    }
    .logo-tag {
      font-size: 12.5px;
      color: var(--text-low);
      border-left: 1px solid var(--border-subtle);
      padding-left: 10px;
    }
    @media (max-width: 640px) { .logo-tag { display: none; } }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }
    .nav-links a {
      color: var(--text-med);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
    }
    .nav-links a:hover, .nav-links a.active { color: var(--cyan); }

    .container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    /* Header / Hero Card */
    .identity-band {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 28px;
      margin-bottom: 24px;
    }
    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
      align-items: center;
    }
    .badge {
      font-family: var(--font-mono);
      font-size: 11.5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
    }
    .badge-nct { background: var(--cyan-glow); color: var(--cyan); border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-phase { background: rgba(168, 85, 247, 0.12); color: var(--purple); border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-status { background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-class { background: var(--teal-glow); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.3); }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-high);
      line-height: 1.3;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .subtitle-line {
      font-size: 14.5px;
      color: var(--text-med);
      margin-bottom: 20px;
    }
    .subtitle-line strong { color: var(--text-high); }

    /* Ready-to-Use Clinical Synopsis Box */
    .synopsis-box {
      background: rgba(56, 189, 248, 0.05);
      border: 1px solid rgba(56, 189, 248, 0.22);
      border-radius: 10px;
      padding: 18px 20px;
      margin-top: 16px;
    }
    .synopsis-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 8px;
    }
    .synopsis-label {
      font-size: 11.5px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--cyan);
      font-weight: 600;
    }
    .synopsis-text {
      font-size: 14.5px;
      color: var(--text-high);
      line-height: 1.65;
    }

    /* 4-Key Takeaway Grid */
    .glance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .glance-card {
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 14px 16px;
    }
    .glance-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-low);
      font-weight: 600;
      margin-bottom: 4px;
    }
    .glance-val {
      font-size: 13.5px;
      color: var(--text-high);
      font-weight: 600;
      line-height: 1.4;
    }

    /* Section Cards */
    .module-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .module-header-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .module-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-high);
    }
    .module-sub {
      font-size: 13px;
      color: var(--text-low);
    }

    /* Clean 2-Column Parameter Rows */
    .field-row {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 16px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
      align-items: baseline;
    }
    .field-row:last-child { border-bottom: none; }
    @media (max-width: 640px) {
      .field-row { grid-template-columns: 1fr; gap: 4px; }
    }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-low);
    }
    .val-stated { color: var(--text-high); font-weight: 500; }
    .val-inferred { color: var(--text-med); }
    .val-not-reported { color: var(--text-low); }

    /* Quiet Source Drawer (Hidden unless user clicks 'Show Sources' or 'Quote') */
    .source-anchor { display: none; margin-top: 6px; font-size: 12px; }
    body.show-sources .source-anchor { display: block; }
    .source-quote {
      display: block;
      color: var(--text-med);
      font-style: italic;
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 10px;
      border-left: 2px solid var(--cyan);
      border-radius: 4px;
      margin-top: 4px;
    }
    .source-field {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--cyan);
    }

    .undisclosed-note {
      margin-top: 12px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      font-size: 12.5px;
      color: var(--text-low);
    }

    /* Buttons */
    .toolbar-group { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn-export {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--cyan);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-export:hover { background: rgba(56, 189, 248, 0.18); }
    .btn-subtle {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-low);
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-subtle:hover { color: var(--text-high); border-color: var(--border-hover); }

    /* Side-by-Side Comparison Matrix Table */
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    .matrix-th {
      text-align: left;
      padding: 14px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 2px solid var(--border-subtle);
      vertical-align: top;
    }
    .matrix-param {
      padding: 12px 14px;
      font-weight: 600;
      color: var(--text-high);
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.015);
      width: 210px;
      vertical-align: top;
      font-size: 13px;
    }
    .matrix-td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-subtle);
      border-left: 1px solid var(--border-subtle);
      vertical-align: top;
      color: var(--text-high);
    }
    .matrix-td.muted { color: var(--text-low); }

    .doc-link {
      color: var(--cyan);
      text-decoration: none;
      font-weight: 500;
    }
    .doc-link:hover { text-decoration: underline; }

    footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: 12.5px;
      color: var(--text-low);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    footer a { color: var(--text-med); text-decoration: none; }
    footer a:hover { color: var(--cyan); }
'''

def render_nav(rel_prefix="../../", active="compare"):
    return f'''
  <nav class="site-nav" aria-label="Primary Navigation">
    <div class="nav-inner">
      <a href="{rel_prefix}" class="nav-brand">
        <span class="logo-text">ClinSight™</span>
        <span class="logo-tag">Clinical Trials &amp; Evidence Generation</span>
      </a>
      <div class="nav-links">
        <a href="{rel_prefix}">Home</a>
        <a href="{rel_prefix}explorer/" class="{'active' if active=='explorer' else ''}">Trials Explorer</a>
        <a href="{rel_prefix}compare/" class="{'active' if active=='compare' else ''}">Comparator</a>
        <a href="{rel_prefix}jobs/">Careers</a>
      </div>
    </div>
  </nav>'''

def render_clean_row(label, field_data, source_field=None, verbatim_quote=None):
    val = field_data.get("render") or field_data.get("value") or ""
    s_field = field_data.get("source_field") or source_field
    v_quote = field_data.get("verbatim") or verbatim_quote
    source_html = ""
    if s_field and v_quote:
        source_html = f'''
        <div class="source-anchor">
          <span class="source-field">Registry field: {escape_html(s_field)}</span>
          <span class="source-quote">"{escape_html(v_quote)}"</span>
        </div>'''
    return f'''
    <div class="field-row">
      <div class="field-label">{escape_html(label)}</div>
      <div>
        <div class="val-stated">{escape_html(val)}</div>
        {source_html}
      </div>
    </div>'''

def render_clean_section_rows(field_specs):
    active_rows = []
    undisclosed = []
    for label, f_data, s_field, v_quote in field_specs:
        st = f_data.get("state")
        if st in ("STATED", "STATED-structural", "INFERRED", "STALE"):
            active_rows.append(render_clean_row(label, f_data, s_field, v_quote))
        else:
            undisclosed.append(label)
    out = "\n".join(active_rows)
    if undisclosed:
        out += f'''
    <div class="undisclosed-note">
      <strong>Not detailed in the public registry summary:</strong> {escape_html(", ".join(undisclosed))}.
    </div>'''
    return out

def render_clean_eligibility(mod2_data):
    cat_specs = [
        ("Hematologic (ANC / Platelets / Hgb)", mod2_data["hematologic"]),
        ("Renal (Creatinine / CrCl / eGFR)", mod2_data["renal"]),
        ("Hepatic (Bilirubin / AST / ALT)", mod2_data["hepatic"]),
        ("Cardiac (QTc / LVEF)", mod2_data["cardiac"]),
        ("Prior Therapy & Washout", mod2_data["washout"])
    ]
    active_html = []
    undisclosed = []
    for label, cat_data in cat_specs:
        if cat_data.get("state") == "STATED":
            items = cat_data.get("items", [])
            bullets = "".join([f'<li style="margin-bottom:4px;">{escape_html(it.get("verbatim"))}</li>' for it in items])
            active_html.append(f'''
    <div class="field-row">
      <div class="field-label">{escape_html(label)}</div>
      <div>
        <ul style="padding-left:18px; color:var(--text-high);">{bullets}</ul>
        <div class="source-anchor">
          <span class="source-field">Registry field: protocolSection.eligibilityModule.eligibilityCriteria</span>
        </div>
      </div>
    </div>''')
        else:
            undisclosed.append(label.split(" (")[0])
    out = "\n".join(active_html)
    if undisclosed:
        out += f'''
    <div class="undisclosed-note">
      <strong>Organ/eligibility cutoffs not itemized in the brief public registry text:</strong> {escape_html(", ".join(undisclosed))} (refer to the sponsor's full clinical study protocol).
    </div>'''
    return out

def build_cross_trial_matrix_html(verified_dossiers, current_nct=None, rel_prefix="../../"):
    headers_html = '<th class="matrix-th" style="width:210px;">Clinical Dimension</th>'
    for d in verified_dossiers:
        nct = d["identity"]["nctId"]
        is_curr = (nct == current_nct)
        hl_style = "border-top: 3px solid #38bdf8; background: rgba(56, 189, 248, 0.06);" if is_curr else ""
        drug = ", ".join(d["identity"].get("interventions", []))
        sponsor = d["identity"]["leadSponsor"]
        headers_html += f'''
        <th class="matrix-th" style="{hl_style}">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:4px;">
            <a href="{rel_prefix}trials/{nct}/" style="color:#38bdf8; font-family:var(--font-mono); font-size:13px; text-decoration:none; font-weight:700;">{nct}</a>
            <span class="badge badge-phase" style="font-size:10.5px; padding:2px 7px;">{escape_html(d["identity"]["phase"])}</span>
          </div>
          <div style="font-size:13px; color:var(--text-high); font-weight:600; margin-bottom:2px;">{escape_html(drug)}</div>
          <div style="font-size:11.5px; color:var(--text-low); font-weight:400;">{escape_html(sponsor)}</div>
        </th>'''

    def cell(text, muted=False, src=None):
        cls = "matrix-td muted" if muted else "matrix-td"
        src_html = f'<div class="source-anchor"><span class="source-field">{escape_html(src)}</span></div>' if src else ""
        return f'<td class="{cls}">{escape_html(text)}{src_html}</td>'

    rows_spec = [
        ("Regimen & Modality", lambda d: cell(HUMAN_LAB_SUMMARY.get(d["identity"]["nctId"], {}).get("regimen", ", ".join(d["identity"].get("interventions", []))))),
        ("Recruitment Status", lambda d: cell(d["identity"]["status"], src="protocolSection.statusModule.overallStatus")),
        ("Target Indications", lambda d: cell(HUMAN_LAB_SUMMARY.get(d["identity"]["nctId"], {}).get("indications", "; ".join(d["identity"].get("conditions", []))))),
        ("Escalation & Expansion Design", lambda d: cell(
            d["module1"]["design_archetype"].get("render") or d["module1"]["design_archetype"].get("value"),
            muted=(d["module1"]["design_archetype"]["state"] == "NOT_REPORTED"),
            src=d["module1"]["design_archetype"].get("source_field")
        )),
        ("Study Cohorts / Arms", lambda d: cell(
            f"{d['module1']['arms_cohorts']['count']} cohorts: {d['module1']['arms_cohorts']['verbatim']}",
            src="protocolSection.armsInterventionsModule.armGroups"
        )),
        ("Primary Safety / DLT Endpoint", lambda d: cell(
            d["module3"]["dlt_endpoint"].get("render") or d["module3"]["dlt_endpoint"].get("value"),
            src=d["module3"]["dlt_endpoint"].get("source_field")
        )),
        ("DLT Assessment Window", lambda d: cell(
            d["module3"]["dlt_window"].get("value") if d["module3"]["dlt_window"]["state"] == "STATED" else "Not specified in brief outcome timeframe",
            muted=(d["module3"]["dlt_window"]["state"] != "STATED"),
            src=d["module3"]["dlt_window"].get("source_field")
        )),
        ("MTD & RP2D Objectives", lambda d: cell(
            f"MTD: {'Stated' if d['module3']['mtd']['state']=='STATED' else 'Not named'} · RP2D: {d['module3']['rp2d'].get('render')}",
            src=d["module3"]["rp2d"].get("source_field") or d["module3"]["mtd"].get("source_field")
        )),
        ("Hematologic Eligibility", lambda d: cell(
            HUMAN_LAB_SUMMARY.get(d["identity"]["nctId"], {}).get("heme", "Not specified"),
            muted=(d["module2"]["hematologic"]["state"] != "STATED")
        )),
        ("Renal & Hepatic Eligibility", lambda d: cell(
            HUMAN_LAB_SUMMARY.get(d["identity"]["nctId"], {}).get("renal_hepatic", "Not specified"),
            muted=(d["module2"]["renal"]["state"] != "STATED" and d["module2"]["hepatic"]["state"] != "STATED")
        )),
        ("Washout & Prior Therapy", lambda d: cell(
            d["module2"]["washout"]["items"][0]["verbatim"] if d["module2"]["washout"]["state"] == "STATED" and d["module2"]["washout"].get("items") else HUMAN_LAB_SUMMARY.get(d["identity"]["nctId"], {}).get("cardiac_washout", "Not specified"),
            muted=(d["module2"]["washout"]["state"] != "STATED")
        )),
        ("Geography & Trial Sites", lambda d: cell(
            d["module1"]["participating_countries"].get("render"),
            src="protocolSection.contactsLocationsModule.locations"
        )),
        ("Peer-Reviewed Publications", lambda d: cell(
            ", ".join(f"PubMed PMID: {p}" for p in d["module4"]["pmids"]) if d["module4"]["pmids"] else "None linked yet",
            muted=(not d["module4"]["pmids"])
        ))
    ]

    body_rows = ""
    for label, fn in rows_spec:
        cells = "".join(fn(d) for d in verified_dossiers)
        body_rows += f'''
        <tr>
          <td class="matrix-param">{escape_html(label)}</td>
          {cells}
        </tr>'''

    return f'''
    <div style="overflow-x:auto;">
      <table class="matrix-table">
        <thead>
          <tr>{headers_html}</tr>
        </thead>
        <tbody>
          {body_rows}
        </tbody>
      </table>
    </div>'''

def build_dossier_export_payload(dossier):
    m1 = dossier["module1"]
    m2 = dossier["module2"]
    m3 = dossier["module3"]
    m4 = dossier["module4"]

    def m2_val(cat):
        if m2[cat]["state"] == "STATED":
            return " | ".join(it["verbatim"] for it in m2[cat].get("items", []))
        return m2[cat].get("render", "Not specified in public eligibility criteria.")

    return [
        ("Study Design", "Design Archetype", m1["design_archetype"]["state"], m1["design_archetype"].get("render"), m1["design_archetype"].get("source_field") or "N/A"),
        ("Study Design", "Allocation Mode", m1["allocation"]["state"], m1["allocation"].get("value"), m1["allocation"].get("source_field") or "N/A"),
        ("Study Design", "Masking", m1["masking"]["state"], m1["masking"].get("value"), m1["masking"].get("source_field") or "N/A"),
        ("Study Design", "Intervention Model", m1["intervention_model"]["state"], m1["intervention_model"].get("value"), m1["intervention_model"].get("source_field") or "N/A"),
        ("Study Design", "Primary Purpose", m1["primary_purpose"]["state"], m1["primary_purpose"].get("value"), m1["primary_purpose"].get("source_field") or "N/A"),
        ("Study Design", "Participating Countries", m1["participating_countries"]["state"], m1["participating_countries"].get("render"), m1["participating_countries"].get("source_field") or "N/A"),
        ("Study Design", "Study Arms / Cohorts", m1["arms_cohorts"]["state"], m1["arms_cohorts"].get("render"), m1["arms_cohorts"].get("source_field") or "N/A"),
        ("Eligibility", "Hematologic Function", m2["hematologic"]["state"], m2_val("hematologic"), "protocolSection.eligibilityModule.eligibilityCriteria"),
        ("Eligibility", "Renal Clearance", m2["renal"]["state"], m2_val("renal"), "protocolSection.eligibilityModule.eligibilityCriteria"),
        ("Eligibility", "Hepatic Function", m2["hepatic"]["state"], m2_val("hepatic"), "protocolSection.eligibilityModule.eligibilityCriteria"),
        ("Eligibility", "Cardiac Parameters", m2["cardiac"]["state"], m2_val("cardiac"), "protocolSection.eligibilityModule.eligibilityCriteria"),
        ("Eligibility", "Prior Therapy & Washout", m2["washout"]["state"], m2_val("washout"), "protocolSection.eligibilityModule.eligibilityCriteria"),
        ("Safety & Dosing", "Primary Safety / DLT Endpoint", m3["dlt_endpoint"]["state"], m3["dlt_endpoint"].get("render"), m3["dlt_endpoint"].get("source_field") or "N/A"),
        ("Safety & Dosing", "DLT Assessment Window", m3["dlt_window"]["state"], m3["dlt_window"].get("render"), m3["dlt_window"].get("source_field") or "N/A"),
        ("Safety & Dosing", "Recommended Phase 2 Dose (RP2D)", m3["rp2d"]["state"], m3["rp2d"].get("render"), m3["rp2d"].get("source_field") or "N/A"),
        ("Safety & Dosing", "Maximum Tolerated Dose (MTD)", m3["mtd"]["state"], m3["mtd"].get("render"), m3["mtd"].get("source_field") or "N/A"),
        ("Safety & Dosing", "Toxicity Grading Framework", m3["ctcae"]["state"], m3["ctcae"].get("render"), m3["ctcae"].get("source_field") or "N/A"),
        ("Safety & Dosing", "Dose Modification Rules", m3["dose_modification"]["state"], m3["dose_modification"].get("render"), m3["dose_modification"].get("source_field") or "N/A"),
        ("References", "ClinicalTrials.gov Record", "STATED", m4["nct_url"], "protocolSection.identificationModule.nctId"),
        ("References", "Linked Literature (PMID)", "STATED" if m4["pmids"] else "NOT_REPORTED", ", ".join(m4["pmids"]) if m4["pmids"] else "None linked", "protocolSection.referencesModule")
    ]

def render_dossier_html(dossier, verified_dossiers):
    ident = dossier["identity"]
    nct_id = ident["nctId"]
    title = ident["briefTitle"]
    official_title = ident["officialTitle"]
    phase = ident["phase"]
    status = ident["status"]
    sponsor = ident["leadSponsor"]
    has_pmids = len(dossier["module4"]["pmids"]) > 0

    human_info = HUMAN_LAB_SUMMARY.get(nct_id, {})
    synopsis_text = human_info.get("synopsis", official_title)
    regimen_str = human_info.get("regimen", ", ".join(ident.get("interventions", [])))

    m1_specs = [
        ("Escalation & Study Design", dossier["module1"]["design_archetype"], dossier["module1"]["design_archetype"].get("source_field"), dossier["module1"]["design_archetype"].get("verbatim")),
        ("Study Cohorts / Arms", dossier["module1"]["arms_cohorts"], "protocolSection.armsInterventionsModule.armGroups", dossier["module1"]["arms_cohorts"].get("verbatim")),
        ("Participating Countries & Sites", dossier["module1"]["participating_countries"], "protocolSection.contactsLocationsModule.locations", dossier["module1"]["participating_countries"].get("verbatim")),
        ("Allocation", dossier["module1"]["allocation"], "protocolSection.designModule.designInfo.allocation", dossier["module1"]["allocation"].get("value")),
        ("Masking / Blinding", dossier["module1"]["masking"], "protocolSection.designModule.designInfo.maskingInfo.masking", dossier["module1"]["masking"].get("value")),
        ("Intervention Model", dossier["module1"]["intervention_model"], "protocolSection.designModule.designInfo.interventionModel", dossier["module1"]["intervention_model"].get("value")),
        ("Primary Purpose", dossier["module1"]["primary_purpose"], "protocolSection.designModule.designInfo.primaryPurpose", dossier["module1"]["primary_purpose"].get("value"))
    ]

    m3_specs = [
        ("Primary Safety / DLT Endpoint", dossier["module3"]["dlt_endpoint"], dossier["module3"]["dlt_endpoint"].get("source_field"), dossier["module3"]["dlt_endpoint"].get("verbatim")),
        ("DLT Assessment Window", dossier["module3"]["dlt_window"], dossier["module3"]["dlt_window"].get("source_field"), dossier["module3"]["dlt_window"].get("verbatim")),
        ("Recommended Phase 2 Dose (RP2D)", dossier["module3"]["rp2d"], dossier["module3"]["rp2d"].get("source_field"), dossier["module3"]["rp2d"].get("verbatim")),
        ("Maximum Tolerated Dose (MTD)", dossier["module3"]["mtd"], dossier["module3"]["mtd"].get("source_field"), dossier["module3"]["mtd"].get("verbatim")),
        ("Toxicity Grading Scale", dossier["module3"]["ctcae"], dossier["module3"]["ctcae"].get("source_field"), dossier["module3"]["ctcae"].get("verbatim")),
        ("Dose Modification Rules", dossier["module3"]["dose_modification"], dossier["module3"]["dose_modification"].get("source_field"), dossier["module3"]["dose_modification"].get("verbatim"))
    ]

    export_rows = build_dossier_export_payload(dossier)
    export_json_str = json.dumps(export_rows)

    dlt_glance = dossier["module3"]["dlt_window"].get("value") if dossier["module3"]["dlt_window"]["state"] == "STATED" else "DLT primary endpoint (window in full protocol)"
    design_glance = dossier["module1"]["design_archetype"].get("value") or "Early-phase dose escalation"

    class_matrix_section = ""
    if nct_id in VERIFIED_CLASS_NCTS:
        class_matrix_section = f'''
    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">How {escape_html(nct_id)} Compares Across the METTL3 Inhibitor Class</div>
          <div class="module-sub">Side-by-side comparison with competing clinical-stage METTL3 inhibitor trials</div>
        </div>
        <a href="../../targets/mettl3-inhibitors/" class="btn-export">Open Full METTL3 Class Hub &rarr;</a>
      </div>
      {build_cross_trial_matrix_html(verified_dossiers, current_nct=nct_id, rel_prefix="../../")}
    </div>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape_html(nct_id)} ({escape_html(phase)}) — {escape_html(title)} | ClinSight</title>
  <meta name="description" content="{escape_html(nct_id)} ({escape_html(phase)}): {escape_html(title)}. Sponsor: {escape_html(sponsor)}. Clinical trial design, cohorts, DLT window, and patient eligibility.">
  <link rel="canonical" href="{BASE_URL}/trials/{escape_html(nct_id)}/">
  <style>{SHARED_CSS}</style>
</head>
<body>
  {render_nav(rel_prefix="../../", active="explorer")}

  <main class="container">
    <div class="identity-band">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div class="badge-row">
          <span class="badge badge-nct">{escape_html(nct_id)}</span>
          <span class="badge badge-phase">{escape_html(phase)}</span>
          <span class="badge badge-status">{escape_html(status)}</span>
          <a href="../../targets/mettl3-inhibitors/" class="badge badge-class">Class: METTL3 Inhibitors &rarr;</a>
        </div>
        <div class="toolbar-group">
          <button type="button" class="btn-export" id="btnCopyMd" onclick="copyProvenanceMarkdown()">Copy Table for IB / Manuscript</button>
          <button type="button" class="btn-subtle" onclick="downloadProvenanceCsv()">Download CSV</button>
        </div>
      </div>

      <h1>{escape_html(title)}</h1>
      <p class="subtitle-line">Sponsor: <strong>{escape_html(sponsor)}</strong> · Conditions: <strong>{escape_html("; ".join(ident.get("conditions", [])))}</strong></p>

      <div class="synopsis-box">
        <div class="synopsis-header">
          <span class="synopsis-label">Clinical Trial Synopsis (IB / Literature Ready)</span>
          <button type="button" class="btn-subtle" id="btnCopySyn" onclick="copySynopsis()" style="padding:3px 10px; font-size:11.5px;">Copy Synopsis</button>
        </div>
        <p class="synopsis-text" id="synopsisText">{escape_html(synopsis_text)}</p>
      </div>

      <div class="glance-grid">
        <div class="glance-card">
          <div class="glance-label">Investigational Regimen</div>
          <div class="glance-val">{escape_html(regimen_str)}</div>
        </div>
        <div class="glance-card">
          <div class="glance-label">Dose-Escalation Design</div>
          <div class="glance-val">{escape_html(design_glance)}</div>
        </div>
        <div class="glance-card">
          <div class="glance-label">DLT &amp; Dose-Finding</div>
          <div class="glance-val">{escape_html(dlt_glance)}</div>
        </div>
        <div class="glance-card">
          <div class="glance-label">Footprint &amp; Scale</div>
          <div class="glance-val">{escape_html(dossier["module1"]["participating_countries"].get("render"))}</div>
        </div>
      </div>
    </div>

    {class_matrix_section}

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Study Design &amp; Cohort Structure</div>
          <div class="module-sub">Escalation methodology, treatment arms, and geographic footprint</div>
        </div>
      </div>
      {render_clean_section_rows(m1_specs)}
    </div>

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Dosing, Safety &amp; DLT Endpoints</div>
          <div class="module-sub">Primary safety endpoints, DLT evaluation window, MTD, and RP2D objectives</div>
        </div>
      </div>
      {render_clean_section_rows(m3_specs)}
    </div>

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Patient Eligibility &amp; Organ Function Criteria</div>
          <div class="module-sub">Key hematologic, renal, hepatic, cardiac, and washout criteria reported in the registry</div>
        </div>
      </div>
      {render_clean_eligibility(dossier["module2"])}
    </div>

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Official Registry Record &amp; Published Literature</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field-label">ClinicalTrials.gov Record</div>
        <div>
          <a href="{dossier['module4']['nct_url']}" target="_blank" rel="noopener noreferrer" class="doc-link">
            Open {escape_html(nct_id)} on ClinicalTrials.gov &nearr;
          </a>
        </div>
      </div>
      {f"""<div class="field-row">
        <div class="field-label">Peer-Reviewed Publications</div>
        <div>
          {''.join([f'<a href="https://pubmed.ncbi.nlm.nih.gov/{p}/" target="_blank" rel="noopener noreferrer" class="doc-link" style="margin-right:16px;">PubMed PMID: {p} &nearr;</a>' for p in dossier['module4']['pmids']])}
        </div>
      </div>""" if has_pmids else ""}
    </div>

    <footer>
      <div><strong>ClinSight™</strong> · Primary Registry Fact Base &middot; <a href="https://pract.eu" style="color:inherit; text-decoration:underline;">PRACT</a></div>
      <div>
        <a href="../../explorer/">Explorer</a> &middot;
        <a href="../../compare/">Comparator</a> &middot;
        <a href="../../jobs/">Careers</a> &middot;
        <a href="../../sitemap.xml">Sitemap</a>
      </div>
    </footer>
  </main>

  <script>
    const DOSSIER_NCT = {json.dumps(nct_id)};
    const EXPORT_ROWS = {export_json_str};

    function copySynopsis() {{
      const text = document.getElementById('synopsisText').innerText;
      navigator.clipboard.writeText(text).then(() => {{
        const btn = document.getElementById('btnCopySyn');
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {{ btn.textContent = old; }}, 2000);
      }});
    }}

    function copyProvenanceMarkdown() {{
      let lines = [
        `### ${{DOSSIER_NCT}} — Clinical Protocol Summary`,
        `| Section | Parameter | Value / Statement |`,
        `|---|---|---|`
      ];
      for (const r of EXPORT_ROWS) {{
        const cleanVal = String(r[3] || '').replace(/\\|/g, '\\\\|');
        lines.push(`| ${{r[0]}} | ${{r[1]}} | ${{cleanVal}} |`);
      }}
      navigator.clipboard.writeText(lines.join('\\n')).then(() => {{
        const btn = document.getElementById('btnCopyMd');
        const old = btn.textContent;
        btn.textContent = 'Copied Table!';
        setTimeout(() => {{ btn.textContent = old; }}, 2000);
      }});
    }}

    function downloadProvenanceCsv() {{
      const headers = ['nct_id', 'section', 'parameter', 'value_or_statement'];
      const csvRows = [headers.join(',')];
      for (const r of EXPORT_ROWS) {{
        const rowVals = [DOSSIER_NCT, r[0], r[1], r[3] || ''].map(
          v => `"${{String(v).replace(/"/g, '""')}}"`
        );
        csvRows.push(rowVals.join(','));
      }}
      const blob = new Blob([csvRows.join('\\n')], {{ type: 'text/csv;charset=utf-8;' }});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${{DOSSIER_NCT}}_Protocol_Summary.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }}
  </script>
</body>
</html>'''

def render_target_hub_html(verified_dossiers):
    matrix_html = build_cross_trial_matrix_html(verified_dossiers, current_nct=None, rel_prefix="../../")

    class_export_rows = []
    for d in verified_dossiers:
        for r in build_dossier_export_payload(d):
            class_export_rows.append([d["identity"]["nctId"], r[0], r[1], r[2], r[3], r[4]])
    class_export_json = json.dumps(class_export_rows)

    class_synopsis = (
        "Two small-molecule inhibitors targeting the m6A RNA methyltransferase METTL3 have advanced into human oncology trials: "
        "STORM Therapeutics' STC-15 and Epics Therapeutics' EP102. STC-15 completed its 4-cohort first-in-human Phase 1 monotherapy "
        "dose-escalation trial in advanced solid tumors (NCT05584111; 3+3 design with modified Fibonacci increments across 6 US centers; "
        "PMID: 40751015) and is now in an international Phase 1b/2 combination trial with the anti-PD-1 antibody toripalimab "
        "(NCT06975293; 3+3 dose escalation followed by Simon's two-stage expansion in NSCLC, HNSCC, melanoma, and endometrial cancer "
        "across 21 sites in the US, UK, and Australia). Epics Therapeutics' EP102 is recruiting a first-in-human Phase 1/2 trial "
        "(NCT07163325 across 6 sites in Belgium, France, and Spain) utilizing a Bayesian Optimal Interval (BOIN) dose-escalation "
        "design with a 21-day DLT assessment window, evaluating EP102 both as monotherapy in solid and myeloid malignancies and in "
        "combination cohorts with pembrolizumab or azacitidine plus venetoclax."
    )

    cards_html = ""
    for d in verified_dossiers:
        ident = d["identity"]
        nct = ident["nctId"]
        h_info = HUMAN_LAB_SUMMARY.get(nct, {})
        cards_html += f'''
        <div class="module-card" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:10px;">
            <div>
              <div class="badge-row" style="margin-bottom:8px;">
                <span class="badge badge-nct">{escape_html(nct)}</span>
                <span class="badge badge-phase">{escape_html(ident["phase"])}</span>
                <span class="badge badge-status">{escape_html(ident["status"])}</span>
              </div>
              <h2 style="font-size:18px; color:var(--text-high); font-weight:700; margin-bottom:4px;">{escape_html(ident["briefTitle"])}</h2>
              <div style="font-size:13px; color:var(--text-low);">Sponsor: <strong style="color:var(--text-med);">{escape_html(ident["leadSponsor"])}</strong> · Regimen: <strong style="color:var(--text-med);">{escape_html(h_info.get("regimen", ""))}</strong></div>
            </div>
            <a href="../../trials/{escape_html(nct)}/" class="btn-export" style="padding:8px 14px; font-size:12.5px;">View Trial Synopsis &amp; Details &rarr;</a>
          </div>
          <p style="font-size:14px; color:var(--text-med); line-height:1.6; margin-top:8px;">{escape_html(h_info.get("synopsis", ""))}</p>
        </div>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>METTL3 Inhibitors in Oncology (STC-15 vs EP102) — Clinical Trial Comparison | ClinSight</title>
  <meta name="description" content="Side-by-side clinical trial comparison of oral METTL3 RNA methyltransferase inhibitors STC-15 (STORM Therapeutics) and EP102 (Epics Therapeutics): dose escalation (BOIN vs 3+3), DLT windows, combinations, and patient eligibility.">
  <link rel="canonical" href="{BASE_URL}/targets/mettl3-inhibitors/">
  <style>{SHARED_CSS}</style>
</head>
<body>
  {render_nav(rel_prefix="../../", active="compare")}

  <main class="container">
    <div class="identity-band">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div class="badge-row">
          <span class="badge badge-class">MECHANISM CLASS COMPARISON</span>
          <span class="badge badge-phase">RNA EPIGENETICS · METTL3 INHIBITORS</span>
          <span class="badge badge-nct">3 INTERVENTIONAL TRIALS (STC-15 &amp; EP102)</span>
        </div>
        <div class="toolbar-group">
          <button type="button" class="btn-export" id="btnCopyClassMd" onclick="copyClassMarkdown()">Copy Comparison Table (Markdown)</button>
        </div>
      </div>

      <h1>METTL3 RNA Methyltransferase Inhibitors — Clinical Trial Landscape</h1>
      <p class="subtitle-line">
        Side-by-side comparison of all clinical-stage interventional trials evaluating oral METTL3 inhibitors (<strong>STC-15</strong> and <strong>EP102</strong>) across dose-escalation designs, DLT windows, combination regimens, and patient eligibility criteria.
      </p>

      <div class="synopsis-box">
        <div class="synopsis-header">
          <span class="synopsis-label">Executive Class Synopsis (Manuscript / IB Background Ready)</span>
          <button type="button" class="btn-subtle" id="btnCopyClassSyn" onclick="copyClassSynopsis()" style="padding:3px 10px; font-size:11.5px;">Copy Class Synopsis</button>
        </div>
        <p class="synopsis-text" id="classSynopsisText">{escape_html(class_synopsis)}</p>
      </div>
    </div>

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Side-by-Side Protocol Comparison: STC-15 vs. EP102</div>
          <div class="module-sub">Compare trial design, escalation rules, DLT windows, combinations, and eligibility across all 3 clinical studies on one screen</div>
        </div>
      </div>
      {matrix_html}
    </div>

    <div class="module-card">
      <div class="module-header-wrap">
        <div>
          <div class="module-title">Individual Trial Synopses</div>
          <div class="module-sub">Concise clinical summaries and direct links to each trial's full breakdown</div>
        </div>
      </div>
      {cards_html}
      <div class="undisclosed-note">
        <strong>Note on non-interventional registry records:</strong> A fourth ClinicalTrials.gov record mentioning METTL3 (<code>NCT06762925</code>, Xijing Hospital) is an observational biomarker tissue study with no drug intervention and is therefore excluded from this interventional drug comparison.
      </div>
    </div>

    <footer>
      <div><strong>ClinSight™</strong> · Primary Registry Fact Base &middot; <a href="https://pract.eu" style="color:inherit; text-decoration:underline;">PRACT</a></div>
      <div>
        <a href="../../explorer/">Explorer</a> &middot;
        <a href="../../compare/">Comparator</a> &middot;
        <a href="../../jobs/">Careers</a> &middot;
        <a href="../../sitemap.xml">Sitemap</a>
      </div>
    </footer>
  </main>

  <script>
    const CLASS_EXPORT_ROWS = {class_export_json};

    function copyClassSynopsis() {{
      const text = document.getElementById('classSynopsisText').innerText;
      navigator.clipboard.writeText(text).then(() => {{
        const btn = document.getElementById('btnCopyClassSyn');
        const old = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {{ btn.textContent = old; }}, 2000);
      }});
    }}

    function copyClassMarkdown() {{
      let lines = [
        `### METTL3 Inhibitor Clinical Trial Comparison (STC-15 & EP102)`,
        `| NCT ID | Section | Parameter | Value / Statement | Registry Field |`,
        `|---|---|---|---|---|`
      ];
      for (const r of CLASS_EXPORT_ROWS) {{
        const cleanVal = String(r[4] || '').replace(/\\|/g, '\\\\|');
        lines.push(`| ${{r[0]}} | ${{r[1]}} | ${{r[2]}} | ${{cleanVal}} | \`${{r[5]}}\` |`);
      }}
      navigator.clipboard.writeText(lines.join('\\n')).then(() => {{
        const btn = document.getElementById('btnCopyClassMd');
        const old = btn.textContent;
        btn.textContent = 'Copied Comparison Table!';
        setTimeout(() => {{ btn.textContent = old; }}, 2000);
      }});
    }}
  </script>
</body>
</html>'''

if __name__ == "__main__":
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        dossiers = json.load(f)

    verified_dossiers = [d for d in dossiers if d["identity"]["nctId"] in VERIFIED_CLASS_NCTS]

    for d in dossiers:
        nct = d["identity"]["nctId"]
        out_dir = os.path.join(TRIALS_DIR, nct)
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "index.html")
        html_out = render_dossier_html(d, verified_dossiers)
        with open(out_file, "w", encoding="utf-8") as out_f:
            out_f.write(html_out)
        print(f"Generated human-first dossier for {nct} at {out_file}")

    os.makedirs(TARGETS_DIR, exist_ok=True)
    hub_file = os.path.join(TARGETS_DIR, "index.html")
    hub_html = render_target_hub_html(verified_dossiers)
    with open(hub_file, "w", encoding="utf-8") as hf:
        hf.write(hub_html)
    print(f"Generated human-first Target Hub at {hub_file}")
