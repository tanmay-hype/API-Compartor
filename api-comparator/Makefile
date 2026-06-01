install:
	python -m pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --port 8000

test:
	pytest tests/ -v --asyncio-mode=auto

lint:
	ruff check app/ tests/ || true

format:
	ruff format app/ tests/ || true
