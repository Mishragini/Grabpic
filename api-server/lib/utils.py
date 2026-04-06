import secrets

def generate_invite_code():
    return secrets.token_hex(6)