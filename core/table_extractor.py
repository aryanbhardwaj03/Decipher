"""
Table Extractor.
Enhanced table extraction from PDFs with markdown formatting.
"""

import logging
from pathlib import Path

import pdfplumber

logger = logging.getLogger(__name__)


class TableExtractor:
    """Extracts and formats tables from PDF documents."""

    def extract_tables(self, file_path: str | Path) -> list[dict]:
        """
        Extract all tables from a PDF.

        Returns:
            List of dicts with 'text' (markdown), 'page', 'index', 'raw' (list of lists).
        """
        file_path = Path(file_path)
        tables = []

        try:
            with pdfplumber.open(str(file_path)) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    page_tables = page.extract_tables()
                    for table_idx, table in enumerate(page_tables):
                        if not table or len(table) < 2:
                            continue

                        md = self._to_markdown(table)
                        if md.strip():
                            tables.append({
                                "text": md,
                                "page": page_num,
                                "index": table_idx,
                                "raw": table,
                                "rows": len(table),
                                "cols": len(table[0]) if table[0] else 0,
                            })

            logger.info(f"Extracted {len(tables)} tables from {file_path.name}")
        except Exception as e:
            logger.error(f"Table extraction failed for {file_path.name}: {e}")

        return tables

    @staticmethod
    def _to_markdown(table: list[list]) -> str:
        """Convert a raw table to markdown format."""
        if not table or not table[0]:
            return ""

        # Clean cells
        def clean(cell):
            if cell is None:
                return ""
            return str(cell).strip().replace("|", "\\|").replace("\n", " ")

        header = [clean(c) for c in table[0]]
        num_cols = len(header)

        lines = [
            "| " + " | ".join(header) + " |",
            "| " + " | ".join(["---"] * num_cols) + " |",
        ]

        for row in table[1:]:
            cleaned = [clean(c) for c in row]
            # Pad/trim to match header columns
            while len(cleaned) < num_cols:
                cleaned.append("")
            cleaned = cleaned[:num_cols]
            lines.append("| " + " | ".join(cleaned) + " |")

        return "\n".join(lines)

    @staticmethod
    def table_to_text(table: list[list]) -> str:
        """Convert a raw table to plain text (for embedding)."""
        if not table:
            return ""

        rows_text = []
        header = table[0] if table else []
        for row_idx, row in enumerate(table):
            cells = [str(c).strip() if c else "" for c in row]
            if row_idx == 0:
                rows_text.append("Headers: " + ", ".join(cells))
            else:
                pairs = []
                for i, cell in enumerate(cells):
                    col_name = str(header[i]).strip() if i < len(header) and header[i] else f"Col{i}"
                    if cell:
                        pairs.append(f"{col_name}: {cell}")
                rows_text.append(f"Row {row_idx}: " + ", ".join(pairs))

        return "\n".join(rows_text)
