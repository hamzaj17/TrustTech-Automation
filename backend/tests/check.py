import sys
sys.path.insert(0, r'C:\Projects\TrustTech_Automation\backend')
from app.core.config import settings
print("AI_GENERATION_MODE=", settings.ai_generation_mode)
print("CLOUDFLARE_WORKER_URL=", settings.cloudflare_worker_url)
print("HAS_CLOUDFLARE_KEY=", bool(settings.cloudflare_api_key))
print("generated_images_dir=", settings.generated_images_dir)
