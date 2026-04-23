from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HandyTools"
    app_env: str = "development"
    debug: bool = False

    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "test"
    db_password: str = "test"
    db_name: str = "handy_tools_db"

    stored_documents_dir: str = "stored_documents"
    allowed_extensions: str = ".pdf,.doc,.docx,.xls,.xlsx,.txt"
    max_upload_mb: float = 50.0
    
    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def stored_documents_path(self) -> Path:
        return Path(self.stored_documents_dir)

    @property
    def allowed_extensions_set(self) -> frozenset[str]:
        return frozenset(
            ext.strip().lower()
            for ext in self.allowed_extensions.split(",")
            if ext.strip()
        )

    @property
    def max_upload_bytes(self) -> int:
        return int(self.max_upload_mb * 1_000_000)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
