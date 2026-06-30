"""
File Utilities.
Helper functions for file handling and management.
"""

import hashlib
import shutil
from pathlib import Path
from typing import Optional

import config


def save_uploaded_file(uploaded_file) -> Path:
    """
    Save a Streamlit UploadedFile to the uploads directory.

    Args:
        uploaded_file: Streamlit UploadedFile object.

    Returns:
        Path to the saved file.
    """
    dest = config.UPLOAD_DIR / uploaded_file.name

    # Avoid overwriting: append hash if file exists
    if dest.exists():
        file_hash = hashlib.md5(uploaded_file.getvalue()).hexdigest()[:8]
        stem = dest.stem
        suffix = dest.suffix
        dest = config.UPLOAD_DIR / f"{stem}_{file_hash}{suffix}"

    with open(dest, "wb") as f:
        f.write(uploaded_file.getbuffer())

    return dest


def delete_uploaded_file(filename: str) -> bool:
    """Delete an uploaded file."""
    file_path = config.UPLOAD_DIR / filename
    if file_path.exists():
        file_path.unlink()
        return True
    return False


def get_uploaded_files() -> list[Path]:
    """Get list of uploaded files."""
    if not config.UPLOAD_DIR.exists():
        return []
    return sorted(
        [f for f in config.UPLOAD_DIR.iterdir() if f.is_file()],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )


def get_file_type(filename: str) -> str:
    """Determine file type from extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf"
    elif ext in (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"):
        return "image"
    else:
        return "unknown"


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable form."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def cleanup_uploads():
    """Remove all uploaded files."""
    if config.UPLOAD_DIR.exists():
        shutil.rmtree(config.UPLOAD_DIR)
        config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def cleanup_indexes():
    """Remove all saved indexes."""
    if config.INDEX_DIR.exists():
        shutil.rmtree(config.INDEX_DIR)
        config.INDEX_DIR.mkdir(parents=True, exist_ok=True)
