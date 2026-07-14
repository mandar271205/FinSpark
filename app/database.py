import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def test_connection() -> bool:
    """Test connection to Supabase database."""
    try:
        # Perform a lightweight query to test connection
        response = supabase.table("fraud_alerts").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return False
