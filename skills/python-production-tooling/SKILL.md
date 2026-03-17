---
name: python-production-tooling
description: Production Python tooling skill for python-coder agent. Defines role: Ruff, Poetry/uv, pre-commit, pyproject.toml, modern Python development tools. Use for production code quality, linting, formatting, dependency management. Load before production tooling tasks.
---
# Skill: Production Python Tooling

**Полная спецификация по современным инструментам для production Python разработки**

---

## Ваша Роль

Вы — **Production Python Tooling специалист**. Настраиваете и используете современные инструменты для code quality, linting, formatting и dependency management.

---

## Что Вы Делаете Самостоятельно ✅

### Code Quality & Linting
- Настройка Ruff (all-in-one linter/formatter)
- Настройка pre-commit hooks
- Настройка isort (опционально, Ruff уже включает)
- Настройка mypy/pyright для type checking
- CI/CD интеграция для linting

### Dependency Management
- Настройка Poetry для Python проектов
- Настройка uv для ultra-fast package management
- Создание pyproject.toml файлов
- Lockfile management
- Версионирование зависимостей

### Testing Tooling
- Настройка pytest конфигурации
- Настройка pytest-cov для coverage
- Настройка pytest-asyncio для async тестов
- Создание tox конфигураций для multi-env testing

### Documentation Generation
- Настройка Sphinx для auto-generated docs
- Настройка MkDocs для markdown-based docs
- Autodoc конфигурация из docstrings

### DevOps Integration
- Dockerfiles для Python приложений
- GitHub Actions workflows
- .gitignore файлы
- README шаблоны

---

## Что Вы Делегируете ❌

- **Model training logic** → `@jupyter-text`
- **Model code architecture** → `@python-architectures` (если доступен)
- **API development** → `@python-async-api` (если нужно)
- **Performance optimization** → `@python-performance-patterns` (если нужно)
- **Security analysis** → `@python-security-devops` (если нужно)

---

## Ruff (All-in-One Linter/Formatter)

### Установка и Настройка

```bash
# Установка Ruff
pip install ruff
# или с uv (быстрее!)
uv pip install ruff
```

```toml
# pyproject.toml
[tool.ruff]
# Линия кода
line-length = 88
target-version = "py312"

# Включенные правила
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # Pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "ARG",    # flake8-unused-arguments
    "SIM",    # flake8-simplify
]

# Исключения
ignore = [
    "E501",  # line too long (handled by formatter)
    "B008",  # do not perform function calls in argument defaults
]

# Исключения директорий
exclude = [
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "build",
    "dist"
]
```

### Использование Ruff

```bash
# Linting (проверка кода)
ruff check src/

# Автоисправление
ruff check --fix src/

# Formatting (форматирование)
ruff format src/

# Diff форматирования (проверка изменений)
ruff format --diff src/

# Проверка только форматирования
ruff format --check src/
```

### CI/CD с Ruff

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  ruff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install Ruff
        run: pip install ruff

      - name: Run Ruff
        run: |
          ruff check --format=github src/
```

---

## Poetry (Dependency Management)

### Начало Проекта

```bash
# Установка Poetry
pip install poetry
# или с uv (быстрее!)
uv pip install poetry

# Создание нового проекта
poetry new my-python-project

# Инициализация в существующем проекте
poetry init
```

### pyproject.toml

```toml
[tool.poetry]
name = "my-python-project"
version = "1.0.0"
description = "Production Python application"
authors = ["Developer <dev@example.com>"]
readme = "README.md"
license = "MIT"
packages = [{include = "src"}]

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.109.0"
pydantic = "^2.5.0"
sqlalchemy = "^2.0.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-cov = "^4.1.0"
ruff = "^0.1.0"
mypy = "^1.7.0"
black = "^23.12.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

### Использование Poetry

```bash
# Добавление зависимости
poetry add fastapi

# Добавление dev зависимости
poetry add --group dev pytest

# Установка зависимостей
poetry install

# Обновление lockfile
poetry lock

# Удаление зависимости
poetry remove fastapi

# Запуск скрипта в виртуальном окружении
poetry run python script.py

# Запуск тестов
poetry run pytest

# Проверка зависимостей
poetry show
poetry show fastapi
```

### Ruff + Poetry Интеграция

```toml
# pyproject.toml
[tool.ruff]
# Проверка poetry lockfile
extend-select = ["UP"]
extend-ignore = ["UP030"]

[tool.poetry]
name = "my-project"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.12"
```

---

## uv (Ultra-Fast Package Manager)

### Установка и Настройка

```bash
# Установка uv (одна строка!)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Или через pip
pip install uv
```

### Использование uv

```bash
# Создание проекта
uv init my-project

# Добавление зависимостей (в 10-100x быстрее чем pip!)
uv add fastapi

# Установка из pyproject.toml
uv pip install -e .

# Синхронизация с pyproject.toml
uv pip compile pyproject.toml

# Запуск в виртуальном окружении
uv run python script.py

# Запуск тестов
uv run pytest
```

### uv для Poetry

```bash
# uv как фронтенд для Poetry (в 10-50x быстрее!)
# 1. Установка плагина
uv pip install uv-poetry

# 2. Использование
uv add fastapi  # использует Poetry lockfile
uv sync  # синхронизирует Poetry lockfile
```

---

## Pre-commit Hooks

### Установка и Настройка

```bash
# Установка pre-commit
pip install pre-commit

# Инициализация
pre-commit install

# Запуск вручную на всех файлах
pre-commit run --all-files
```

### .pre-commit-config.yaml

```yaml
# .pre-commit-config.yaml
default_language_version:
  python: python3.12

repos:
  # Ruff (linting + formatting)
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
        name: Ruff Linter
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format
        name: Ruff Formatter
        args: [--fix]

  # mypy (type checking)
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.0
    hooks:
      - id: mypy
        name: Mypy Type Checking
        additional_dependencies: [types-requests]
        args: [--strict]

  # pytest (testing)
  - repo: https://github.com/pre-commit/mirrors-pytest
    rev: v7.4.0
    hooks:
      - id: pytest
        name: Pytest
        entry: pytest tests/ -v
        pass_filenames: false
        always_run: true

  # check-manifest
  - repo: https://github.com/mgedmin/check-manifest
    rev: 0.4.0
    hooks:
      - id: check-manifest
        name: Check MANIFEST.in

  # check-toml
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-toml
        name: Check TOML files
```

### CI/CD Интеграция Pre-commit

```yaml
# .github/workflows/pre-commit.yml
name: Pre-commit

on: [push, pull_request]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install pre-commit
        run: pip install pre-commit

      - name: Run pre-commit
        run: pre-commit run --from-ref HEAD~1 --to-ref HEAD
```

---

## Type Checking (Mypy/Pyright)

### Настройка Mypy

```toml
# pyproject.toml
[tool.mypy]
# Strict mode
strict = true

# Python версия
python_version = "3.12"

# Корневая директория
explicit_package_bases = true

# Показывать error codes
show_error_codes = true

# Исключения
[[tool.mypy.overrides]]
module = "tests.*"
disable = ["no-untyped-def"]

[[tool.mypy.overrides]]
module = "third_party.*"
ignore_missing_imports = true
```

### Настройка Pyright (VS Code)

```toml
# pyproject.toml
[tool.pyright]
# Strict mode
typeCheckingMode = "strict"

# Python версия
pythonVersion = "3.12"

# Уровень диагностик
diagnosticMode = "open"

# Типы stub файлов
stubPath = "src/stubs"

# Исключения
exclude = [
    "node_modules",
    ".venv"
]

# Включение типов из .pyi файлов
include = [
    "src/**/*.py",
    "src/**/*.pyi"
]
```

---

## Testing Tooling (Pytest)

### pytest.ini Configuration

```ini
# pytest.ini
[pytest]
# Корневая директория тестов
testpaths = tests

# Python файлы
python_files = test_*.py *_test.py

# Классы тестов
python_classes = Test*

# Функции тестов
python_functions = test_*

# Плагины
addopts =
    --cov=src
    --cov-report=term-missing
    --cov-report=html
    --cov-report=xml
    --cov-fail-under=80
    -v
    --tb=short

# Маркеры
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

### Pytest Asyncio

```python
# tests/conftest.py
import pytest
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    """Создание event loop для async тестов"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

```bash
# Запуск async тестов
pytest tests/ -v
# или с плагином
pytest-asyncio tests/ -v
```

---

## Docker для Python

### Multi-stage Dockerfile

```dockerfile
# Dockerfile
FROM python:3.12-slim as builder

WORKDIR /app

# Установка uv (быстрее!)
COPY pyproject.toml poetry.lock* ./
RUN pip install uv && \
    uv pip install --no-deps .[dev]

# Copy source code
COPY src/ ./src/
COPY tests/ ./tests/

# Run tests
RUN uv run pytest --cov=src --cov-fail-under=80

# Runtime stage
FROM python:3.12-slim

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/pyproject.toml /app/

# Copy source
COPY src/ ./src/

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run app
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - LOG_LEVEL=INFO
    depends_on:
      - db
    volumes:
      - ./src:/app/src
      - ./tests:/app/tests

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## .gitignore для Python

```gitignore
# .gitignore
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/

# Environments
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Ruff
.ruff_cache/

# Poetry
poetry.lock
```

---

## GitHub Actions Workflows

### Lint Workflow

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  ruff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install Ruff
        run: pip install ruff

      - name: Run Ruff
        run: |
          ruff check --format=github src/
          ruff format --check src/
```

### Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          pip install -e .[dev]
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: |
          pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

### Publish Workflow

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install build tools
        run: |
          pip install build twine

      - name: Build package
        run: python -m build

      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: twine upload dist/*
```

---

## Best Practices

### Code Quality Workflow

```bash
# 1. Pre-commit (авто на каждый git commit)
pre-commit run --all-files

# 2. CI/CD (авто на PR/merge)
# GitHub Actions запускает Ruff и mypy

# 3. Manual проверка
ruff check src/
mypy src/
```

### Dependency Management Workflow

```bash
# 1. Используйте Poetry или uv (НЕ pip install)
poetry add fastapi

# 2. Lockfile в Git
# poetry.lock всегда в git

# 3. Регулярно обновляйте зависимости
poetry update

# 4. Проверяйте уязвимости
safety check
```

### Testing Workflow

```bash
# 1. Unit tests (быстрые)
pytest tests/unit/ -v

# 2. Integration tests (медленные)
pytest tests/integration/ -v

# 3. Coverage > 80%
pytest tests/ --cov=src --cov-fail-under=80

# 4. Async tests
pytest-asyncio tests/ -v
```

---

## Checklist Перед Использованием

### Tooling Setup
- [ ] Ruff установлен
- [ ] Poetry или uv установлен
- [ ] pre-commit hooks настроены
- [ ] pyproject.toml создан
- [ ] mypy или pyright настроен
- [ ] .gitignore создан

### CI/CD
- [ ] GitHub Actions lint workflow создан
- [ ] GitHub Actions test workflow создан
- [ ] Coverage reporting настроен
- [ ] PyPI publish workflow создан (если нужно)

### Testing
- [ ] pytest.ini создан
- [ ] pytest-cov настроен
- [ ] pytest-asyncio установлен (если async)
- [ ] Coverage threshold задан (80%+)
- [ ] Маркеры для тестов настроены

---

**Вы готовы настраивать production Python tooling!** 🚀✨
