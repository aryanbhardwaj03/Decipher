"""
Document Processing Pipeline.
Handles PDF text extraction, image extraction, and text chunking.
"""

import io
import logging
from pathlib import Path
from typing import Optional

# pyrefly: ignore [missing-import]
import fitz  # PyMuPDF
# pyrefly: ignore [missing-import]
import pdfplumber
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter

import config

logger = logging.getLogger(__name__)


class DocumentChunk:
    """Represents a chunk of text from a document with metadata."""

    def __init__(self, text: str, metadata: dict):
        self.text = text
        self.metadata = metadata

    def __repr__(self):
        return f"DocumentChunk(source={self.metadata.get('source', '?')}, page={self.metadata.get('page', '?')}, len={len(self.text)})"


class DocumentProcessor:
    """Processes PDFs and images into text chunks for RAG."""

    def __init__(
        self,
        chunk_size: int = config.CHUNK_SIZE,
        chunk_overlap: int = config.CHUNK_OVERLAP,
    ):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def process_pdf(self, file_path: str | Path) -> dict:
        """
        Process a PDF file and extract text, images, and tables.

        Returns:
            dict with keys: 'chunks', 'images', 'tables', 'metadata'
        """
        file_path = Path(file_path)
        logger.info(f"Processing PDF: {file_path.name}")

        result = {
            "chunks": [],
            "images": [],
            "tables": [],
            "metadata": {
                "source": file_path.name,
                "total_pages": 0,
                "file_size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
            },
        }

        # Extract text with PyMuPDF
        text_by_page = self._extract_text_pymupdf(file_path)
        result["metadata"]["total_pages"] = len(text_by_page)

        # Extract images
        result["images"] = self._extract_images_pymupdf(file_path)

        # Extract tables with pdfplumber
        result["tables"] = self._extract_tables(file_path)

        # Chunk the text
        for page_num, page_text in text_by_page.items():
            if not page_text.strip():
                continue

            chunks = self.text_splitter.split_text(page_text)
            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    metadata={
                        "source": file_path.name,
                        "page": page_num,
                        "chunk_index": i,
                        "type": "text",
                    },
                )
                result["chunks"].append(chunk)

        # Add table text as chunks
        for table_info in result["tables"]:
            chunk = DocumentChunk(
                text=table_info["text"],
                metadata={
                    "source": file_path.name,
                    "page": table_info["page"],
                    "chunk_index": 0,
                    "type": "table",
                },
            )
            result["chunks"].append(chunk)

        logger.info(
            f"Processed {file_path.name}: {len(result['chunks'])} chunks, "
            f"{len(result['images'])} images, {len(result['tables'])} tables"
        )
        return result

    def process_image(self, file_path: str | Path) -> dict:
        """Process a standalone image file."""
        file_path = Path(file_path)
        image = Image.open(file_path)

        return {
            "chunks": [],
            "images": [
                {
                    "image": image,
                    "page": 1,
                    "index": 0,
                    "source": file_path.name,
                }
            ],
            "tables": [],
            "metadata": {
                "source": file_path.name,
                "type": "image",
                "size": image.size,
            },
        }

    def _extract_text_pymupdf(self, file_path: Path) -> dict:
        """Extract text from each page using PyMuPDF."""
        text_by_page = {}
        try:
            doc = fitz.open(str(file_path))
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                text_by_page[page_num + 1] = text
            doc.close()
        except Exception as e:
            logger.error(f"PyMuPDF text extraction failed: {e}")
        return text_by_page

    def _extract_images_pymupdf(self, file_path: Path) -> list:
        """Extract images from PDF using PyMuPDF."""
        images = []
        try:
            doc = fitz.open(str(file_path))
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)

                for img_index, img_info in enumerate(image_list):
                    xref = img_info[0]
                    try:
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image = Image.open(io.BytesIO(image_bytes))

                        # Skip very small images (likely icons/bullets)
                        if image.width < 50 or image.height < 50:
                            continue

                        images.append(
                            {
                                "image": image,
                                "page": page_num + 1,
                                "index": img_index,
                                "source": file_path.name,
                                "size": (image.width, image.height),
                            }
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to extract image {img_index} from page {page_num + 1}: {e}"
                        )
            doc.close()
        except Exception as e:
            logger.error(f"Image extraction failed: {e}")
        return images

    def _extract_tables(self, file_path: Path) -> list:
        """Extract tables from PDF using pdfplumber."""
        tables = []
        try:
            with pdfplumber.open(str(file_path)) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    page_tables = page.extract_tables()
                    for table_index, table in enumerate(page_tables):
                        if not table:
                            continue
                        # Convert table to markdown format
                        md_table = self._table_to_markdown(table)
                        if md_table.strip():
                            tables.append(
                                {
                                    "text": md_table,
                                    "page": page_num,
                                    "index": table_index,
                                    "raw": table,
                                }
                            )
        except Exception as e:
            logger.error(f"Table extraction failed: {e}")
        return tables

    @staticmethod
    def _table_to_markdown(table: list) -> str:
        """Convert a table (list of lists) to markdown format."""
        if not table or not table[0]:
            return ""

        # Clean cells
        cleaned = []
        for row in table:
            cleaned_row = [str(cell).strip() if cell else "" for cell in row]
            cleaned.append(cleaned_row)

        # Build markdown
        lines = []
        # Header
        lines.append("| " + " | ".join(cleaned[0]) + " |")
        lines.append("| " + " | ".join(["---"] * len(cleaned[0])) + " |")
        # Body
        for row in cleaned[1:]:
            # Pad row if needed
            while len(row) < len(cleaned[0]):
                row.append("")
            lines.append("| " + " | ".join(row[: len(cleaned[0])]) + " |")

        return "\n".join(lines)

    def is_scanned_pdf(self, file_path: str | Path) -> bool:
        """Check if a PDF is scanned (image-only, no extractable text)."""
        file_path = Path(file_path)
        try:
            doc = fitz.open(str(file_path))
            total_text = ""
            for page_num in range(min(3, len(doc))):  # Check first 3 pages
                total_text += doc[page_num].get_text("text")
            doc.close()
            # If very little text found, likely scanned
            return len(total_text.strip()) < 50
        except Exception:
            return False
