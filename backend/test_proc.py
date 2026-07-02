import sys
import logging
from pathlib import Path
from core.document_processor import UniversalDocumentProcessor

logging.basicConfig(level=logging.INFO)

try:
    processor = UniversalDocumentProcessor()
    print("Processor created")
except Exception as e:
    print(f"FAILED TO CREATE PROCESSOR: {e}")
