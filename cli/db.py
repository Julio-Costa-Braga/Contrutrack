# cli/db.py
# Cliente Supabase partilhado por todos os módulos da CLI
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None

def get_db() -> Client:
    """Devolve (ou cria) o cliente Supabase singleton."""
    global _client
    if _client is None:
        url  = os.environ.get("SUPABASE_URL")
        key  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY "
                "não configuradas. Copia cli/.env.example para cli/.env e preenche."
            )
        _client = create_client(url, key)
    return _client
