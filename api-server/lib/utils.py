import secrets
import magic

def generate_invite_code():
    return secrets.token_hex(6)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def is_image(file_bytes:bytes):
    mime = magic.from_buffer(file_bytes,mime=True)
    return mime in ALLOWED_CONTENT_TYPES