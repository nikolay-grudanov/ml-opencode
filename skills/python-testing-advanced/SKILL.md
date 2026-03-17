---
name: python-testing-advanced
description: Advanced Python testing skill for python-coder agent. Defines role: tox, Hypothesis property-based testing, pytest-asyncio, coverage reporting, multi-env testing. Use for comprehensive testing strategies, test automation, CI/CD integration. Load before advanced testing tasks.
---
# Skill: Advanced Python Testing

**Полная спецификация по продвинутым стратегиям тестирования Python**

---

## Ваша Роль

Вы — **Advanced Testing специалист**. Создаёте comprehensive testing стратегии для production Python приложений.

---

## Что Вы Делаете Самостоятельно ✅

### Multi-Environment Testing
- Настройка tox для multi-Python version testing
- Настройка tox для multi-platform testing
- Настройка tox для multi-database testing

### Property-Based Testing
- Использование Hypothesis для edge cases
- Generation of test data
- Shrinking strategies
- Stateful testing с Hypothesis

### Advanced Pytest
- pytest-asyncio для async кода
- pytest-cov для coverage reporting
- pytest-xdist для parallel testing
- pytest-benchmark для performance testing
- Mocking и fixtures

### Test Organization
- Test structure (unit, integration, e2e)
- Test fixtures и conftest.py
- Parameterized tests
- Test markers

### Coverage Analysis
- Coverage thresholds
- Branch coverage
- Coverage reporting (HTML, XML)
- Coverage исключения

---

## Что Вы Делегируете ❌

- **Model training** → `@jupyter-text`
- **API code** → `@python-async-api`
- **Performance profiling** → `@python-performance-patterns`
- **Security testing** → `@python-security-devops`
- **Code architecture** → `@python-architectures`

---

## Tox (Multi-Environment Testing)

### Настройка Tox

```ini
# tox.ini
[tox]
# Версия tox
minversion = 4.0

# Изолированные окружения
isolated_build = true

# Python версии для тестирования
envlist = py310,py311,py312

# По умолчанию
envlist = py312

[testenv]
# Установка зависимостей
deps =
    pytest>=7.4.0
    pytest-cov>=4.1.0
    pytest-asyncio>=0.21.0
    pytest-xdist>=3.3.0
    hypothesis>=6.80.0

# Команды для тестирования
commands =
    pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html

# Pass переменных окружения
passenv =
    DATABASE_URL
    LOG_LEVEL

setenv =
    PYTHONPATH = {toxinidir}/src
    COVERAGE_FILE = {toxinidir}/.coverage.{envname}

[testenv:lint]
basepython = python3.12
deps = ruff
commands = ruff check src/ tests/

[testenv:type-check]
basepython = python3.12
deps = mypy
commands = mypy src/

[testenv:report]
skip_install = true
deps = coverage[toml]
commands =
    coverage combine
    coverage report
```

### Использование Tox

```bash
# Тестирование на всех Python версиях
tox

# Тестирование на конкретной версии
tox -e py311

# Запуск linting
tox -e lint

# Запуск type checking
tox -e type-check

# Re-create окружений
tox --recreate

# Запуск в параллельном режиме
tox -p auto

# Показать все окружения
tox -l
```

### Tox с GitHub Actions

```yaml
# .github/workflows/tox.yml
name: Tox

on: [push, pull_request]

jobs:
  tox:
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

      - name: Install tox
        run: pip install tox

      - name: Run tox
        run: tox -e py${{ matrix.python-version }}
```

---

## Hypothesis (Property-Based Testing)

### Базовое Использование

```python
# tests/test_calculator.py
from hypothesis import given, strategies as st
import pytest
from src.calculator import Calculator

# Тестируемый класс
calc = Calculator()

# Property-based тест
@given(st.integers(min_value=-100, max_value=100))
def test_addition_commutative(a, b):
    """Свойство: сложение коммутативно"""
    result1 = calc.add(a, b)
    result2 = calc.add(b, a)
    assert result1 == result2

@given(st.integers(min_value=-100, max_value=100))
def test_addition_identity(a):
    """Свойство: сложение с 0"""
    result = calc.add(a, 0)
    assert result == a

@given(st.integers(min_value=-100, max_value=100))
@settings(max_examples=1000)  # 1000 примеров
def test_division_by_zero(a):
    """Свойство: деление на 0 вызывает ошибку"""
    with pytest.raises(ZeroDivisionError):
        calc.divide(a, 0)
```

### Custom Strategies

```python
# tests/test_custom_strategies.py
from hypothesis import given, strategies as st
from src.models import User

# Custom strategy для User
def user_strategy():
    """Генерация валидного User"""
    return st.builds(
        User,
        username=st.text(min_size=3, max_size=20, alphabet=st.characters(ascii_letters=ascii_lowercase)),
        email=st.emails(),
        age=st.integers(min_value=18, max_value=100),
        is_active=st.booleans()
    )

# Использование custom strategy
@given(user=user_strategy())
def test_user_creation(user):
    """Свойство: пользователь создаётся валидно"""
    assert len(user.username) >= 3
    assert len(user.username) <= 20
    assert "@" in user.email
    assert user.age >= 18
```

### Stateful Testing

```python
# tests/test_stateful.py
from hypothesis.stateful import rule, initialize, Bundle, RuleStateMachine
from src.cache import LRUCache

# State machine для тестирования LRU Cache
class LRUCacheStateMachine(RuleStateMachine):
    def __init__(self):
        self.cache = LRUCache(max_size=3)
        self.values = Bundle("values")

    @initialize()
    def init_cache(self):
        return LRUCache(max_size=3)

    @rule(value=st.integers(min_value=1, max_value=100))
    def insert_value(self, values, value):
        self.cache.insert(value)
        return values + (value,)

    @rule()
    def get_value(self, values):
        if not values:
            return
        value = values[0]
        result = self.cache.get(value)
        return values[1:]

    @rule()
    def check_cache_size(self):
        assert len(self.cache) <= 3

    @invariant()
    def cache_contains_all_inserted_values(self):
        for value in self.values:
            assert value in self.cache

# Запуск stateful теста
TestLRUCache = LRUCacheStateMachine.TestCase
```

### Hypothesis Configuration

```python
# conftest.py
from hypothesis import settings

# Настройка Hypothesis
hypothesis_settings = settings(
    max_examples=1000,        # Максимальное количество примеров
    deadline=5000,             # Время на один пример (мс)
    verbosity=2,                # Детализация вывода
    phases=[
        settings.Phase.generate,   # Генерация тестовых данных
        settings.Phase.shrink      # Упрощение примеров
    ],
    stateful_step_count=50,     # Для stateful testing
    deadline=None,               # Отключить deadline для медленных тестов
    suppress_health_check= [      # Предупреждения которые игнорируем
        "too_slow",
        "filter_too_much"
    ]
)
```

---

## Pytest Asyncio

### Async Fixtures

```python
# tests/conftest.py
import pytest
import asyncio
from databases import Database

@pytest.fixture(scope="session")
def event_loop():
    """Event loop для всех async тестов"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db(event_loop):
    """Async database fixture"""
    db = Database("postgresql://test:test@localhost:5432/test_db")
    await db.connect()
    yield db
    await db.disconnect()

@pytest.fixture
async def user_factory(db):
    """Factory для создания пользователей"""
    created_users = []

    async def create_user(**kwargs):
        user = await db.create_user(**kwargs)
        created_users.append(user)
        return user

    yield create_user

    # Cleanup
    for user in created_users:
        await db.delete_user(user.id)
```

### Async Tests

```python
# tests/test_async_api.py
import pytest
from httpx import AsyncClient
from src.api import app

@pytest.mark.asyncio
async def test_health_check():
    """Async health check тест"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_create_user(db, user_factory):
    """Async создание пользователя"""
    user = await user_factory(username="test", email="test@example.com")
    assert user.id is not None

@pytest.mark.asyncio
async def test_user_not_found(db):
    """Async пользователь не найден"""
    with pytest.raises(NotFoundError):
        await db.get_user(user_id=999)
```

### Pytest.ini для Asyncio

```ini
# pytest.ini
[pytest]
# Async mode
asyncio_mode = auto

# Async fixture scope
asyncio_default_fixture_loop_scope = function

# Event loop policy
asyncio_default_auto_loop_scope = function
```

---

## Pytest Coverage

### Coverage Configuration

```ini
# .coveragerc
[run]
# Покрываемые пакеты
source = src

# Путь к отчёту
output = htmlcov/

# Исключения
omit =
    */tests/*
    */__pycache__/*
    */site-packages/*
    */venv/*

[report]
# Пороги
precision = 2
show_missing = true
skip_covered = false

exclude_lines =
    pragma: no cover
    def __repr__
    if TYPE_CHECKING:
    if __name__ == "__main__":

[html]
# Directory для HTML отчёта
directory = htmlcov
```

### Coverage Thresholds

```bash
# Запуск с coverage thresholds
pytest tests/ \
  --cov=src \
  --cov-report=term-missing \
  --cov-fail-under=80 \        # Минимум 80% coverage
  --cov-fail-under=branch \    # Минимум 80% branch coverage
  --cov-branch \                # Включить branch coverage
  --cov-report=xml
```

### Pytest-xdist (Parallel Testing)

```bash
# Запуск тестов параллельно
pytest tests/ -n auto  # Автоматическое количество процессов
# или
pytest tests/ -n 4     # 4 процесса

# Использование с coverage
pytest tests/ -n auto --cov=src --cov-context=test
```

---

## Test Organization

### Структура Тестов

```
tests/
├── conftest.py              # Shared fixtures
├── unit/                     # Unit tests
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_services.py
│   └── test_utils.py
├── integration/              # Integration tests
│   ├── __init__.py
│   ├── test_database.py
│   └── test_api.py
└── e2e/                      # End-to-end tests
    ├── __init__.py
    └── test_user_flow.py
```

### Test Markers

```python
# tests/conftest.py
import pytest

# Маркеры для категоризации тестов
pytest.mark.unit = pytest.mark("unit")
pytest.mark.integration = pytest.mark("integration")
pytest.mark.e2e = pytest.mark("e2e")
pytest.mark.slow = pytest.mark("slow", reason="Tests take > 10 seconds")
pytest.mark.database = pytest.mark("database")
pytest.mark.asyncio = pytest.mark.asyncio
```

```python
# Использование маркеров
import pytest

@pytest.mark.unit
def test_unit_function():
    """Unit test"""
    assert 1 + 1 == 2

@pytest.mark.integration
@pytest.mark.database
def test_database_integration():
    """Integration test"""
    # Тест с реальной базой данных
    pass

@pytest.mark.slow
def test_slow_function():
    """Slow test"""
    pass

# Запуск только unit tests
pytest tests/ -m "unit"

# Запуск всех кроме slow
pytest tests/ -m "not slow"
```

### Parametrized Tests

```python
# tests/test_parametrized.py
import pytest
from src.calculator import Calculator

calc = Calculator()

# Параметризация через pytest.mark.parametrize
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (2, 3, 5),
    (3, 4, 7),
])
def test_addition_parametrized(a, b, expected):
    """Параметризованный тест сложения"""
    result = calc.add(a, b)
    assert result == expected

# Параметризация через Hypothesis
from hypothesis import given, strategies as st

@given(st.integers(min_value=1, max_value=10))
def test_addition_hypothesis(a):
    """Property-based тест сложения"""
    result = calc.add(a, 1)
    assert result > a
```

---

## Mocking и Fixtures

### Pytest Mocking

```python
# tests/test_with_mock.py
from unittest.mock import Mock, patch
from src.external_api import ExternalAPI

def test_with_mock():
    """Тест с mock"""
    mock_api = Mock()
    mock_api.get_data.return_value = {"status": "success"}

    result = mock_api.get_data()
    assert result == {"status": "success"}
    mock_api.get_data.assert_called_once()
```

### Pytest Patch

```python
# tests/test_with_patch.py
from unittest.mock import patch
from src.service import Service

@patch("src.service.external_api_call")
def test_with_patch(mock_api_call):
    """Тест с patch"""
    mock_api_call.return_value = {"data": "test"}

    service = Service()
    result = service.get_external_data()
    assert result == {"data": "test"}
```

---

## Best Practices

### Test Pyramid

```
Unit Tests (быстрые, изолированные)
    ↓
Integration Tests (медленные, с зависимостями)
    ↓
E2E Tests (самые медленные, через API/UI)
```

### Coverage Guidelines

- Unit tests: 80%+ coverage
- Integration tests: 70%+ coverage
- E2E tests: 60%+ coverage
- Critical paths: 95%+ coverage

### Test Naming

- ✅ `test_<function_name>` - для unit tests
- ✅ `test_<feature_name>` - для feature tests
- ✅ Описательные имена: `test_user_login_with_invalid_credentials`
- ❌ Краткие имена: `test_1`, `test_a`

---

## Checklist Перед Использованием

### Tox Setup
- [ ] tox.ini создан
- [ ] Python версии определены (3.10, 3.11, 3.12)
- [ ] Зависимости для тестирования настроены
- [ ] Команды для linting и type checking добавлены

### Hypothesis
- [ ] Hypothesis установлен
- [ ] Property-based тесты написаны
- [ ] Custom стратегии созданы (если нужно)
- [ ] Stateful testing настроено (если нужно)
- [ ] max_examples настроен

### Pytest Asyncio
- [ ] pytest-asyncio установлен
- [ ] pytest.ini настроен (asyncio_mode)
- [ ] Async fixtures созданы
- [ ] Async tests промаркированы

### Coverage
- [ ] pytest-cov настроен
- [ ] Coverage thresholds заданы (80%+)
- [ ] Branch coverage включен
- [ ] Coverage отчёты настроены (HTML, XML)
- [ ] .coveragerc создан

### Test Organization
- [ ] Структура директорий создана (unit/integration/e2e)
- [ ] conftest.py с fixtures создан
- [ ] Test маркеры настроены
- [ ] Параметризованные тесты созданы
- [ ] Mocking настроено (если нужно)

---

**Вы готовы создавать comprehensive testing стратегии!** 🧪✨
