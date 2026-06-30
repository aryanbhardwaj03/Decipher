"""
OCR Engine.
Handles text extraction from scanned PDFs and images using EasyOCR.
"""

import io
import logging
from pathlib import Path

from PIL import Image

import config

logger = logging.getLogger(__name__)

# Lazy-load easyocr to avoid slow import at startup
_reader = None


def _get_reader():
    """Lazy-load the EasyOCR reader."""
    global _reader
    if _reader is None:
        import easyocr
        logger.info(f"Initializing EasyOCR with languages: {config.OCR_LANGUAGES}")
        _reader = easyocr.Reader(config.OCR_LANGUAGES, gpu=config.OCR_GPU)
        logger.info("EasyOCR initialized.")
    return _reader


class OCREngine:
    """OCR engine for scanned documents and images."""

    def __init__(self):
        self._reader = None

    @property
    def reader(self):
        if self._reader is None:
            self._reader = _get_reader()
        return self._reader

    def process_image(self, image: Image.Image) -> str:
        """
        Extract text from a PIL Image.

        Args:
            image: PIL Image to process.

        Returns:
            Extracted text.
        """
        import numpy as np

        # Convert PIL Image to numpy array
        img_array = np.array(image)

        results = self.reader.readtext(img_array, detail=0, paragraph=True)
        return "\n".join(results)

    def process_image_file(self, file_path: str | Path) -> str:
        """Extract text from an image file."""
        image = Image.open(str(file_path))
        return self.process_image(image)

    def process_pdf(self, file_path: str | Path) -> str:
        """
        Extract text from a scanned PDF using OCR.
        Converts each page to an image and runs OCR.
        """
        import fitz

        file_path = Path(file_path)
        all_text = []

        doc = fitz.open(str(file_path))
        for page_num in range(len(doc)):
            page = doc[page_num]

            # Render page as image (higher DPI = better OCR)
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

            # OCR the page image
            page_text = self.process_image(image)
            if page_text.strip():
                all_text.append(f"--- Page {page_num + 1} ---\n{page_text}")

        doc.close()

        full_text = "\n\n".join(all_text)
        logger.info(
            f"OCR extracted {len(full_text)} characters from {file_path.name}"
        )
        return full_text

    def process_pdf_pages(self, file_path: str | Path) -> dict[int, str]:
        """
        Extract text from a scanned PDF, returning per-page results.

        Returns:
            Dict mapping page number (1-indexed) to extracted text.
        """
        import fitz

        file_path = Path(file_path)
        page_texts = {}

        doc = fitz.open(str(file_path))
        for page_num in range(len(doc)):
            page = doc[page_num]

            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

            text = self.process_image(image)
            page_texts[page_num + 1] = text

        doc.close()
        return page_texts
