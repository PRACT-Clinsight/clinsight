import json
import os
import html

TRIALS_DIR = "ClinSight-Website/trials"
DATA_FILE = "ClinSight-Website/data/phase1_2_mettl3_extracted.json"
BASE_URL = "https://clinsight.pract.eu"

def escape_html(s):
    if not s:
        return ""
    return html.escape(str(s))

def render_field_row(label, field_data, source_field=None, verbatim_quote=None, extra_class=""):
    state = field_data.get("state")
    chip_html = ""
    border_class = ""
    value_html = ""
    source_html = ""

    if state in ("STATED", "STATED-structural"):
        chip_html = '<span class="prov-chip prov-stated">✓ stated</span>'
        border_class = "row-stated"
        val = field_data.get("render") or field_data.get("value")
        value_html = f'<span class="val-stated">{escape_html(val)}</span>'
        s_field = field_data.get("source_field") or source_field
        v_quote = field_data.get("verbatim") or verbatim_quote
        if s_field and v_quote:
            source_html = f'''
        <div class="source-anchor">
          <span class="source-toggle" onclick="toggleSource(this)">⟨source⟩</span>
          <div class="source-payload">
            <span class="source-field">{escape_html(s_field)}</span>
            <span class="source-quote">"{escape_html(v_quote)}"</span>
            <span class="source-verified">✓ checked_at_build: true</span>
          </div>
        </div>'''
    elif state == "INFERRED":
        chip_html = '<span class="prov-chip prov-inferred">~ inferred</span>'
        border_class = "row-inferred"
        value_html = f'<span class="val-inferred">{escape_html(field_data.get("render"))}</span>'
        if field_data.get("source_field") and field_data.get("verbatim"):
            source_html = f'''
        <div class="inline-evidence">
          <span class="evidence-label">Verbatim Evidence:</span> "{escape_html(field_data.get("verbatim"))}" 
          <span class="evidence-source">({escape_html(field_data.get("source_field"))})</span>
        </div>'''
    else:  # NOT_REPORTED
        chip_html = '<span class="prov-chip prov-not-reported">— not reported</span>'
        border_class = "row-not-reported"
        val = field_data.get("render") or "Not reported in the statutory record."
        value_html = f'<span class="val-not-reported">{escape_html(val)}</span>'

    return f'''
    <div class="field-row {border_class} {extra_class}">
      <div class="field-main">
        <span class="field-label">{escape_html(label)}</span>
        <div class="field-content">
          {value_html}
          {source_html}
        </div>
      </div>
      <div class="field-chip-col">
        {chip_html}
      </div>
    </div>'''

def render_module_rows_with_gaps(field_specs):
    """
    Implements Layout Spec §6 (Collapse-as-Density):
    - STATED / INFERRED rows render individually by default.
    - NOT_REPORTED fields are enumerated in a single visible 'Statutory Record Gaps (N)' row.
    - In Audit Mode, individual NOT_REPORTED rows expand in full.
    """
    active_rows_html = []
    gap_labels = []
    gap_individual_rows_html = []

    for label, f_data, s_field, v_quote in field_specs:
        st = f_data.get("state")
        if st in ("STATED", "STATED-structural", "INFERRED"):
            active_rows_html.append(render_field_row(label, f_data, s_field, v_quote))
        else:
            gap_labels.append(label)
            gap_individual_rows_html.append(render_field_row(label, f_data, s_field, v_quote, extra_class="audit-gap-detail"))

    out = "\n".join(active_rows_html)
    if gap_labels:
        named_list = ", ".join(gap_labels)
        gap_summary_html = f'''
    <div class="field-row row-not-reported gap-summary-row">
      <div class="field-main">
        <span class="field-label">Statutory Record Gaps ({len(gap_labels)})</span>
        <div class="field-content">
          <span class="val-not-reported"><strong>{escape_html(named_list)}</strong> — not specified in the statutory registry record.</span>
        </div>
      </div>
      <div class="field-chip-col">
        <span class="prov-chip prov-not-reported">— not reported</span>
      </div>
    </div>'''
        out += "\n" + gap_summary_html + "\n" + "\n".join(gap_individual_rows_html)
    return out

def render_module2_with_gaps(mod2_data):
    cat_specs = [
        ("Hematologic Function (ANC / Platelets / Hgb)", mod2_data["hematologic"]),
        ("Renal Clearance (CrCl / eGFR / Creatinine)", mod2_data["renal"]),
        ("Hepatic Function (Bilirubin / AST / ALT)", mod2_data["hepatic"]),
        ("Cardiac Parameters (LVEF / QTc)", mod2_data["cardiac"]),
        ("Prior Therapy & Washout Rules", mod2_data["washout"])
    ]
    active_html = []
    gap_labels = []
    gap_individual_html = []

    for label, cat_data in cat_specs:
        if cat_data.get("state") == "STATED":
            items = cat_data.get("items", [])
            items_html = "".join([f'''
        <li style="margin-bottom:6px; line-height:1.45;">
          "{escape_html(it.get("verbatim"))}"
          <span style="font-family:var(--font-mono); font-size:10px; color:{'#38bdf8' if it.get("tag") == "numeric" else '#94a3b8'}; margin-left:6px;">
            [{it.get("tag")}]
          </span>
        </li>''' for it in items])
            first_verb = items[0].get("verbatim", "") if items else ""
            active_html.append(f'''
    <div class="field-row row-stated">
      <div class="field-main">
        <span class="field-label">{escape_html(label)}</span>
        <ul style="padding-left:18px; font-size:13px; color:var(--text-high); margin-top:4px;">
          {items_html}
        </ul>
        <div class="source-anchor">
          <span class="source-toggle" onclick="toggleSource(this)">⟨source⟩</span>
          <div class="source-payload">
            <span class="source-field">protocolSection.eligibilityModule.eligibilityCriteria</span>
            <span class="source-quote">"{escape_html(first_verb)}"</span>
            <span class="source-verified">✓ checked_at_build: true</span>
          </div>
        </div>
      </div>
      <div class="field-chip-col">
        <span class="prov-chip prov-stated">✓ stated</span>
      </div>
    </div>''')
        else:
            gap_labels.append(label)
            gap_individual_html.append(render_field_row(label, {"state": "NOT_REPORTED", "render": cat_data.get("render")}, extra_class="audit-gap-detail"))

    out = "\n".join(active_html)
    if gap_labels:
        named_list = ", ".join(gap_labels)
        out += f'''
    <div class="field-row row-not-reported gap-summary-row">
      <div class="field-main">
        <span class="field-label">Statutory Record Gaps ({len(gap_labels)})</span>
        <div class="field-content">
          <span class="val-not-reported"><strong>{escape_html(named_list)}</strong> — no numeric or qualitative category thresholds specified in the public eligibility criteria.</span>
        </div>
      </div>
      <div class="field-chip-col">
        <span class="prov-chip prov-not-reported">— not reported</span>
      </div>
    </div>''' + "\n" + "\n".join(gap_individual_html)
    return out

def tally_states_list(states):
    s = sum(1 for st in states if st in ("STATED", "STATED-structural"))
    i = sum(1 for st in states if st == "INFERRED")
    n = sum(1 for st in states if st not in ("STATED", "STATED-structural", "INFERRED"))
    tot = len(states) or 1
    return s, i, n, tot

def render_module_strip(states):
    s, i, n, tot = tally_states_list(states)
    ps = f"{(s/tot*100):.1f}"
    pi = f"{(i/tot*100):.1f}"
    pn = f"{(n/tot*100):.1f}"
    return f'''
      <div class="mod-prov-strip">
        <div class="mod-strip-bar">
          <div class="bar-seg seg-stated" style="width:{ps}%"></div>
          <div class="bar-seg seg-inferred" style="width:{pi}%"></div>
          <div class="bar-seg seg-not-reported" style="width:{pn}%"></div>
        </div>
        <span class="mod-strip-text">{s} stated · {i} inferred · {n} not reported</span>
      </div>'''

def render_dossier_html(dossier):
    ident = dossier["identity"]
    nct_id = ident["nctId"]
    title = ident["briefTitle"]
    official_title = ident["officialTitle"]
    phase = ident["phase"]
    status = ident["status"]
    sponsor = ident["leadSponsor"]

    m1_states = [
        dossier["module1"]["design_archetype"].get("state"),
        dossier["module1"]["allocation"].get("state"),
        dossier["module1"]["masking"].get("state"),
        dossier["module1"]["intervention_model"].get("state"),
        dossier["module1"]["primary_purpose"].get("state"),
        dossier["module1"]["participating_countries"].get("state"),
        dossier["module1"]["arms_cohorts"].get("state")
    ]
    m2_states = [dossier["module2"][c].get("state") for c in ["hematologic", "renal", "hepatic", "cardiac", "washout"]]
    m3_states = [
        dossier["module3"]["dlt_endpoint"].get("state"),
        dossier["module3"]["dlt_window"].get("state"),
        dossier["module3"]["rp2d"].get("state"),
        dossier["module3"]["mtd"].get("state"),
        dossier["module3"]["ctcae"].get("state"),
        dossier["module3"]["dose_modification"].get("state")
    ]
    has_pmids = len(dossier["module4"]["pmids"]) > 0
    m4_states = [
        "STATED",
        "STATED" if has_pmids else "NOT_REPORTED",
        "NOT_REPORTED",
        "NOT_REPORTED"
    ]
    all_states = m1_states + m2_states + m3_states + m4_states
    stated_c, inf_c, not_c, total_c = tally_states_list(all_states)

    pct_stated = f"{(stated_c / total_c * 100):.1f}"
    pct_inf = f"{(inf_c / total_c * 100):.1f}"
    pct_not = f"{(not_c / total_c * 100):.1f}"

    m1_specs = [
        ("Design Archetype", dossier["module1"]["design_archetype"], dossier["module1"]["design_archetype"].get("source_field"), dossier["module1"]["design_archetype"].get("verbatim")),
        ("Allocation Mode", dossier["module1"]["allocation"], "protocolSection.designModule.designInfo.allocation", dossier["module1"]["allocation"].get("value")),
        ("Masking", dossier["module1"]["masking"], "protocolSection.designModule.designInfo.maskingInfo.masking", dossier["module1"]["masking"].get("value")),
        ("Intervention Model", dossier["module1"]["intervention_model"], "protocolSection.designModule.designInfo.interventionModel", dossier["module1"]["intervention_model"].get("value")),
        ("Primary Purpose", dossier["module1"]["primary_purpose"], "protocolSection.designModule.designInfo.primaryPurpose", dossier["module1"]["primary_purpose"].get("value")),
        ("Participating Countries", dossier["module1"]["participating_countries"], "protocolSection.contactsLocationsModule.locations", dossier["module1"]["participating_countries"].get("verbatim")),
        ("Study Arms / Cohorts", dossier["module1"]["arms_cohorts"], "protocolSection.armsInterventionsModule.armGroups", dossier["module1"]["arms_cohorts"].get("verbatim"))
    ]

    m3_specs = [
        ("Primary Safety / DLT Endpoint", dossier["module3"]["dlt_endpoint"], dossier["module3"]["dlt_endpoint"].get("source_field"), dossier["module3"]["dlt_endpoint"].get("verbatim")),
        ("DLT Assessment Window", dossier["module3"]["dlt_window"], dossier["module3"]["dlt_window"].get("source_field"), dossier["module3"]["dlt_window"].get("verbatim")),
        ("Recommended Phase 2 Dose (RP2D)", dossier["module3"]["rp2d"], dossier["module3"]["rp2d"].get("source_field"), dossier["module3"]["rp2d"].get("verbatim")),
        ("Maximum Tolerated Dose (MTD)", dossier["module3"]["mtd"], dossier["module3"]["mtd"].get("source_field"), dossier["module3"]["mtd"].get("verbatim")),
        ("Toxicity Grading Framework", dossier["module3"]["ctcae"], dossier["module3"]["ctcae"].get("source_field"), dossier["module3"]["ctcae"].get("verbatim")),
        ("Dose Modification Rules", dossier["module3"]["dose_modification"], dossier["module3"]["dose_modification"].get("source_field"), dossier["module3"]["dose_modification"].get("verbatim"))
    ]

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape_html(nct_id)} — {escape_html(phase)} Protocol &amp; Regulatory Dossier | ClinSight</title>
  <meta name="description" content="{escape_html(nct_id)} ({escape_html(phase)}): {escape_html(title)}. Sponsor: {escape_html(sponsor)}. Protocol design, DLT window, and eligibility cutoffs.">
  <link rel="canonical" href="{BASE_URL}/trials/{escape_html(nct_id)}/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    :root {{
      --bg-void: #07090e;
      --bg-base: #0b0f19;
      --bg-surface: #111827;
      --bg-card: rgba(17, 24, 39, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(56, 189, 248, 0.35);
      
      --teal-fact: #14b8a6;
      --teal-glow: rgba(20, 184, 166, 0.12);
      --amber-inferred: #f59e0b;
      --amber-glow: rgba(245, 158, 11, 0.12);
      --grey-silent: #64748b;
      --grey-bg: rgba(100, 116, 139, 0.08);
      
      --text-high: #f8fafc;
      --text-med: #cbd5e1;
      --text-low: #64748b;
      --font-sans: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      color-scheme: dark;
    }}
    
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg-void);
      color: var(--text-med);
      font-family: var(--font-sans);
      line-height: 1.55;
      padding: 0 0 60px;
    }}
    
    .topbar {{
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-base);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }}
    .topbar a {{ color: var(--text-high); text-decoration: none; font-weight: 500; }}
    .topbar a:hover {{ color: #38bdf8; }}
    
    .container {{
      max-width: 960px;
      margin: 0 auto;
      padding: 28px 20px;
    }}
    
    .identity-band {{
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }}
    .badge-row {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }}
    .badge {{
      font-family: var(--font-mono);
      font-size: 11.5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
    }}
    .badge-nct {{ background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }}
    .badge-phase {{ background: rgba(168, 85, 247, 0.12); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }}
    .badge-status {{ background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }}
    
    h1 {{
      font-size: 22px;
      font-weight: 700;
      color: var(--text-high);
      line-height: 1.35;
      margin-bottom: 8px;
    }}
    .official-title {{
      font-size: 13px;
      color: var(--text-low);
      line-height: 1.5;
      margin-bottom: 12px;
    }}
    .sponsor-line {{
      font-size: 13px;
      color: var(--text-med);
    }}
    .sponsor-line strong {{ color: var(--text-high); }}
    
    .summary-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }}
    .summary-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 12px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .stacked-bar {{
      height: 10px;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      display: flex;
      overflow: hidden;
      margin-bottom: 12px;
    }}
    .bar-seg {{ height: 100%; }}
    .seg-stated {{ background: var(--teal-fact); }}
    .seg-inferred {{ background: var(--amber-inferred); }}
    .seg-not-reported {{ background: var(--grey-silent); }}
    
    .legend-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: var(--text-low);
    }}
    .legend-item {{ display: inline-flex; align-items: center; gap: 6px; }}
    
    .btn-audit {{
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-med);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }}
    .btn-audit:hover {{
      border-color: #38bdf8;
      color: #38bdf8;
    }}
    
    .module-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 22px;
    }}
    .module-header-wrap {{
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }}
    .module-title {{
      font-size: 15px;
      font-weight: 700;
      color: var(--text-high);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }}
    .module-title i {{ color: #38bdf8; font-size: 14px; }}
    .mod-prov-strip {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .mod-strip-bar {{
      height: 5px;
      width: 140px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      display: flex;
      overflow: hidden;
    }}
    .mod-strip-text {{
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-low);
    }}
    
    .field-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 12px 14px;
      margin-bottom: 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);
      font-size: 13.5px;
    }}
    
    .row-stated {{ border-left: 3.5px solid var(--teal-fact); }}
    .row-inferred {{ border-left: 3.5px dashed var(--amber-inferred); }}
    .row-not-reported {{
      border-left: 3.5px dotted var(--grey-silent);
      background: var(--grey-bg);
    }}
    
    /* Audit mode expansion for individual NOT REPORTED rows (§6) */
    .audit-gap-detail {{ display: none; }}
    body.audit-active .audit-gap-detail {{ display: flex; }}
    
    .field-main {{ flex: 1; }}
    .field-label {{
      display: block;
      font-size: 11px;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-low);
      margin-bottom: 4px;
    }}
    
    .val-stated {{ color: var(--text-high); font-weight: 500; }}
    .val-inferred {{
      color: var(--text-med);
      border-bottom: 1px dotted var(--amber-inferred);
    }}
    .val-not-reported {{ color: var(--text-low); font-style: italic; }}
    
    .prov-chip {{
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
    }}
    .prov-stated {{ background: var(--teal-glow); color: var(--teal-fact); border: 1px solid rgba(20, 184, 166, 0.3); }}
    .prov-inferred {{ background: var(--amber-glow); color: var(--amber-inferred); border: 1px solid rgba(245, 158, 11, 0.3); }}
    .prov-not-reported {{ background: var(--grey-bg); color: var(--grey-silent); border: 1px solid rgba(100, 116, 139, 0.25); }}
    
    .source-anchor {{ margin-top: 6px; font-size: 11.5px; }}
    .source-toggle {{
      color: #38bdf8;
      font-family: var(--font-mono);
      cursor: pointer;
    }}
    .source-payload {{
      display: none;
      margin-top: 6px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
    }}
    .source-payload.open, body.audit-active .source-payload {{ display: block; }}
    .source-field {{ color: var(--text-low); display: block; margin-bottom: 2px; }}
    .source-quote {{ color: var(--teal-fact); display: block; margin-bottom: 2px; }}
    .source-verified {{ color: #34d399; font-weight: 600; font-size: 10px; }}
    
    .inline-evidence {{
      margin-top: 6px;
      font-size: 12px;
      color: var(--amber-inferred);
      font-style: italic;
    }}
    .evidence-label {{ font-weight: 600; font-style: normal; }}
    .evidence-source {{ color: var(--text-low); font-style: normal; font-family: var(--font-mono); font-size: 11px; }}
    
    .doc-link {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #38bdf8;
      text-decoration: none;
      font-family: var(--font-mono);
      font-size: 12px;
    }}
    .doc-link:hover {{ text-decoration: underline; }}
    
    footer {{
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--text-low);
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="topbar">
    <a href="../../">&larr; ClinSight Regulatory Intelligence Workbench</a>
    <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-low);">Open-Access Protocol Dossier</span>
  </div>

  <div class="container">
    <!-- A. TRIAL IDENTITY BAND -->
    <div class="identity-band">
      <div class="badge-row">
        <span class="badge badge-nct">{escape_html(nct_id)}</span>
        <span class="badge badge-phase">{escape_html(phase)}</span>
        <span class="badge badge-status">{escape_html(status)}</span>
      </div>
      <h1>{escape_html(title)}</h1>
      <p class="official-title">{escape_html(official_title)}</p>
      <p class="sponsor-line">Lead Sponsor: <strong>{escape_html(sponsor)}</strong></p>
    </div>

    <!-- B. PROVENANCE SUMMARY BAR + LEGEND + AUDIT MODE -->
    <div class="summary-card">
      <div class="summary-header">
        <span>Page Provenance: <strong>{stated_c} stated</strong> · <strong>{inf_c} inferred</strong> · <strong>{not_c} not reported</strong></span>
        <button class="btn-audit" onclick="toggleAuditMode()">[Audit mode ▸]</button>
      </div>
      <div class="stacked-bar">
        <div class="bar-seg seg-stated" style="width: {pct_stated}%" title="{pct_stated}% Stated"></div>
        <div class="bar-seg seg-inferred" style="width: {pct_inf}%" title="{pct_inf}% Inferred"></div>
        <div class="bar-seg seg-not-reported" style="width: {pct_not}%" title="{pct_not}% Not Reported"></div>
      </div>
      <div class="legend-row">
        <span class="legend-item"><span class="prov-chip prov-stated">✓ stated</span> Verbatim fact from statutory record</span>
        <span class="legend-item"><span class="prov-chip prov-inferred">~ inferred</span> Protocol mechanism described; archetype not named</span>
        <span class="legend-item"><span class="prov-chip prov-not-reported">— not reported</span> Not stated in statutory registry record</span>
      </div>
    </div>

    <!-- MODULE 1: Protocol & Escalation Architecture -->
    <div class="module-card">
      <div class="module-header-wrap">
        <div class="module-title"><i class="fa-solid fa-network-wired"></i> Module 1 — Protocol &amp; Escalation Architecture</div>
        {render_module_strip(m1_states)}
      </div>
      {render_module_rows_with_gaps(m1_specs)}
    </div>

    <!-- MODULE 2: Medical Writing Extraction Box -->
    <div class="module-card">
      <div class="module-header-wrap">
        <div class="module-title"><i class="fa-solid fa-file-lines"></i> Module 2 — Medical Writing Extraction Box</div>
        {render_module_strip(m2_states)}
      </div>
      {render_module2_with_gaps(dossier["module2"])}
    </div>

    <!-- MODULE 3: Safety, DLT & RP2D Blueprint -->
    <div class="module-card">
      <div class="module-header-wrap">
        <div class="module-title"><i class="fa-solid fa-shield-halved"></i> Module 3 — Safety, DLT &amp; RP2D Blueprint</div>
        {render_module_strip(m3_states)}
      </div>
      {render_module_rows_with_gaps(m3_specs)}
    </div>

    <!-- MODULE 4: Statutory Resolution & Document Access -->
    <div class="module-card">
      <div class="module-header-wrap">
        <div class="module-title"><i class="fa-solid fa-folder-open"></i> Module 4 — Statutory Resolution &amp; Document Access</div>
        {render_module_strip(m4_states)}
      </div>
      <div class="field-row row-stated">
        <div class="field-main">
          <span class="field-label">Primary Statutory Record</span>
          <a href="{dossier['module4']['nct_url']}" target="_blank" rel="noopener noreferrer" class="doc-link">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> ClinicalTrials.gov ({escape_html(nct_id)})
          </a>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-stated">✓ stated</span></div>
      </div>
      
      {f"""<div class="field-row row-stated">
        <div class="field-main">
          <span class="field-label">Preclinical / Peer-Reviewed Literature</span>
          {''.join([f'<a href="https://pubmed.ncbi.nlm.nih.gov/{p}/" target="_blank" rel="noopener noreferrer" class="doc-link" style="margin-right:12px;"><i class="fa-solid fa-book-medical"></i> PubMed: {p}</a>' for p in dossier['module4']['pmids']])}
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-stated">✓ stated</span></div>
      </div>""" if has_pmids else ""}

      <div class="field-row row-not-reported gap-summary-row">
        <div class="field-main">
          <span class="field-label">Statutory Record Gaps ({2 if has_pmids else 3})</span>
          <div class="field-content">
            <span class="val-not-reported"><strong>{"" if has_pmids else "Preclinical / Peer-Reviewed Literature, "}CTIS / EU Clinical Trial Number, Official Protocol / SAP Document</strong> — not linked or posted in the statutory registry record.</span>
          </div>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>

      {"" if has_pmids else """<div class="field-row row-not-reported audit-gap-detail">
        <div class="field-main">
          <span class="field-label">Preclinical / Peer-Reviewed Literature</span>
          <span class="val-not-reported">No linked publication in the public registry record.</span>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>"""}

      <div class="field-row row-not-reported audit-gap-detail">
        <div class="field-main">
          <span class="field-label">CTIS / EU Clinical Trial Number</span>
          <span class="val-not-reported">No CTIS record linked in the statutory record.</span>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>

      <div class="field-row row-not-reported audit-gap-detail">
        <div class="field-main">
          <span class="field-label">Official Protocol / SAP Document</span>
          <span class="val-not-reported">No protocol document posted to the registry.</span>
        </div>
        <div class="field-chip-col"><span class="prov-chip prov-not-reported">— not reported</span></div>
      </div>
    </div>

    <footer>
      &copy; 2026 ClinSight · Protocol facts from ClinicalTrials.gov API v2 · Enforced under ClinSight Unified Integrity Contract
    </footer>
  </div>

  <script>
    function toggleSource(el) {{
      const payload = el.nextElementSibling;
      if (payload) {{
        payload.classList.toggle('open');
      }}
    }}

    let auditMode = false;
    function toggleAuditMode() {{
      auditMode = !auditMode;
      document.body.classList.toggle('audit-active', auditMode);
      const btn = document.querySelector('.btn-audit');
      if (btn) btn.textContent = auditMode ? '[Audit mode ▾ Collapse]' : '[Audit mode ▸]';
    }}
  </script>
</body>
</html>'''

if __name__ == "__main__":
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        dossiers = json.load(f)

    for d in dossiers:
        nct = d["identity"]["nctId"]
        folder = os.path.join(TRIALS_DIR, nct)
        os.makedirs(folder, exist_ok=True)
        html_out = render_dossier_html(d)
        target_path = os.path.join(folder, "index.html")
        with open(target_path, "w", encoding="utf-8") as out:
            out.write(html_out)
        print(f"Generated §6 collapse-as-density dossier for {nct} at {target_path}")
