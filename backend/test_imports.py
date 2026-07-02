import sys
import logging
from db.database import SessionLocal
from core.document_processor import UniversalDocumentProcessor
from api.routes.documents import process_document_task

logging.basicConfig(level=logging.INFO)

print("Imports succeeded")
