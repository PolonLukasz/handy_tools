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

    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
