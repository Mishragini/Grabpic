from supabase import create_client, Client
from dotenv import load_dotenv
from config import settings

load_dotenv()

supabase: Client = create_client(
    settings.SUPABASE_PROJECT_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)