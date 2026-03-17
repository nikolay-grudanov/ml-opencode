---
name: python-async-api
description: Async API development skill for python-coder agent. Defines role: FastAPI, Pydantic v2, SQLAlchemy async, modern async Python patterns. Use for async API development, validation, database operations, middleware. Load before async API tasks.
---
# Skill: Async API Development (FastAPI + Pydantic + SQLAlchemy)

**Полная спецификация по разработке production-grade асинхронных API на Python**

---

## Ваша Роль

Вы — **Async API Development специалист**. Разрабатываете высокопроизводительные асинхронные API с использованием FastAPI, Pydantic v2 и SQLAlchemy async.

---

## Что Вы Делаете Самостоятельно ✅

### API Architecture
- Создание FastAPI приложений с async routing
- Организация структуры проекта (routers, models, schemas, services)
- Dependency injection паттерны
- Middleware конфигурация
- CORS и security настройки

### Data Validation & Schemas
- Pydantic v2 модели (v2 models, validators, serializers)
- Complex nested schemas
- Custom validators
- Response models
- Query parameter validation

### Database Operations
- SQLAlchemy async models
- Async sessions и transactions
- Repository pattern реализация
- Migrations с Alembic async
- Connection pooling настройка

### Authentication & Authorization
- JWT токены (async)
- OAuth2 flows
- Permission-based access control
- Rate limiting
- API key authentication

### Error Handling
- Custom exception handlers
- Consistent error responses
- Validation error formatting
- Global exception handling

### Performance
- Async database queries
- Caching стратегии (Redis)
- Pagination оптимизация
- Background tasks (Celery, FastAPI BackgroundTasks)
- Streaming responses

---

## Что Вы Делегируете ❌

- **Deployment & DevOps** → `@ml-ops` или `@python-production-tooling`
- **Security auditing** → `@python-security-devops`
- **Frontend integration** → Пользователь сам (или другой специалист)
- **Database schema design** → Иногда требует DBA экспертизы
- **Model business logic** → Domain expert (если сложная бизнес-логика)

---

## FastAPI Основы

### Минимальное Приложение

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="My API",
    description="Production-ready API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Структура Проекта

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Configuration (Pydantic Settings)
│   ├── dependencies.py      # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py    # API router
│   │   │   └── endpoints/
│   │   │       ├── __init__.py
│   │   │       ├── users.py
│   │   │       └── items.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py          # Base model class
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # Pydantic models
│   │   └── item.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── item_service.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py          # Base repository
│   │   ├── user_repo.py
│   │   └── item_repo.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py      # JWT, hashing
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── middleware.py   # Custom middleware
│   └── db/
│       ├── __init__.py
│       ├── session.py       # Async session
│       └── base.py          # SQLAlchemy base
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api/
│   └── test_services/
├── pyproject.toml
└── alembic.ini
```

---

## Pydantic v2 Модели

### Базовые Модели

```python
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

# Базовая модель с общими полями
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class UserWithItems(User):
    items: List["Item"] = []

class ItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class Item(ItemBase):
    id: int
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### Custom Validators

```python
from pydantic import field_validator, model_validator

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    password_confirm: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "UserCreate":
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self
```

---

## SQLAlchemy Async

### Настройка и Базовые Модели

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# app/db/base.py
Base = declarative_base()

# app/db/session.py
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# app/models/user.py
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("Item", back_populates="owner")

# app/models/item.py
class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="items")
```

### Repository Pattern

```python
from typing import Generic, TypeVar, Type, Optional, List
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: int) -> Optional[ModelType]:
        result = await db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType
    ) -> ModelType:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType
    ) -> ModelType:
        obj_data = obj_in.model_dump(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: int) -> Optional[ModelType]:
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

# app/repositories/user_repo.py
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(
        self,
        db: AsyncSession,
        *,
        email: str
    ) -> Optional[User]:
        result = await db.execute(
            select(User).filter(User.email == email)
        )
        return result.scalars().first()

    async def get_by_username(
        self,
        db: AsyncSession,
        *,
        username: str
    ) -> Optional[User]:
        result = await db.execute(
            select(User).filter(User.username == username)
        )
        return result.scalars().first()

user = CRUDUser(User)
```

---

## FastAPI Routers & Endpoints

### API Router Структура

```python
# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, items

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])

# app/api/v1/endpoints/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.repositories.user_repo import user
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    users = await user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate
):
    user_exists = await user.get_by_email(db, email=user_in.email)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return await user.create(db, obj_in=user_in)

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_user = await user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user
```

---

## Authentication & Authorization

### JWT Implementation

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.repositories.user_repo import user
from app.schemas.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def authenticate_user(
    db: AsyncSession,
    *,
    email: str,
    password: str
) -> Optional[User]:
    db_user = await user.get_by_email(db, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db_user = await user.get(db, id=user_id)
    if db_user is None:
        raise credentials_exception
    return db_user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
```

---

## Exception Handling

### Custom Exceptions

```python
# app/core/exceptions.py
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional

class AppException(Exception):
    """Base application exception"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        extra: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)

class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found", extra: Optional[Dict[str, Any]] = None):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, extra)

class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request", extra: Optional[Dict[str, Any]] = None):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail, extra)

# Global exception handlers
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "extra": exc.extra,
            "path": request.url.path,
            "method": request.method,
        }
    )
```

---

## Configuration

### Pydantic Settings

```python
# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "My API"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

---

## Testing Async Endpoints

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import Base

# Test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@pytest.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "Test12345",
            "password_confirm": "Test12345"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data
```

---

## Performance Optimization

### Connection Pooling

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,           # Number of connections to keep open
    max_overflow=40,         # Additional connections when pool is full
    pool_recycle=3600,       # Recycle connections after 1 hour
    pool_timeout=30,         # Wait 30s for connection before raising error
)
```

### Async Caching with Redis

```python
import redis.asyncio as redis
from typing import Optional, Any
import json

class AsyncCache:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        serialized = json.dumps(value)
        return await self.redis.set(key, serialized, ex=expire)

    async def delete(self, key: str) -> bool:
        return await self.redis.delete(key)

cache = AsyncCache(settings.REDIS_URL)
```

---

## When to Load This Skill

**Load before async API tasks:**
1. Creating FastAPI applications
2. Working with Pydantic v2 models
3. Implementing async database operations
4. Setting up authentication/authorization
5. Creating middleware and exception handlers
6. Testing async endpoints

---

**Вы готовы разрабатывать production-grade асинхронные API!** 🚀⚡
