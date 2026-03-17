---
name: python-architectures
description: Architectures and design patterns for Python projects skill for python-coder agent. Defines role: Clean/Hexagonal architecture, microservices, event-driven architecture, SOLID principles, design patterns. Use for architectural decisions and design patterns. Load before architecture tasks.
---
# Skill: Python Architectures & Design Patterns

**Полная спецификация по архитектурным паттернам и design patterns для Python проектов**

---

## Ваша Роль

Вы — **Python Architecture & Design Patterns специалист**. Помогаете выбирать правильную архитектуру, реализуете SOLID принципы, применяете design patterns и следите за clean code practices.

---

## Что Вы Делаете Самостоятельно ✅

### Architecture Patterns
- Clean Architecture реализация
- Hexagonal (Ports & Adapters) реализация
- Layered Architecture (MVC, MVP, MVVM)
- Microservices design
- Event-Driven Architecture
- Domain-Driven Design (DDD) basics

### Design Patterns
- Creational Patterns (Singleton, Factory, Builder)
- Structural Patterns (Adapter, Decorator, Facade)
- Behavioral Patterns (Strategy, Observer, Command)
- SOLID Principles реализация
- Code organization best practices

### Code Quality
- Separation of concerns
- Dependency Injection
- Interface segregation
- Testability
- Maintainability

---

## Что Вы Делегируете ❌

- **Infrastructure setup** → `@ml-ops`
- **Database administration** → DBA (complex schema design)
- **DevOps implementation** → DevOps команда
- **Team training** → Architect / Tech Lead

---

## Clean Architecture

### Layers

```
┌─────────────────────────────────────┐
│      Presentation Layer            │  (FastAPI endpoints)
├─────────────────────────────────────┤
│      Application Layer            │  (Use cases, services)
├─────────────────────────────────────┤
│      Domain Layer                │  (Business logic, entities)
├─────────────────────────────────────┤
│      Infrastructure Layer        │  (Database, external APIs)
└─────────────────────────────────────┘
```

### Example Structure

```python
# Domain Layer (pure Python, no dependencies)

# domain/entities/user.py
class User:
    def __init__(self, id: int, email: str, username: str):
        self.id = id
        self.email = email
        self.username = username
    
    def is_active(self) -> bool:
        # Business logic
        return True

# domain/repositories/user_repository.py (interface)
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: int) -> User:
        pass
    
    @abstractmethod
    async def save(self, user: User) -> User:
        pass

# Application Layer

# application/use_cases/create_user.py
class CreateUserUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    async def execute(self, email: str, username: str) -> User:
        # Application logic
        user = User(
            id=self._generate_id(),
            email=email,
            username=username
        )
        return await self.user_repo.save(user)
    
    def _generate_id(self) -> int:
        import random
        return random.randint(1000, 9999)

# Infrastructure Layer

# infrastructure/repositories/sqlalchemy_user_repository.py
class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, db_session):
        self.db_session = db_session
    
    async def get_by_id(self, user_id: int) -> User:
        # Implementation details
        pass
    
    async def save(self, user: User) -> User:
        # Implementation details
        pass

# Presentation Layer

# presentation/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/users")
async def create_user(
    email: str,
    username: str,
    use_case: CreateUserUseCase = Depends(get_create_user_use_case)
):
    user = await use_case.execute(email, username)
    return {"id": user.id, "email": user.email}
```

---

## Hexagonal Architecture (Ports & Adapters)

### Concept

```python
# Domain (Core)

# domain/ports/input_port.py
from abc import ABC, abstractmethod

class CreateUserInputPort(ABC):
    @abstractmethod
    async def create(self, email: str, username: str):
        pass

# domain/ports/output_port.py
class UserRepositoryOutputPort(ABC):
    @abstractmethod
    async def save(self, user):
        pass

# Adapters

# adapters/input/http_adapter.py
class HTTPAdapter:
    def __init__(self, input_port: CreateUserInputPort):
        self.input_port = input_port
    
    async def handle_request(self, email: str, username: str):
        return await self.input_port.create(email, username)

# adapters/output/sqlalchemy_adapter.py
class SQLAlchemyAdapter(UserRepositoryOutputPort):
    def __init__(self, db_session):
        self.db_session = db_session
    
    async def save(self, user):
        # Database implementation
        pass
```

---

## Microservices Architecture

### Service Structure

```
project/
├── services/
│   ├── user-service/
│   │   ├── app/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── order-service/
│   │   └── ...
│   └── notification-service/
│       └── ...
├── api-gateway/
│   └── nginx.conf
└── docker-compose.yml
```

### Inter-Service Communication

```python
# Using gRPC
import grpc
from .proto import user_pb2, user_pb2_grpc

class UserServiceClient:
    def __init__(self, grpc_address: str):
        self.channel = grpc.insecure_channel(grpc_address)
        self.stub = user_pb2_grpc.UserServiceStub(self.channel)
    
    async def get_user(self, user_id: int):
        request = user_pb2.GetUserRequest(user_id=user_id)
        response = self.stub.GetUser(request)
        return response

# Using REST with HTTPX
import httpx

class OrderServiceClient:
    def __init__(self, base_url: str):
        self.client = httpx.AsyncClient()
        self.base_url = base_url
    
    async def create_order(self, user_id: int, items: list):
        response = await self.client.post(
            f"{self.base_url}/orders",
            json={"user_id": user_id, "items": items}
        )
        return response.json()
```

---

## Event-Driven Architecture

### Event Bus Implementation

```python
from typing import Callable, Dict, List
from dataclasses import dataclass

@dataclass
class Event:
    event_type: str
    data: dict

class EventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}
    
    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
    
    async def publish(self, event: Event):
        handlers = self.subscribers.get(event.event_type, [])
        for handler in handlers:
            await handler(event)

# Usage
event_bus = EventBus()

# Event handler
async def send_notification(event: Event):
    print(f"Sending notification: {event.data}")

# Subscribe
event_bus.subscribe("user_created", send_notification)

# Publish
await event_bus.publish(Event(
    event_type="user_created",
    data={"user_id": 123, "email": "user@example.com"}
))
```

---

## SOLID Principles

### Single Responsibility Principle (SRP)

```python
# ❌ Bad: Multiple responsibilities
class UserService:
    def create_user(self, email: str, password: str):
        # Create user
        user = User(email=email, password=password)
        self.db.save(user)
        
        # Send email
        send_email(email, "Welcome!")
        
        # Log
        self.logger.info(f"User created: {email}")

# ✅ Good: Single responsibility per class
class UserRepository:
    def save(self, user: User):
        self.db.save(user)

class EmailService:
    def send_welcome_email(self, email: str):
        send_email(email, "Welcome!")

class LoggingService:
    def log_user_created(self, email: str):
        self.logger.info(f"User created: {email}")

class UserService:
    def __init__(
        self,
        user_repo: UserRepository,
        email_service: EmailService,
        logging_service: LoggingService
    ):
        self.user_repo = user_repo
        self.email_service = email_service
        self.logging_service = logging_service
    
    def create_user(self, email: str, password: str):
        user = User(email=email, password=password)
        self.user_repo.save(user)
        self.email_service.send_welcome_email(email)
        self.logging_service.log_user_created(email)
```

### Open/Closed Principle (OCP)

```python
# ❌ Bad: Need to modify for new types
class DiscountCalculator:
    def calculate(self, customer_type: str, amount: float) -> float:
        if customer_type == "regular":
            return amount * 0.95
        elif customer_type == "premium":
            return amount * 0.90
        # Need to add new if for each new customer type

# ✅ Good: Extensible with new types
class DiscountStrategy(ABC):
    @abstractmethod
    def apply(self, amount: float) -> float:
        pass

class RegularDiscount(DiscountStrategy):
    def apply(self, amount: float) -> float:
        return amount * 0.95

class PremiumDiscount(DiscountStrategy):
    def apply(self, amount: float) -> float:
        return amount * 0.90

class VipDiscount(DiscountStrategy):
    def apply(self, amount: float) -> float:
        return amount * 0.85

class DiscountCalculator:
    def __init__(self, strategy: DiscountStrategy):
        self.strategy = strategy
    
    def calculate(self, amount: float) -> float:
        return self.strategy.apply(amount)

# Usage
calculator = DiscountCalculator(VipDiscount())
discount = calculator.calculate(100.0)
```

### Liskov Substitution Principle (LSP)

```python
# ❌ Bad: Violates LSP
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    
    def set_width(self, width: float):
        self.width = width
    
    def set_height(self, height: float):
        self.height = height

class Square(Rectangle):
    def __init__(self, side: float):
        super().__init__(side, side)
    
    def set_width(self, width: float):
        self.width = width
        self.height = width  # Violates LSP!
    
    def set_height(self, height: float):
        self.width = height
        self.height = height

# ✅ Good: Proper abstraction
class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    
    def area(self) -> float:
        return self.width * self.height

class Square(Shape):
    def __init__(self, side: float):
        self.side = side
    
    def area(self) -> float:
        return self.side ** 2
```

### Interface Segregation Principle (ISP)

```python
# ❌ Bad: Fat interface
class Worker(ABC):
    @abstractmethod
    def work(self):
        pass
    
    @abstractmethod
    def eat(self):
        pass
    
    @abstractmethod
    def sleep(self):
        pass

class Robot(Worker):
    def work(self):
        print("Working...")
    
    def eat(self):
        pass  # Robots don't eat!
    
    def sleep(self):
        pass  # Robots don't sleep!

# ✅ Good: Segregated interfaces
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

class Eatable(ABC):
    @abstractmethod
    def eat(self):
        pass

class Sleepable(ABC):
    @abstractmethod
    def sleep(self):
        pass

class Human(Workable, Eatable, Sleepable):
    def work(self):
        print("Working...")
    
    def eat(self):
        print("Eating...")
    
    def sleep(self):
        print("Sleeping...")

class Robot(Workable):
    def work(self):
        print("Working...")
```

### Dependency Inversion Principle (DIP)

```python
# ❌ Bad: Depends on concrete class
class OrderService:
    def __init__(self):
        self.db = MySQLDatabase()  # High-level depends on low-level
    
    def create_order(self, order: Order):
        self.db.save(order)

# ✅ Good: Depends on abstraction
class OrderService:
    def __init__(self, db: Database):  # Depends on abstraction
        self.db = db
    
    def create_order(self, order: Order):
        self.db.save(order)

# Can now swap implementations
order_service = OrderService(PostgreSQLDatabase())
```

---

## Design Patterns

### Singleton Pattern

```python
class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def connect(self):
        print("Connecting to database...")

# Usage
db1 = DatabaseConnection()
db2 = DatabaseConnection()
assert db1 is db2  # Same instance!
```

### Factory Pattern

```python
class NotificationFactory:
    @staticmethod
    def create(notification_type: str):
        if notification_type == "email":
            return EmailNotification()
        elif notification_type == "sms":
            return SMSNotification()
        elif notification_type == "push":
            return PushNotification()
        else:
            raise ValueError(f"Unknown type: {notification_type}")

class EmailNotification:
    def send(self, message: str):
        print(f"Sending email: {message}")

class SMSNotification:
    def send(self, message: str):
        print(f"Sending SMS: {message}")

# Usage
notification = NotificationFactory.create("email")
notification.send("Hello!")
```

### Strategy Pattern

```python
class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float):
        pass

class CreditCardPayment(PaymentStrategy):
    def pay(self, amount: float):
        print(f"Paid ${amount} with credit card")

class PayPalPayment(PaymentStrategy):
    def pay(self, amount: float):
        print(f"Paid ${amount} with PayPal")

class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy
    
    def process_payment(self, amount: float):
        self.strategy.pay(amount)

# Usage
processor = PaymentProcessor(CreditCardPayment())
processor.process_payment(100.0)
```

### Observer Pattern

```python
from typing import List

class Subject:
    def __init__(self):
        self._observers: List['Observer'] = []
    
    def attach(self, observer: 'Observer'):
        self._observers.append(observer)
    
    def detach(self, observer: 'Observer'):
        self._observers.remove(observer)
    
    def notify(self, message: str):
        for observer in self._observers:
            observer.update(message)

class Observer(ABC):
    @abstractmethod
    def update(self, message: str):
        pass

class EmailNotifier(Observer):
    def update(self, message: str):
        print(f"Email: {message}")

class SMSNotifier(Observer):
    def update(self, message: str):
        print(f"SMS: {message}")

# Usage
subject = Subject()
subject.attach(EmailNotifier())
subject.attach(SMSNotifier())
subject.notify("Order created!")
```

---

## When to Load This Skill

**Load before architecture tasks:**
1. Choosing application architecture
2. Implementing clean/hexagonal architecture
3. Designing microservices
4. Implementing event-driven systems
5. Applying SOLID principles
6. Using design patterns
7. Refactoring legacy code

---

## Architecture Decision Checklist

```markdown
## Architecture Decision Checklist

### Requirements
- [ ] Business requirements clear
- [ ] Technical constraints identified
- [ ] Non-functional requirements defined
- [ ] Scalability requirements known
- [ ] Security requirements known

### Architecture Choice
- [ ] Architecture pattern selected (Clean, Hexagonal, Layered, etc.)
- [ ] Rationale documented
- [ ] Trade-offs analyzed
- [ ] Alternatives considered

### Design Patterns
- [ ] Patterns identified for use
- [ ] SOLID principles applied
- [ ] Separation of concerns
- [ ] Dependency injection configured

### Structure
- [ ] Layers defined
- [ ] Interfaces designed
- [ ] Dependencies managed
- [ ] Testability ensured

### Documentation
- [ ] Architecture diagram created
- [ ] Decision record (ADR) written
- [ ] Design document created
- [ ] Team aligned
```

---

**Вы готовы применять архитектурные паттерны и design patterns!** 🏗️🎨
