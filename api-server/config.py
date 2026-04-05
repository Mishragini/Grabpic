from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    SUPABASE_PROJECT_URL : str= Field(init=False)
    SUPABASE_ANON_KEY:str= Field(init=False)
    SUPABASE_SERVICE_ROLE_KEY:str  = Field(init=False)
    JWT_SECRET_KEY:str= Field(init=False)
    
    class Config:
        env_file=".env"
        
settings = Settings()