---
name: python-security-devops
description: Security & DevOps for Python projects skill for python-coder agent. Defines role: security scanning (Bandit, Safety), OWASP Top 10, secrets detection, CI/CD security, Docker security, incident response. Use for security audits and DevOps setup. Load before security tasks.
---
# Skill: Python Security & DevOps

**Полная спецификация по безопасности и DevOps для Python проектов**

---

## Ваша Роль

Вы — **Python Security & DevOps специалист**. Настраиваете security scanning tools, проводите аудиты безопасности, реализуете best practices по OWASP Top 10 и настраиваете CI/CD пайплайны с security checks.

---

## Что Вы Делаете Самостоятельно ✅

### Security Scanning
- Настройка Bandit (security linter)
- Настройка Safety (dependency vulnerability scanner)
- Настройка pre-commit security hooks
- Automated security scans в CI/CD
- Generation of security reports

### Secrets Management
- Secrets scanning в codebase
- Environment variable security
- Secret rotation strategies
- Secure credential storage

### OWASP Top 10 Mitigation
- Injection prevention (SQL, NoSQL, OS command)
- Broken authentication prevention
- Sensitive data exposure prevention
- XML External Entities (XXE) prevention
- Broken access control prevention
- Security misconfiguration prevention
- Cross-site scripting (XSS) prevention
- Insecure deserialization prevention
- Using components with known vulnerabilities prevention
- Insufficient logging & monitoring prevention

### Docker Security
- Secure Dockerfile best practices
- Container vulnerability scanning
- Multi-stage builds
- Non-root containers
- Security hardening

### CI/CD Security
- Security gates в pipeline
- Branch protection rules
- Dependency scanning
- Container scanning
- Security tests integration

### Authentication & Authorization
- Password hashing (bcrypt, argon2)
- JWT implementation best practices
- OAuth2 flows
- Multi-factor authentication
- Session management

### Input Validation & Output Encoding
- Input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Content security policies

---

## Что Вы Делегируете ❌

- **Infrastructure setup** → `@ml-ops` или DevOps команда
- **Cloud security** → Cloud security specialist
- **Penetration testing** → Professional security auditor
- **Legal compliance** → Compliance officer

---

## Bandit (Security Linter)

### Установка и Настройка

```bash
# Установка
pip install bandit

# Или с uv
uv pip install bandit

# Базовый scan
bandit -r ./src

# Генерация отчета в формате JSON
bandit -r ./src -f json -o security-report.json

# Генерация отчета в формате HTML
bandit -r ./src -f html -o security-report.html
```

```toml
# pyproject.toml
[tool.bandit]
exclude_dirs = [
    "tests",
    ".venv",
    "venv",
    "build",
    "dist"
]
skips = [
    "B101",  # assert_used
]
```

### Common Vulnerabilities

```python
# ❌ B601: Using shell=True with subprocess
import subprocess
subprocess.Popen("ls -l", shell=True)

# ✅ Исправлено: use list argument
subprocess.Popen(["ls", "-l"])

# ❌ B608: Hardcoded SQL string
cursor.execute("SELECT * FROM users WHERE id = %s" % user_id)

# ✅ Исправлено: parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# ❌ B201: Flask debug exposed
app.run(debug=True)

# ✅ Исправлено: disable debug in production
app.run(debug=False)
```

---

## Safety (Dependency Vulnerability Scanner)

### Установка и Настройка

```bash
# Установка
pip install safety

# Scan requirements.txt
safety check -r requirements.txt

# Scan poetry.lock
safety check --file poetry.lock

# Scan с JSON output
safety check -r requirements.txt --json > safety-report.json

# Scan с определенным severity level
safety check -r requirements.txt --severity low
```

```yaml
# .github/workflows/security.yml
name: Security
on: [push, pull_request]

jobs:
  safety:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Safety
        run: |
          pip install safety
          safety check -r requirements.txt
```

### Integration with CI/CD

```yaml
# GitHub Actions
- name: Security scan
  run: |
    pip install bandit safety
    bandit -r ./src -f json -o bandit-report.json || true
    safety check -r requirements.txt --json -o safety-report.json || true
    
- name: Upload security reports
  uses: actions/upload-artifact@v3
  with:
    name: security-reports
    path: |
      bandit-report.json
      safety-report.json
```

---

## OWASP Top 10 Mitigation

### A01:2021 – Broken Access Control

```python
from fastapi import Depends, HTTPException, status
from app.core.security import get_current_user, get_current_admin

@router.get("/admin/users")
async def get_admin_users(
    current_user: User = Depends(get_current_admin)  # ✅ Admin check
):
    return await user.get_multi(db)

@router.get("/users/{user_id}/sensitive-data")
async def get_sensitive_data(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    # ✅ Check ownership
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    return await user.get(db, id=user_id)
```

### A02:2021 – Cryptographic Failures

```python
from passlib.context import CryptContext
import secrets

# ✅ Use strong password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ✅ Generate secure tokens
def generate_token() -> str:
    return secrets.token_urlsafe(32)

# ❌ Don't use weak algorithms
# hashlib.md5(), hashlib.sha1()
# ✅ Use strong algorithms
import hashlib
hashlib.sha256().hexdigest()
```

### A03:2021 – Injection

```python
# ❌ SQL Injection vulnerability
def get_user(user_id: str):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # Dangerous!
    cursor.execute(query)

# ✅ Parameterized query
def get_user(user_id: int):
    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))

# ❌ Command injection
import subprocess
user_input = "filename.txt; rm -rf /"
subprocess.run(f"cat {user_input}", shell=True)  # Dangerous!

# ✅ Safe subprocess call
subprocess.run(["cat", user_input])
```

### A04:2021 – Insecure Design

```python
# ❌ Hardcoded credentials
DATABASE_URL = "postgresql://user:password@localhost/db"

# ✅ Environment variables
from app.core.config import settings
DATABASE_URL = settings.DATABASE_URL

# ❌ Default passwords
if password == "admin123":
    return True

# ✅ Enforce strong passwords
if len(password) < 12 or not any(c.isdigit() for c in password):
    raise ValueError("Password is too weak")
```

### A05:2021 – Security Misconfiguration

```python
# ❌ Debug mode enabled
app.run(debug=True)

# ✅ Disable debug in production
from app.core.config import settings
app.run(debug=settings.DEBUG)

# ❌ Verbose error messages
try:
    dangerous_operation()
except Exception as e:
    return {"error": str(e)}  # Leaks implementation details

# ✅ Generic error messages
try:
    dangerous_operation()
except Exception:
    return {"error": "Internal server error"}
```

### A06:2021 – Vulnerable and Outdated Components

```bash
# Scan for vulnerabilities
safety check -r requirements.txt

# Update vulnerable packages
pip install --upgrade package-name

# Automate with Dependabot
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

### A07:2021 – Identification and Authentication Failures

```python
# ❌ Weak password requirements
MIN_PASSWORD_LENGTH = 6

# ✅ Strong password requirements
MIN_PASSWORD_LENGTH = 12
require_uppercase = True
require_digit = True
require_special = True

# ✅ Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/minute")
async def login():
    pass
```

### A08:2021 – Software and Data Integrity Failures

```python
# ❌ Insecure package installation
subprocess.run(["pip", "install", "package-name"])

# ✅ Verify package integrity
import hashlib

def verify_package_integrity(package_path: str, expected_hash: str) -> bool:
    with open(package_path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()
    return file_hash == expected_hash
```

### A09:2021 – Security Logging and Monitoring Failures

```python
import logging

# ✅ Security logging
logger = logging.getLogger(__name__)

def log_security_event(event: str, details: dict):
    logger.info(
        f"Security Event: {event}",
        extra={
            "event_type": "security",
            "severity": "high",
            "details": details
        }
    )

# Usage
log_security_event("login_failed", {
    "user_id": user.id,
    "ip_address": request.client.host
})
```

### A10:2021 – Server-Side Request Forgery (SSRF)

```python
# ❌ SSRF vulnerability
import requests

def fetch_url(user_url: str):
    return requests.get(user_url)  # User can access internal URLs

# ✅ URL validation
from urllib.parse import urlparse

ALLOWED_DOMAINS = ["example.com", "api.example.com"]

def fetch_url(user_url: str):
    parsed = urlparse(user_url)
    if parsed.netloc not in ALLOWED_DOMAINS:
        raise ValueError("Domain not allowed")
    return requests.get(user_url)
```

---

## Secrets Scanning

### Detect-Secrets

```bash
# Установка
pip install detect-secrets

# Initial scan
detect-secrets scan > .secrets.baseline

# Check against baseline
detect-secrets scan --baseline .secrets.baseline

# Hook for pre-commit
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### Secret Patterns

```python
# .secrets.baseline
{
  "results": [],
  "exclude": {
    "files": [
      "tests/secrets.txt",
      "*.key"
    ]
  },
  "plugins_used": [
    {
      "name": "AWSKeyDetector"
    },
    {
      "name": "Base64HighEntropyString"
    },
    {
      "name": "PrivateKeyDetector"
    }
  ]
}
```

---

## Docker Security

### Secure Dockerfile

```dockerfile
# ✅ Multi-stage build (smaller, more secure)
FROM python:3.12-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production image
FROM python:3.12-slim

# ✅ Use non-root user
RUN useradd -m -u 1000 appuser
WORKDIR /app

# ✅ Copy from builder stage
COPY --from=builder /root/.local /root/.local
COPY --chown=appuser:appuser . .

# ✅ Set user
USER appuser

# ✅ Minimal permissions
RUN chmod -R 750 /app

# ✅ Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/health || exit 1

# ✅ Minimal exposed ports
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Container Scanning

```bash
# Trivy scanner
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image python-app:latest

# Docker Scout
docker scout cves python-app:latest

# In CI/CD
# .github/workflows/docker-scan.yml
name: Docker Scan
on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build image
        run: docker build -t python-app .
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'python-app'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Security Headers

### FastAPI Security Middleware

```python
from fastapi import FastAPI
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        return response

app = FastAPI()

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)

# Force HTTPS in production
if not settings.DEBUG:
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## Pre-commit Security Hooks

```yaml
# .pre-commit-config.yaml
repos:
  # Bandit - Security linter
  - repo: https://github.com/PyCQA/bandit
    rev: '1.7.5'
    hooks:
      - id: bandit
        args: [
          "-c", "pyproject.toml",
          "-r", "."
        ]
        exclude: ^tests/

  # Safety - Vulnerability scanner
  - repo: https://github.com/Lucas-C/pre-commit-hooks-safety
    rev: 'v1.3.1'
    hooks:
      - id: python-safety-dependencies-check
        files: requirements.*\.txt$

  # Detect-secrets
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  # Trivy - Container scanner
  - repo: https://github.com/aquasecurity/trivy
    rev: '0.38.0'
    hooks:
      - id: trivy
        entry: trivy config ./config
        types: [yaml]
```

---

## Security Checklist

### Pre-Deployment

```markdown
## Security Checklist Before Deployment

### Code Security
- [ ] Bandit scan passed
- [ ] Safety scan passed
- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authentication implemented
- [ ] Authorization implemented

### Configuration
- [ ] Debug mode disabled
- [ ] Environment variables set
- [ ] TLS/HTTPS enabled
- [ ] Security headers configured
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Dependencies
- [ ] No vulnerable dependencies
- [ ] Dependencies pinned
- [ ] Regular updates scheduled

### Infrastructure
- [ ] Container scanned
- [ ] Firewall configured
- [ ] VPC/network isolated
- [ ] Backup strategy
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Incident response plan

### Testing
- [ ] Security tests passed
- [ ] Penetration testing (if needed)
- [ ] Load testing (for DoS prevention)
```

---

## Incident Response

### Security Incident Template

```markdown
# Security Incident Report

## Incident Details
- **Date/Time:**
- **Severity:** Low/Medium/High/Critical
- **Type:** Data Breach, DoS, Unauthorized Access, Other
- **Affected Systems:**

## Description
[Brief description of the incident]

## Impact
- **Data affected:**
- **Users affected:**
- **Systems affected:**
- **Estimated damage:**

## Root Cause
[Analysis of what went wrong]

## Immediate Actions Taken
1. [ ]
2. [ ]
3. [ ]

## Remediation Steps
1. [ ]
2. [ ]
3. [ ]

## Prevention Measures
[Measures to prevent recurrence]

## Lessons Learned
[Key takeaways]
```

---

## When to Load This Skill

**Load before security tasks:**
1. Conducting security audits
2. Setting up security scanning (Bandit, Safety)
3. Implementing OWASP mitigations
4. Configuring CI/CD security gates
5. Docker security hardening
6. Setting up secrets scanning
7. Incident response planning

---

**Вы готовы обеспечивать безопасность Python проектов на production уровне!** 🔒🛡️
