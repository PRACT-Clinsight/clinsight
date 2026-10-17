#!/usr/bin/env python3
"""
Enrich and Compile Master Dataset for all 54 Waves (8,195 trials)
"""

import os
import glob
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, 'data', 'cache')
TRIALS_JSON = os.path.join(BASE_DIR, 'data', 'trials.json')
WAVES_DIR = os.path.join(BASE_DIR, 'waves')

def infer_modality(interventions):
    text = ' '.join(interventions or []).lower()
    if any(k in text for k in ['deruxtecan', 'vedotin', 'govitecan', 'soravtansine', 't-dxd', 't-dm1', 'belantamab', 'polatuzumab', 'datopotamab', 'enfortumab', 'sacituzumab']):
        return 'Antibody-Drug Conjugates (ADC)'
    if any(k in text for k in ['ciloleucel', 'autoleucel', 'vicleucel', 'car-t', 'chimeric antigen', 'ciltacabtagene', 'idecabtagene', 'axicabtagene', 'lisocabtagene', 'tisagenlecleucel']):
        return 'Cell & Gene Therapy (CAR-T)'
    if any(k in text for k in ['teclistamab', 'elranatamab', 'talquetamab', 'epcoritamab', 'glofitamab', 'mosunetuzumab', 'odronextamab', 'blinatumomab', 'bispecific', 't-cell engager', 'bite', 'tarlatamab']):
        return 'Bispecific Antibodies & T-Cell Engagers'
    if any(k in text for k in ['pembrolizumab', 'nivolumab', 'atezolizumab', 'durvalumab', 'ipilimumab', 'cemiplimab', 'tislelizumab', 'toripalimab', 'dostarlimab']):
        return 'Immuno-Oncology (Checkpoint Inhibitor)'
    if any(k in text for k in ['daratumumab', 'isatuximab', 'rituximab', 'obinutuzumab', 'tafasitamab', 'brentuximab', 'inotuzumab', 'trastuzumab', 'pertuzumab', 'cetuximab', 'panitumumab']):
        return 'Targeted Monoclonal Antibodies'
    if any(k in text for k in ['semaglutide', 'tirzepatide', 'retatrutide', 'liraglutide', 'cagrilintide', 'orforglipron', 'glp-1', 'gip']):
        return 'Incretin Mimetics (GLP-1 / GIP)'
    if any(k in text for k in ['venetoclax', 'ibrutinib', 'acalabrutinib', 'zanubrutinib', 'pirtobrutinib', 'midostaurin', 'gilteritinib', 'ivosidenib', 'revumenib', 'bortezomib', 'carfilzomib', 'ixazomib', 'lenalidomide', 'pomalidomide', 'osimertinib', 'sotorasib', 'abemaciclib', 'olaparib', 'asciminib', 'imatinib', 'dasatinib', 'nilotinib', 'ponatinib', 'rucaparib', 'niraparib', 'talazoparib', 'adagrasib']):
        return 'Targeted Therapy (Small Molecule / TKI)'
    return 'Targeted Oncology & Systemic Therapy'

def infer_category(conditions):
    text = ' '.join(conditions or []).lower()
    if any(k in text for k in ['myeloma', 'lymphoma', 'leukemia', 'aml', 'cll', 'dlbcl', 'myelodysplastic', 'myeloproliferative', 'pnh', 'sickle', 'thalassemia', 'hemophilia']):
        return {'category': 'Oncology', 'subtype': 'Hematologic Malignancies'}
    if any(k in text for k in ['breast', 'lung', 'prostate', 'colorectal', 'ovarian', 'pancreatic', 'urothelial', 'melanoma', 'cancer', 'carcinoma', 'sarcoma', 'gastric', 'cervical', 'endometrial']):
        return {'category': 'Oncology', 'subtype': 'Solid Tumors'}
    if any(k in text for k in ['heart failure', 'diabetes', 'obesity', 'weight', 'cardio', 'atherosclero', 'hypertension', 'lipid', 'stroke', 'thrombosis']):
        return {'category': 'Cardiometabolic & Endocrinology', 'subtype': 'Cardiometabolic'}
    if any(k in text for k in ['cystic fibrosis', 'duchenne', 'spinal muscular', 'amyloidosis', 'dmd', 'sma']):
        return {'category': 'Rare & Genetic Diseases', 'subtype': 'Monomorphic / Rare'}
    if any(k in text for k in ['asthma', 'copd', 'psoriasis', 'arthritis', 'lupus', 'dermatitis', 'crohn', 'colitis', 'ibd', 'ankylosing']):
        return {'category': 'Immunology & Respiratory', 'subtype': 'Autoimmune & Inflammatory'}
    if any(k in text for k in ['parkinson', 'alzheimer', 'sclerosis', 'migraine', 'als', 'schizophrenia', 'depression', 'bipolar']):
        return {'category': 'Neurology & Psychiatry', 'subtype': 'CNS & Neurodegeneration'}
    return {'category': 'Specialized Clinical Areas', 'subtype': 'Systemic Disease'}

def transform_record(study):
    p = study.get('protocolSection', {})
    doc_sec = study.get('documentSection', {})
    has_results = study.get('hasResults', False)
    
    nct_id = p.get('identificationModule', {}).get('nctId')
    brief_title = p.get('identificationModule', {}).get('briefTitle', '')
    official_title = p.get('identificationModule', {}).get('officialTitle') or brief_title
    registry_acronym = p.get('identificationModule', {}).get('acronym')
    
    phases = p.get('designModule', {}).get('phases', [])
    phase_str = ' / '.join(phases) if phases else 'Phase Not Specified'
    
    status = p.get('statusModule', {}).get('overallStatus', 'UNKNOWN')
    is_completed = (status == 'COMPLETED')
    
    lead_sponsor = p.get('sponsorCollaboratorsModule', {}).get('leadSponsor', {}).get('name', 'Unknown Sponsor')
    conditions = p.get('conditionsModule', {}).get('conditions', [])
    
    raw_interventions = p.get('armsInterventionsModule', {}).get('interventions', [])
    interventions = [i.get('name') for i in raw_interventions if i.get('name')]
    
    cat_sub = infer_category(conditions)
    modality = infer_modality(interventions)
    
    comp_date_obj = p.get('statusModule', {}).get('completionDateStruct', {})
    completion_date = comp_date_obj.get('date', '2026-12')
    try:
        year = int(completion_date.split('-')[0])
    except:
        year = 2026
        
    enrollment = p.get('designModule', {}).get('enrollmentInfo', {}).get('count', 0)
    
    publications = []
    for r in p.get('referencesModule', {}).get('references', []):
        publications.append({
            'citation': r.get('citation', ''),
            'pmid': r.get('pmid', ''),
            'type': r.get('type', 'REFERENCE')
        })
        
    result_pubs = [r for r in publications if r['type'] == 'RESULT']
    any_pub_with_pmid = next((r for r in publications if r['pmid']), None)
    has_publication = len(result_pubs) > 0 or bool(any_pub_with_pmid)
    primary_pmid = (result_pubs[0]['pmid'] if result_pubs else None) or (any_pub_with_pmid['pmid'] if any_pub_with_pmid else None)
    
    is_results_vacant = is_completed and (not has_results) and (not has_publication)
    
    large_docs = doc_sec.get('largeDocumentModule', {}).get('largeDocs', [])
    protocol_filename = None
    sap_filename = None
    suffix = nct_id[-2:] if nct_id else '00'
    for doc in large_docs:
        if doc.get('hasProtocol') and not protocol_filename and doc.get('filename'):
            protocol_filename = doc['filename']
        if doc.get('hasSap') and not sap_filename and doc.get('filename'):
            sap_filename = doc['filename']
            
    protocol_url = f"https://cdn.clinicaltrials.gov/large-docs/{suffix}/{nct_id}/{protocol_filename}" if protocol_filename else None
    sap_url = f"https://cdn.clinicaltrials.gov/large-docs/{suffix}/{nct_id}/{sap_filename}" if sap_filename else None
    results_url = f"https://clinicaltrials.gov/study/{nct_id}?tab=results" if has_results else None
    registry_url = f"https://clinicaltrials.gov/study/{nct_id}"
    
    primary_outcomes = []
    for o in p.get('outcomesModule', {}).get('primaryOutcomes', []):
        primary_outcomes.append({
            'measure': o.get('measure', ''),
            'description': o.get('description', ''),
            'timeFrame': o.get('timeFrame', '')
        })
        
    raw_criteria = p.get('eligibilityModule', {}).get('eligibilityCriteria', '')
    criteria_parts = re.split(r'Exclusion Criteria:', raw_criteria, flags=re.IGNORECASE)
    inc_text = re.sub(r'Inclusion Criteria:', '', criteria_parts[0], flags=re.IGNORECASE).strip() if criteria_parts else ''
    exc_text = criteria_parts[1].strip() if len(criteria_parts) > 1 else ''
    
    inc_list = [re.sub(r'^[-•*]\s*|^\d+\.\s*', '', s).strip() for s in re.split(r'\n(?=[-•*]|\d+\.)', inc_text) if len(s.strip()) > 5][:8]
    exc_list = [re.sub(r'^[-•*]\s*|^\d+\.\s*', '', s).strip() for s in re.split(r'\n(?=[-•*]|\d+\.)', exc_text) if len(s.strip()) > 5][:8]
    
    return {
        'nctId': nct_id,
        'acronym': registry_acronym,
        'briefTitle': brief_title,
        'officialTitle': official_title,
        'phase': phase_str,
        'status': status,
        'isCompleted': is_completed,
        'sponsor': lead_sponsor,
        'conditions': conditions,
        'interventions': interventions,
        'category': cat_sub['category'],
        'subtype': cat_sub['subtype'],
        'modality': modality,
        'completionDate': completion_date,
        'year': year,
        'enrollment': enrollment,
        'hasResults': has_results,
        'hasPublication': has_publication,
        'isResultsVacant': is_results_vacant,
        'protocolUrl': protocol_url,
        'sapUrl': sap_url,
        'resultsUrl': results_url,
        'registryUrl': registry_url,
        'primaryPmid': primary_pmid,
        'primaryOutcomes': primary_outcomes,
        'inclusionCriteria': inc_list,
        'exclusionCriteria': exc_list,
        'publications': publications
    }

def main():
    cache_files = glob.glob(os.path.join(CACHE_DIR, '*.json'))
    print(f"Reading {len(cache_files)} cached study JSONs...")
    
    all_trials = []
    seen = set()
    
    for i, cf in enumerate(cache_files):
        try:
            with open(cf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                trial = transform_record(data)
                if trial['nctId'] and trial['nctId'] not in seen:
                    seen.add(trial['nctId'])
                    all_trials.append(trial)
        except Exception as e:
            pass
        if (i + 1) % 1000 == 0:
            print(f"Processed {i + 1}/{len(cache_files)}...")

    print(f"Enriched total: {len(all_trials)} distinct trials.")
    
    with open(TRIALS_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_trials, f, indent=2)
        
    print(f"Successfully compiled to {TRIALS_JSON}")

if __name__ == '__main__':
    main()
