BACKEND_DIR = backend
VENV_DIR = $(BACKEND_DIR)/.venv

.PHONY: create_virtualenv requirements-compile requirements-install

create_virtualenv:
	@if [ ! -d "$(VENV_DIR)" ]; then \
		cd $(BACKEND_DIR) && uv venv; \
		echo "Virtualenv created at $(VENV_DIR)"; \
	else \
		echo "Virtualenv already exists at $(VENV_DIR)"; \
	fi

requirements-compile:
	cd $(BACKEND_DIR) && uv lock

requirements-install:
	cd $(BACKEND_DIR) && uv sync --frozen
