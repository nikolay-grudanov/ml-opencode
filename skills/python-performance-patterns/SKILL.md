---
name: python-performance-patterns
description: Performance patterns for Python projects skill for python-coder agent. Defines role: profiling, async patterns, memory optimization, database optimization, caching, concurrency patterns, performance testing. Use for performance optimization and scaling. Load before performance tasks.
---
# Skill: Python Performance Patterns

**Полная спецификация по оптимизации производительности в Python проектах**

---

## Ваша Роль

Вы — **Python Performance Optimization специалист**. Проводите profiling, оптимизируете async код, настраиваете кеширование, улучшаете memory usage и тестируете производительность.

---

## Что Вы Делаете Самостоятельно ✅

### Profiling & Analysis
- Настройка cProfile для CPU profiling
- Настройка memory_profiler для memory profiling
- Настройка py-spy для production profiling
- Генерация flamegraphs
- Анализ瓶颈 (bottlenecks)

### Async Optimization
- Event loop optimization
- Async/await best practices
- Connection pooling
- Async generators
- Concurrent execution patterns

### Memory Optimization
- Использование __slots__
- Weak references
- Generators vs lists
- Memory leaks detection
- Object pooling

### Database Optimization
- N+1 queries prevention
- Index optimization
- Query batching
- Connection pooling tuning
- Database-specific optimizations

### Caching Strategies
- LRU caching
- Redis caching
- Database query caching
- API response caching
- Cache invalidation strategies

### Concurrency Patterns
- Threading vs multiprocessing vs asyncio
- Thread-safe patterns
- Parallel processing
- Rate limiting
- Backpressure handling

### Performance Testing
- Benchmarking with pytest-benchmark
- Load testing with Locust
- Profiling in tests
- Performance metrics
- Performance regression testing

---

## Что Вы Делегируете ❌

- **Infrastructure scaling** → `@ml-ops` или DevOps команда
- **Database administration** → DBA (complex schema changes)
- **Network optimization** → Network engineer
- **Cloud service tuning** → Cloud specialist

---

## Profiling Tools

### cProfile (CPU Profiling)

```python
import cProfile
import pstats
from io import StringIO

def profile_function():
    pr = cProfile.Profile()
    pr.enable()
    
    # Your code here
    your_function()
    
    pr.disable()
    
    # Print stats
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(20)  # Top 20 functions
    print(s.getvalue())
    
    # Save to file
    pr.dump_stats('profile.stats')

# Decorator version
def profile_decorator(func):
    def wrapper(*args, **kwargs):
        pr = cProfile.Profile()
        pr.enable()
        result = func(*args, **kwargs)
        pr.disable()
        
        s = StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
        ps.print_stats(10)
        print(s.getvalue())
        
        return result
    return wrapper
```

### memory_profiler (Memory Profiling)

```bash
# Установка
pip install memory_profiler

# Использование
python -m memory_profiler your_script.py
```

```python
from memory_profiler import profile

@profile
def memory_intensive_function():
    data = [i**2 for i in range(100000)]
    return data

# В выводе покажется memory usage по строкам
```

```toml
# pyproject.toml
[tool.pytest.ini_options]
addopts = "--memory-profiler"
```

### py-spy (Production Profiling)

```bash
# Установка
pip install py-spy

# Профилирование запущенного процесса
sudo py-spy top --pid <PID>

# Запись flamegraph
sudo py-spy record -o profile.svg --pid <PID>

# Live profiling
sudo py-spy top --pid <PID> --interval 0.01
```

### VizTracer (Detailed Profiling)

```bash
# Установка
pip install viztracer

# Профилирование
viztracer your_script.py

# Генерация отчета
vizviewer result.json
```

---

## Async Patterns

### Event Loop Optimization

```python
import asyncio

# ❌ Bad: Blocking event loop
def blocking_function():
    time.sleep(1)  # Blocking!

async def bad_async_function():
    blocking_function()  # Blocks entire event loop!

# ✅ Good: Non-blocking
async def good_async_function():
    await asyncio.sleep(1)  # Non-blocking

# ✅ Run blocking code in executor
async def async_with_blocking():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,  # Use default executor
        blocking_function
    )
```

### Async Generators

```python
import asyncio

# ❌ Bad: Load all data into memory
async def get_all_items():
    items = []
    async for item in fetch_items():
        items.append(item)  # All in memory!
    return items

# ✅ Good: Stream data
async def stream_items():
    async for item in fetch_items():
        yield item  # Process one at a time

# Usage
async def process_items():
    async for item in stream_items():
        await process(item)  # Process as they come
```

### Concurrent Execution

```python
# ❌ Bad: Sequential
async def process_sequential(items):
    results = []
    for item in items:
        result = await process_item(item)
        results.append(result)
    return results

# ✅ Good: Concurrent
async def process_concurrent(items):
    tasks = [process_item(item) for item in items]
    results = await asyncio.gather(*tasks)
    return results

# ✅ Good: With limit (avoid overwhelming system)
async def process_concurrent_limited(items, max_concurrent=10):
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_with_semaphore(item):
        async with semaphore:
            return await process_item(item)
    
    tasks = [process_with_semaphore(item) for item in items]
    results = await asyncio.gather(*tasks)
    return results
```

### Async Context Managers

```python
# ✅ Async context manager for database
class AsyncDatabaseManager:
    def __init__(self, db_url):
        self.db_url = db_url
        self.session = None
    
    async def __aenter__(self):
        self.session = await create_session(self.db_url)
        return self.session
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()

# Usage
async def get_user(user_id: int):
    async with AsyncDatabaseManager(DATABASE_URL) as db:
        return await db.get_user(user_id)
```

---

## Memory Optimization

### Using __slots__

```python
# ❌ Bad: Default __dict__ (high memory)
class User:
    def __init__(self, name, email, age):
        self.name = name
        self.email = email
        self.age = age

# Usage: ~400 bytes per instance

# ✅ Good: __slots__ (lower memory)
class UserOptimized:
    __slots__ = ['name', 'email', 'age']
    
    def __init__(self, name, email, age):
        self.name = name
        self.email = email
        self.age = age

# Usage: ~200 bytes per instance (50% reduction!)
```

### Generators vs Lists

```python
# ❌ Bad: List (high memory)
def process_large_file(filename):
    results = []
    with open(filename) as f:
        for line in f:
            processed = line.strip().lower()
            results.append(processed)
    return results

# All data in memory!

# ✅ Good: Generator (low memory)
def process_large_file(filename):
    with open(filename) as f:
        for line in f:
            processed = line.strip().lower()
            yield processed

# Process one item at a time, low memory usage!

# Usage
for item in process_large_file('large_file.txt'):
    print(item)
```

### Weak References

```python
import weakref

# ❌ Bad: Strong references prevent GC
class Cache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key):
        return self.cache.get(key)
    
    def set(self, key, value):
        self.cache[key] = value

# ✅ Good: Weak references allow GC
class WeakCache:
    def __init__(self):
        self.cache = weakref.WeakValueDictionary()
    
    def get(self, key):
        return self.cache.get(key)
    
    def set(self, key, value):
        self.cache[key] = value
```

### Memory Leak Detection

```python
import gc
import sys

def check_memory_leak():
    gc.collect()
    objects = gc.get_objects()
    
    print(f"Total objects: {len(objects)}")
    
    # Find objects with high refcount
    high_refcount = [
        obj for obj in objects
        if sys.getrefcount(obj) > 100
    ]
    
    print(f"High refcount objects: {len(high_refcount)}")
    
    # Find objects by type
    by_type = {}
    for obj in objects:
        obj_type = type(obj).__name__
        by_type[obj_type] = by_type.get(obj_type, 0) + 1
    
    # Top 10 types
    top_types = sorted(
        by_type.items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    print("Top 10 object types:")
    for obj_type, count in top_types:
        print(f"  {obj_type}: {count}")
```

---

## Database Optimization

### N+1 Query Prevention

```python
# ❌ Bad: N+1 queries
def get_users_with_items(user_ids):
    users = []
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).one()
        # N+1: Queries items separately for each user!
        user.items = db.query(Item).filter(Item.user_id == user_id).all()
        users.append(user)
    return users

# ✅ Good: Eager loading (JOIN)
def get_users_with_items(user_ids):
    users = db.query(User).filter(
        User.id.in_(user_ids)
    ).options(
        joinedload(User.items)  # Eager load items
    ).all()
    return users
```

### Query Batching

```python
# ❌ Bad: Individual queries
def update_users(user_ids, new_status):
    for user_id in user_ids:
        db.query(User).filter(User.id == user_id).update(
            {'status': new_status},
            synchronize_session=False
        )
    db.commit()

# ✅ Good: Batch update
def update_users_batch(user_ids, new_status):
    db.query(User).filter(User.id.in_(user_ids)).update(
        {'status': new_status},
        synchronize_session=False
    )
    db.commit()
```

### Connection Pool Tuning

```python
from sqlalchemy.pool import QueuePool

# ✅ Optimized connection pool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # Number of connections
    max_overflow=10,        # Additional connections
    pool_timeout=30,        # Wait 30s for connection
    pool_recycle=3600,      # Recycle after 1 hour
    pool_pre_ping=True,      # Test connection before use
)
```

---

## Caching Strategies

### LRU Cache

```python
from functools import lru_cache
import time

@lru_cache(maxsize=128)
def expensive_function(x: int) -> int:
    """Expensive computation"""
    time.sleep(0.1)  # Simulate work
    return x ** 2

# Usage
result1 = expensive_function(5)  # Computes
result2 = expensive_function(5)  # Returns cached result!

# Cache stats
print(f"Calls: {expensive_function.cache_info().calls}")
print(f"Hits: {expensive_function.cache_info().hits}")
print(f"Misses: {expensive_function.cache_info().misses}")

# Clear cache
expensive_function.cache_clear()
```

### Redis Caching

```python
import redis.asyncio as redis
import json
import hashlib

class AsyncRedisCache:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
    
    async def get(self, key: str):
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(
        self,
        key: str,
        value: any,
        expire: int = 3600
    ):
        await self.redis.set(
            key,
            json.dumps(value),
            ex=expire
        )
    
    async def delete(self, key: str):
        await self.redis.delete(key)
    
    async def invalidate_pattern(self, pattern: str):
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

# Usage
cache = AsyncRedisCache("redis://localhost:6379")

async def get_user_cached(user_id: int):
    cache_key = f"user:{user_id}"
    
    # Try cache first
    user = await cache.get(cache_key)
    if user:
        return user
    
    # Cache miss: query database
    user = await db.get_user(user_id)
    
    # Store in cache
    await cache.set(cache_key, user, expire=300)  # 5 minutes
    
    return user
```

### Cache Invalidation

```python
class SmartCache:
    def __init__(self):
        self.cache = {}
        self.timestamps = {}
    
    def get(self, key: str, ttl: int = 3600):
        if key not in self.cache:
            return None
        
        # Check TTL
        if time.time() - self.timestamps[key] > ttl:
            del self.cache[key]
            del self.timestamps[key]
            return None
        
        return self.cache[key]
    
    def set(self, key: str, value: any):
        self.cache[key] = value
        self.timestamps[key] = time.time()
    
    def invalidate(self, pattern: str):
        keys_to_delete = [
            key for key in self.cache.keys()
            if pattern in key
        ]
        for key in keys_to_delete:
            del self.cache[key]
            del self.timestamps[key]
```

---

## Performance Testing

### pytest-benchmark

```bash
# Установка
pip install pytest-benchmark

# Использование
pytest --benchmark-only
```

```python
import pytest

@pytest.mark.benchmark
def test_list_comprehension(benchmark):
    result = benchmark(lambda: [x**2 for x in range(1000)])
    assert len(result) == 1000

@pytest.mark.benchmark
def test_generator(benchmark):
    result = list(benchmark(lambda: (x**2 for x in range(1000))))
    assert len(result) == 1000
```

### Locust (Load Testing)

```python
# locustfile.py
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        self.client.post("/login", json={
            "username": "test",
            "password": "test"
        })
    
    @task(3)
    def get_items(self):
        self.client.get("/api/items")
    
    @task(1)
    def create_item(self):
        self.client.post("/api/items", json={
            "title": "Test Item",
            "price": 10.0
        })
```

```bash
# Run load test
locust -f locustfile.py --host=http://localhost:8000

# Headless mode
locust -f locustfile.py --host=http://localhost:8000 --headless \
  --users 100 --spawn-rate 10 --run-time 60s
```

---

## Performance Optimization Checklist

```markdown
## Performance Optimization Checklist

### Code Level
- [ ] Profiled with cProfile
- [ ] Profiled with memory_profiler
- [ ] Hot spots identified
- [ ] Optimized critical paths
- [ ] Used generators where possible
- [ ] Used __slots__ for data classes
- [ ] Minimized object creation

### Async Level
- [ ] No blocking calls in async functions
- [ ] Proper use of asyncio.gather()
- [ ] Connection pooling configured
- [ ] Semaphore for rate limiting
- [ ] Event loop not blocked

### Database Level
- [ ] N+1 queries eliminated
- [ ] Indexes added
- [ ] Query batching used
- [ ] Connection pool tuned
- [ ] Query results limited (pagination)

### Caching Level
- [ ] LRU cache for expensive computations
- [ ] Redis cache for database queries
- [ ] Cache invalidation strategy
- [ ] Cache hit rate monitored
- [ ] Cache TTL configured

### Testing Level
- [ ] Benchmark tests created
- [ ] Load tests run
- [ ] Performance regression tests
- [ ] Baseline metrics established

### Monitoring Level
- [ ] APM configured
- [ ] Performance metrics collected
- [ ] Alerts set for degradation
- [ ] Historical performance tracked
```

---

## When to Load This Skill

**Load before performance tasks:**
1. Conducting profiling
2. Optimizing async code
3. Reducing memory usage
4. Setting up caching
5. Performance testing
6. Tuning database queries
7. Optimizing connection pools

---

**Вы готовы оптимизировать производительность Python проектов!** ⚡🚀
