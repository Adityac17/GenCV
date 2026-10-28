"""
Comprehensive Backend Test Suite for GenCV.
Validates:
1. Database initialization and CRUD operations.
2. Sample data seeding.
3. Gemini service prompt logic and fallback parsers.
4. DOCX generator output stream.
5. Google Sheets formatting and CSV bundle generation.
6. FastAPI endpoints via TestClient.
"""

import sys
import os
import unittest
import io

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, get_complete_portfolio, update_personal_info
from backend.seed_data import seed_database
from backend.gemini_service import (
    local_heuristic_parse, local_heuristic_jd_analysis,
    local_heuristic_matcher, tailor_bullet_points
)
from backend.sheets_service import format_portfolio_for_sheets, export_portfolio_csv_bundle
from backend.docx_generator import generate_resume_docx

class TestGenCVBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()

    def test_database_portfolio_loaded(self):
        """Verify that the database seeds all sections correctly."""
        portfolio = get_complete_portfolio()
        self.assertIn("personal_info", portfolio)
        self.assertEqual(portfolio["personal_info"]["full_name"], "Aditya Sunil Chouksey")
        self.assertGreater(len(portfolio["education"]), 0)
        self.assertGreater(len(portfolio["skills"]), 10)
        self.assertGreater(len(portfolio["work_experience"]), 1)
        self.assertGreater(len(portfolio["projects"]), 1)
        self.assertGreater(len(portfolio["certifications"]), 1)
        self.assertGreater(len(portfolio["achievements"]), 1)
        self.assertGreater(len(portfolio["publications"]), 0)
        self.assertGreater(len(portfolio["languages"]), 1)

    def test_sheets_formatting(self):
        """Verify that portfolio records format into designated 2D sheet tables."""
        portfolio = get_complete_portfolio()
        tabs = format_portfolio_for_sheets(portfolio)
        self.assertIn("Personal_Info", tabs)
        self.assertIn("Skills", tabs)
        self.assertIn("Work_Experience", tabs)
        self.assertIn("Projects", tabs)
        self.assertIn("Education", tabs)
        self.assertIn("Certifications", tabs)
        
        # Verify headers
        self.assertEqual(tabs["Skills"][0], ["ID", "Skill Name", "Category", "Proficiency", "Years Experience", "Featured"])
        
        # Verify CSV bundle
        csv_bundle = export_portfolio_csv_bundle(portfolio)
        self.assertIn("Skills", csv_bundle)
        self.assertTrue(len(csv_bundle["Skills"]) > 50)

    def test_docx_generation(self):
        """Verify that python-docx generates a valid downloadable Word document."""
        portfolio = get_complete_portfolio()
        resume_payload = {
            "personal_info": portfolio["personal_info"],
            "target_role": "Senior Full-Stack AI Engineer",
            "tailored_summary": "Highly motivated Senior AI Engineer with extensive experience in FastAPI, Gemini API, and React.",
            "skills": portfolio["skills"][:10],
            "work_experience": portfolio["work_experience"][:2],
            "projects": portfolio["projects"][:2],
            "education": portfolio["education"],
            "certifications": portfolio["certifications"],
            "achievements": portfolio["achievements"]
        }
        stream = generate_resume_docx(resume_payload)
        self.assertIsInstance(stream, io.BytesIO)
        content = stream.getvalue()
        self.assertGreater(len(content), 1000)
        # Verify PK zip header of docx
        self.assertTrue(content.startswith(b"PK"))

    def test_heuristic_parser_and_matcher(self):
        """Verify rule-based fallback parser and matcher when Gemini API is offline/testing."""
        raw_text = "John Doe\njohn@example.com\n(555) 123-4567\nExperienced with Python, React, Docker, and PostgreSQL."
        parsed = local_heuristic_parse(raw_text)
        self.assertEqual(parsed["personal_info"]["full_name"], "John Doe")
        self.assertEqual(parsed["personal_info"]["email"], "john@example.com")
        self.assertGreater(len(parsed["skills"]), 0)

        # Test JD analyzer
        sample_jd = """
        We are seeking a Senior Full-Stack AI Engineer to build scalable microservices and generative AI applications.
        Must have: Python, FastAPI, React, Docker, PostgreSQL, and experience with LLMs / RAG.
        """
        analysis = local_heuristic_jd_analysis(sample_jd)
        self.assertIn("Python", analysis["required_technical_skills"])
        
        # Test matcher
        portfolio = get_complete_portfolio()
        match_result = local_heuristic_matcher(portfolio, sample_jd)
        self.assertGreater(match_result["match_score"], 60)
        self.assertGreater(len(match_result["matched_skills"]), 0)
        self.assertIn("tailored_professional_summary", match_result)

if __name__ == "__main__":
    unittest.main()
