"""
High-Fidelity Microsoft Word (.docx) Resume Generator for GenCV.
Uses python-docx to generate clean, ATS-compliant, professionally styled resumes
tailored to the target role and selected parameters.
"""

import io
from typing import Dict, Any, List
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

import re

# Palette (Executive Monochrome & Slate)
PRIMARY_COLOR = RGBColor(15, 23, 42)     # Slate 900 (Bold Black/Slate)
ACCENT_COLOR = RGBColor(51, 65, 85)      # Slate 700 (Refined Charcoal Accent)
MUTED_COLOR = RGBColor(100, 116, 139)    # Slate 500
TEXT_COLOR = RGBColor(30, 41, 59)        # Slate 800

METRIC_PATTERN = re.compile(r'(\b\d+[\d,\.]*(?:%|x|\+|k|M|ms|s|users|stars|events/sec|metrics/sec)?\b)')

def add_formatted_bullet_runs(paragraph, text: str, font_name="Arial", font_size=Pt(9.5), text_color=TEXT_COLOR):
    """
    Parses bullet text, automatically highlighting key quantitative metrics and **bold** markdown
    so recruiters can scan achievements in 6-8 seconds.
    """
    if not text:
        return
        
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            bold_text = part[2:-2]
            run = paragraph.add_run(bold_text)
            run.font.name = font_name
            run.font.size = font_size
            run.font.bold = True
            run.font.color.rgb = PRIMARY_COLOR
        else:
            subparts = METRIC_PATTERN.split(part)
            for sub in subparts:
                if not sub:
                    continue
                if METRIC_PATTERN.fullmatch(sub) and not re.fullmatch(r'^\d{1,2}$', sub):
                    run = paragraph.add_run(sub)
                    run.font.name = font_name
                    run.font.size = font_size
                    run.font.bold = True
                    run.font.color.rgb = PRIMARY_COLOR
                else:
                    run = paragraph.add_run(sub)
                    run.font.name = font_name
                    run.font.size = font_size
                    run.font.bold = False
                    run.font.color.rgb = text_color

def set_cell_margins(cell, top=50, bottom=50, left=50, right=50):
    """Set inner cell padding in XML."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_heading_with_divider(doc: Document, text: str, compact: bool = True):
    """Add styled uppercase section heading with a bottom border or underline."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6 if compact else 9)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text.upper())
    run.font.name = "Arial"
    run.font.size = Pt(10.5 if compact else 11)
    run.font.bold = True
    run.font.color.rgb = ACCENT_COLOR
    
    # Add a thin horizontal divider line
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6') # 0.75 pt
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'CBD5E1') # Light slate
    pBdr.append(bottom)
    p._p.get_or_add_pPr().append(pBdr)

def generate_resume_docx(resume_data: Dict[str, Any]) -> io.BytesIO:
    """
    Generate an ATS-friendly, beautifully structured DOCX document from resume data.
    Supports compact 1-page density mode and metric highlighting for optimal recruiter scanning.
    Returns a BytesIO stream ready to download.
    """
    doc = Document()
    
    is_compact = resume_data.get("density", "compact") == "compact"
    
    # Page Margins (0.5 in for compact 1-page density, 0.65 for detailed)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.5 if is_compact else 0.6)
        section.bottom_margin = Inches(0.5 if is_compact else 0.6)
        section.left_margin = Inches(0.6 if is_compact else 0.65)
        section.right_margin = Inches(0.6 if is_compact else 0.65)
        
    personal = resume_data.get("personal_info", {})
    
    # 1. Candidate Name (Header)
    p_name = doc.add_paragraph()
    p_name.paragraph_format.space_before = Pt(0)
    p_name.paragraph_format.space_after = Pt(1 if is_compact else 2)
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_name = p_name.add_run(personal.get("full_name", "Professional Name"))
    run_name.font.name = "Arial"
    run_name.font.size = Pt(18 if is_compact else 20)
    run_name.font.bold = True
    run_name.font.color.rgb = PRIMARY_COLOR
    
    # Target Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(3 if is_compact else 4)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    target_role = resume_data.get("target_role") or personal.get("professional_title", "")
    run_title = p_title.add_run(target_role)
    run_title.font.name = "Arial"
    run_title.font.size = Pt(10.5 if is_compact else 11)
    run_title.font.bold = True
    run_title.font.color.rgb = ACCENT_COLOR
    
    # Contact Row
    contact_parts = []
    if personal.get("email"):
        contact_parts.append(personal.get("email"))
    if personal.get("phone"):
        contact_parts.append(personal.get("phone"))
    if personal.get("location"):
        contact_parts.append(personal.get("location"))
    if personal.get("linkedin_url"):
        contact_parts.append("LinkedIn")
    if personal.get("github_url"):
        contact_parts.append("GitHub")
    if personal.get("portfolio_url"):
        contact_parts.append("Portfolio")
        
    p_contact = doc.add_paragraph()
    p_contact.paragraph_format.space_before = Pt(0)
    p_contact.paragraph_format.space_after = Pt(5 if is_compact else 8)
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_contact = p_contact.add_run("  •  ".join(contact_parts))
    run_contact.font.name = "Arial"
    run_contact.font.size = Pt(9)
    run_contact.font.color.rgb = MUTED_COLOR

    # Section Order configuration (default: summary -> skills -> experience -> projects -> education)
    section_order = resume_data.get("section_order", ["summary", "skills", "experience", "projects", "education"])

    def render_summary():
        summary = resume_data.get("tailored_summary") or personal.get("professional_summary") or personal.get("career_objective")
        if summary:
            add_heading_with_divider(doc, "Professional Summary", compact=is_compact)
            p_sum = doc.add_paragraph()
            p_sum.paragraph_format.space_before = Pt(2 if is_compact else 3)
            p_sum.paragraph_format.space_after = Pt(4 if is_compact else 6)
            p_sum.paragraph_format.line_spacing = 1.12 if is_compact else 1.15
            add_formatted_bullet_runs(p_sum, summary, font_name="Arial", font_size=Pt(9.5), text_color=TEXT_COLOR)

    def render_skills():
        skills = resume_data.get("skills", [])
        if skills:
            add_heading_with_divider(doc, "Technical Expertise", compact=is_compact)
            categories = {}
            for s in skills:
                cat = s.get("category", "Core")
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(s.get("name"))
                
            for cat_name, skill_list in categories.items():
                p_cat = doc.add_paragraph()
                p_cat.paragraph_format.space_before = Pt(0.5 if is_compact else 1)
                p_cat.paragraph_format.space_after = Pt(1.5 if is_compact else 2)
                p_cat.paragraph_format.line_spacing = 1.1
                
                run_cat = p_cat.add_run(f"•  {cat_name}: ")
                run_cat.font.name = "Arial"
                run_cat.font.size = Pt(9)
                run_cat.font.bold = True
                run_cat.font.color.rgb = PRIMARY_COLOR
                
                run_items = p_cat.add_run(", ".join(skill_list))
                run_items.font.name = "Arial"
                run_items.font.size = Pt(9)
                run_items.font.color.rgb = TEXT_COLOR

    def render_experience():
        experiences = resume_data.get("work_experience", [])
        if experiences:
            add_heading_with_divider(doc, "Professional Experience", compact=is_compact)
            exp_list = experiences[:2] if (is_compact and len(experiences) > 2) else experiences
            for exp in exp_list:
                p_exp = doc.add_paragraph()
                p_exp.paragraph_format.space_before = Pt(3.5 if is_compact else 5)
                p_exp.paragraph_format.space_after = Pt(1)
                p_exp.paragraph_format.keep_with_next = True
                
                run_pos = p_exp.add_run(exp.get("position", ""))
                run_pos.font.name = "Arial"
                run_pos.font.size = Pt(10)
                run_pos.font.bold = True
                run_pos.font.color.rgb = PRIMARY_COLOR
                
                run_comp = p_exp.add_run(f" — {exp.get('company', '')}")
                run_comp.font.name = "Arial"
                run_comp.font.size = Pt(9.5)
                run_comp.font.color.rgb = ACCENT_COLOR
                
                dates = f"{exp.get('start_date', '')} – {'Present' if exp.get('is_current') else exp.get('end_date', '')}"
                if exp.get('location'):
                    dates = f"{dates} | {exp.get('location')}"
                run_dates = p_exp.add_run(f"\t{dates}")
                run_dates.font.name = "Arial"
                run_dates.font.size = Pt(8.5)
                run_dates.font.color.rgb = MUTED_COLOR
                
                if exp.get("technologies") and not is_compact:
                    p_tech = doc.add_paragraph()
                    p_tech.paragraph_format.space_before = Pt(0)
                    p_tech.paragraph_format.space_after = Pt(1.5)
                    run_tech_label = p_tech.add_run("Technologies: ")
                    run_tech_label.font.name = "Arial"
                    run_tech_label.font.size = Pt(8)
                    run_tech_label.font.italic = True
                    run_tech_label.font.color.rgb = MUTED_COLOR
                    run_tech_val = p_tech.add_run(", ".join(exp.get("technologies")))
                    run_tech_val.font.name = "Arial"
                    run_tech_val.font.size = Pt(8)
                    run_tech_val.font.color.rgb = TEXT_COLOR
                    
                bullets = exp.get("bullet_points", [])
                b_list = bullets[:2] if (is_compact and len(bullets) > 2) else bullets
                for bullet in b_list:
                    p_b = doc.add_paragraph(style='List Bullet')
                    p_b.paragraph_format.space_before = Pt(0.5)
                    p_b.paragraph_format.space_after = Pt(1)
                    p_b.paragraph_format.line_spacing = 1.12
                    add_formatted_bullet_runs(p_b, bullet, font_name="Arial", font_size=Pt(9), text_color=TEXT_COLOR)

    def render_projects():
        projects = resume_data.get("projects", [])
        if projects:
            add_heading_with_divider(doc, "Key Projects & Systems", compact=is_compact)
            proj_list = projects[:2] if (is_compact and len(projects) > 2) else projects
            for proj in proj_list:
                p_proj = doc.add_paragraph()
                p_proj.paragraph_format.space_before = Pt(3.5 if is_compact else 5)
                p_proj.paragraph_format.space_after = Pt(1)
                p_proj.paragraph_format.keep_with_next = True
                
                run_title = p_proj.add_run(proj.get("title", ""))
                run_title.font.name = "Arial"
                run_title.font.size = Pt(10)
                run_title.font.bold = True
                run_title.font.color.rgb = PRIMARY_COLOR
                
                if proj.get("role"):
                    run_role = p_proj.add_run(f" ({proj.get('role')})")
                    run_role.font.name = "Arial"
                    run_role.font.size = Pt(9)
                    run_role.font.italic = True
                    run_role.font.color.rgb = MUTED_COLOR
                    
                tech_str = ", ".join(proj.get("tech_stack", []))
                if tech_str:
                    p_proj_tech = doc.add_paragraph()
                    p_proj_tech.paragraph_format.space_before = Pt(0)
                    p_proj_tech.paragraph_format.space_after = Pt(1)
                    r_pt = p_proj_tech.add_run(f"Stack: {tech_str}")
                    r_pt.font.name = "Arial"
                    r_pt.font.size = Pt(8)
                    r_pt.font.color.rgb = ACCENT_COLOR
                    
                bullets = proj.get("bullet_points", [])
                b_list = bullets[:2] if (is_compact and len(bullets) > 2) else bullets
                for bullet in b_list:
                    p_b = doc.add_paragraph(style='List Bullet')
                    p_b.paragraph_format.space_before = Pt(0.5)
                    p_b.paragraph_format.space_after = Pt(1)
                    p_b.paragraph_format.line_spacing = 1.12
                    add_formatted_bullet_runs(p_b, bullet, font_name="Arial", font_size=Pt(9), text_color=TEXT_COLOR)

    def render_education():
        education = resume_data.get("education", [])
        certs = resume_data.get("certifications", [])
        achievements = resume_data.get("achievements", [])
        if education or certs or achievements:
            add_heading_with_divider(doc, "Education & Certifications", compact=is_compact)
            edu_list = education[:1] if (is_compact and len(education) > 1) else education
            for edu in edu_list:
                p_edu = doc.add_paragraph()
                p_edu.paragraph_format.space_before = Pt(2.5 if is_compact else 4)
                p_edu.paragraph_format.space_after = Pt(1)
                
                run_deg = p_edu.add_run(f"{edu.get('degree', '')} in {edu.get('field_of_study', '')}")
                run_deg.font.name = "Arial"
                run_deg.font.size = Pt(9.5)
                run_deg.font.bold = True
                run_deg.font.color.rgb = PRIMARY_COLOR
                
                run_inst = p_edu.add_run(f" — {edu.get('institution', '')}")
                run_inst.font.name = "Arial"
                run_inst.font.size = Pt(9)
                run_inst.font.color.rgb = TEXT_COLOR
                
                dates = f"{edu.get('start_date', '')} – {edu.get('end_date', '')}"
                run_dates = p_edu.add_run(f"\t{dates}")
                run_dates.font.name = "Arial"
                run_dates.font.size = Pt(8.5)
                run_dates.font.color.rgb = MUTED_COLOR
                
                if (edu.get("highlights") or edu.get("gpa")) and not is_compact:
                    p_extra = doc.add_paragraph()
                    p_extra.paragraph_format.space_before = Pt(0)
                    p_extra.paragraph_format.space_after = Pt(2)
                    extra_text = []
                    if edu.get("gpa"):
                        extra_text.append(f"GPA: {edu.get('gpa')}")
                    if edu.get("highlights"):
                        extra_text.append(edu.get("highlights"))
                    run_ex = p_extra.add_run(" | ".join(extra_text))
                    run_ex.font.name = "Arial"
                    run_ex.font.size = Pt(8)
                    run_ex.font.color.rgb = MUTED_COLOR

            cert_list = certs[:2] if (is_compact and len(certs) > 2) else certs
            for c in cert_list:
                p_c = doc.add_paragraph(style='List Bullet')
                p_c.paragraph_format.space_before = Pt(0.5)
                p_c.paragraph_format.space_after = Pt(1)
                run_c = p_c.add_run(f"{c.get('name')} — {c.get('issuing_organization')} ({c.get('issue_date')})")
                run_c.font.name = "Arial"
                run_c.font.size = Pt(9)
                run_c.font.color.rgb = TEXT_COLOR
                
            ach_list = achievements[:1] if (is_compact and len(achievements) > 1) else achievements
            for a in ach_list:
                p_a = doc.add_paragraph(style='List Bullet')
                p_a.paragraph_format.space_before = Pt(0.5)
                p_a.paragraph_format.space_after = Pt(1)
                run_a = p_a.add_run(f"{a.get('title')} — {a.get('issuer')} ({a.get('date')})")
                run_a.font.name = "Arial"
                run_a.font.size = Pt(9)
                run_a.font.color.rgb = TEXT_COLOR

    # Map of modular renderers
    render_map = {
        "summary": render_summary,
        "skills": render_skills,
        "experience": render_experience,
        "projects": render_projects,
        "education": render_education
    }

    # Execute renderers in the specified dynamic section order
    for sec_name in section_order:
        if sec_name in render_map:
            render_map[sec_name]()

    # Save to memory buffer
    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream
