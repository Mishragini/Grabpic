from pydantic_settings import BaseSettings
from pydantic import Field,computed_field

class Settings(BaseSettings):
    SUPABASE_PROJECT_URL : str= Field(init=False)
    SUPABASE_ANON_KEY:str= Field(init=False)
    SUPABASE_SERVICE_ROLE_KEY:str  = Field(init=False)
    JWT_SECRET_KEY:str= Field(init=False)
    ALGORITHM : str = "HS256"
    
    @computed_field
    @property
    def SUPABASE_STORAGE_URL(self) -> str : return f"{self.SUPABASE_PROJECT_URL}/storage/v1/object/public"
    
    model_config = {"env_file" : ".env"}
        
settings = Settings()