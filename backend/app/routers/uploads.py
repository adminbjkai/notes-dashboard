import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter()

# Upload directory - will be created if it doesn't exist
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions for images
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("")
async def upload_file(file: UploadFile) -> JSONResponse:
    """Upload a file and return its URL."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Generate unique filename to prevent collisions
    ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    # Prevent path traversal
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Write file
    with open(file_path, "wb") as f:
        f.write(content)

    # Return URL (served via /uploads static mount)
    return JSONResponse({
        "url": f"/uploads/{unique_name}",
        "filename": file.filename,
    })
