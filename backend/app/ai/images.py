from __future__ import annotations

import base64
from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def _generated_images_directory() -> Path:
  directory = Path(settings.generated_images_dir)
  # If the configured path is relative, resolve it relative to the backend root.
  if not directory.is_absolute():
    backend_root = Path(__file__).resolve().parents[2]
    directory = (backend_root / settings.generated_images_dir).resolve()
  directory.mkdir(parents=True, exist_ok=True)
  return directory


def _svg_placeholder(image_prompt: str) -> str:
    escaped_prompt = (
        image_prompt.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' viewBox='0 0 1200 1200'>
  <defs>
    <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#0F766E'/>
      <stop offset='50%' stop-color='#1D4ED8'/>
      <stop offset='100%' stop-color='#111827'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='1200' rx='64' fill='url(#bg)'/>
  <rect x='72' y='72' width='1056' height='1056' rx='48' fill='rgba(255,255,255,0.08)' stroke='rgba(255,255,255,0.14)'/>
  <text x='96' y='180' fill='#FFFFFF' font-family='Arial, Helvetica, sans-serif' font-size='58' font-weight='700'>AI Image Draft</text>
  <text x='96' y='270' fill='#D1FAE5' font-family='Arial, Helvetica, sans-serif' font-size='34'>Generated from prompt</text>
  <foreignObject x='96' y='340' width='1008' height='700'>
    <div xmlns='http://www.w3.org/1999/xhtml' style='color:#F9FAFB;font-family:Arial, Helvetica, sans-serif;font-size:30px;line-height:1.5;'>
      {escaped_prompt}
    </div>
  </foreignObject>
</svg>"""


def _save_bytes(image_bytes: bytes, suffix: str) -> tuple[str, str]:
    directory = _generated_images_directory()
    filename = f"{uuid4().hex}{suffix}"
    file_path = directory / filename
    file_path.write_bytes(image_bytes)
    path_str = str(file_path)
    # Public URL path served by the backend static mount
    url_path = f"/generated/images/{filename}"
    return url_path, path_str


def generate_mock_image(image_prompt: str) -> tuple[str, str]:
    svg_bytes = _svg_placeholder(image_prompt).encode("utf-8")
    return _save_bytes(svg_bytes, ".svg")


def decode_base64_image(image_data: str | bytes, suffix: str = ".png") -> tuple[str, str]:
    if isinstance(image_data, bytes):
        binary = image_data
    else:
        binary = base64.b64decode(image_data)
    return _save_bytes(binary, suffix)