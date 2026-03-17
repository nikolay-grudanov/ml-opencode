---
name: ml-ops-argocd-gitops
description: ArgoCD + GitOps skill for ml-ops agent. Defines role: declarative CI/CD with ArgoCD, GitOps workflows, automated deployments. Use for setting up GitOps for ML projects, automated rollouts, rollbacks. Load before ArgoCD tasks.
---
# Skill: ArgoCD + GitOps для MLOps

**Полная спецификация по GitOps и CI/CD с ArgoCD для ML проектов**

---

## Ваша Роль

Вы — **MLOps специалист по GitOps и ArgoCD**. Создаёте declarative CI/CD pipelines для ML проектов.

---

## Что Вы Делаете Самостоятельно ✅

### ArgoCD Configuration
- Установка ArgoCD в Kubernetes
- Настройка Application manifests
- Конфигурация GitOps repositories
- Настройка Sync policies

### GitOps Workflows
- Создание declarative manifests
- Version-controlled deployments
- Automated sync с Git репозиторием
- Rollback через Git revert

### CI/CD Pipelines
- GitHub Actions + ArgoCD
- GitLab CI + ArgoCD
- Automated testing перед деплоем
- Pruning устаревших ресурсов

### Advanced GitOps
- Multi-environment deployments (dev, staging, prod)
- Helm charts для ML сервисов
- Sealed Secrets для credentials
- Progressive delivery (canary, blue-green)

---

## Что Вы Делегируете ❌

- **ML model training** → `@jupyter-text`
- **Model code** → `@python-coder`
- **Kubernetes/KServe setup** → `@ml-ops-kubernetes-kserve`
- **MLflow setup** → `@ml-ops-mlflow`

---

## ArgoCD Installation

### Установка ArgoCD на Kubernetes

```bash
# 1. Создание namespace
kubectl create namespace argocd

# 2. Установка ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Проверка установки
kubectl get pods -n argocd

# 4. Доступ к ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open http://localhost:8080

# 5. Получение initial password
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o name | cut -d'/' -f2
argocd-server-xxx-xxx
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Настройка ArgoCD CLI

```bash
# Установка ArgoCD CLI
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/download/v2.8.0/argocd-linux-amd64
chmod +x argocd-linux-amd64
sudo mv argocd-linux-amd64 /usr/local/bin/argocd

# Логин
argocd login localhost:8080 --username admin --password <initial-password>
```

---

## ArgoCD Application

### Базовое Application

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ml-model-production
  namespace: argocd
  annotations:
    notifications.argoproj.io/subscribe.on-sync-succeeded.slack: ml-production-channel
spec:
  project: default

  # Git repository
  source:
    repoURL: https://github.com/my-org/ml-infra.git
    targetRevision: main
    path: k8s/production

  # Kubernetes cluster
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-production

  # Sync policy
  syncPolicy:
    automated:
      prune: true  # Удалять ресурсы, которых нет в Git
      selfHeal: true  # Авто-исправление drift
    syncOptions:
      - CreateNamespace=true
      - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Multi-Environment Application

```yaml
# dev-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ml-model-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/ml-infra.git
    targetRevision: main
    path: k8s/dev  # dev окружение
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true

---

# staging-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ml-model-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/ml-infra.git
    targetRevision: main
    path: k8s/staging  # staging окружение
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true

---

# production-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ml-model-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/ml-infra.git
    targetRevision: main
    path: k8s/production  # production окружение
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Application с Helm Chart

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ml-model-helm
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/helm-charts.git
    targetRevision: main
    path: charts/ml-model  # Helm chart
    helm:
      valueFiles:
        - values-prod.yaml
      parameters:
        - name: image.tag
          value: "v1.2.3"
        - name: replicaCount
          value: "3"
        - name: resources.requests.cpu
          value: "2"
        - name: resources.requests.memory
          value: "4Gi"
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## GitOps Workflow

### Структура Git репозитория

```
ml-infra/
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── helm-charts/
│   └── ml-model/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-staging.yaml
│       └── values-production.yaml
└── k8s/
    ├── dev/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── ingress.yaml
    ├── staging/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── ingress.yaml
    └── production/
        ├── deployment.yaml
        ├── service.yaml
        └── ingress.yaml
```

### GitOps Deployment Process

```bash
# 1. Создание ветки для изменений
git checkout -b feature/new-model-v2

# 2. Внесение изменений в manifests
vim k8s/production/deployment.yaml

# 3. Commit изменений
git add k8s/production/deployment.yaml
git commit -m "Update model to v2.0.0"

# 4. Push в репозиторий
git push origin feature/new-model-v2

# 5. Создание Pull Request
gh pr create --title "Deploy model v2.0.0 to production" \
             --body "Model v2.0.0 deployment"

# 6. CI проверки (GitHub Actions)
# 7. Merge PR
# 8. ArgoCD автоматически синхронизируется с Git
# 9. Деплой в production
```

### Rollback через Git

```bash
# 1. Revert последнего коммита
git revert HEAD

# 2. Push в репозиторий
git push origin main

# 3. ArgoCD автоматически синхронизируется
# 4. Предыдущая версия восстановлена

# Или revert к конкретному коммиту
git reset --hard <commit-hash>
git push origin main --force  # Осторожно с force push!
```

---

## GitHub Actions + ArgoCD

### Basic CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy ML Model

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9

      - name: Install dependencies
        run: |
          pip install pytest pytest-cov mlflow scikit-learn

      - name: Run tests
        run: |
          pytest tests/ --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v2

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker image
        run: |
          docker build -t my-registry/ml-model:${{ github.sha }} .
          docker tag my-registry/ml-model:${{ github.sha }} my-registry/ml-model:latest

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push my-registry/ml-model:${{ github.sha }}
          docker push my-registry/ml-model:latest

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2

      - name: Update image tag
        run: |
          sed -i "s|image: my-registry/ml-model:.*|image: my-registry/ml-model:${{ github.sha }}|g" k8s/staging/deployment.yaml

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add k8s/staging/deployment.yaml
          git commit -m "Update staging image to ${{ github.sha }}"
          git push origin main

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v2

      - name: Update image tag
        run: |
          sed -i "s|image: my-registry/ml-model:.*|image: my-registry/ml-model:${{ github.sha }}|g" k8s/production/deployment.yaml

      - name: Manual approval (production)
        uses: trstringer/manual-approval@v1.0.0
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: devops-team

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add k8s/production/deployment.yaml
          git commit -m "Update production image to ${{ github.sha }}"
          git push origin main
```

### Advanced Pipeline с Testing

```yaml
name: Advanced ML Deployment Pipeline

on:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run unit tests
        run: pytest tests/unit/ -v

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v2
      - name: Run integration tests
        run: pytest tests/integration/ -v
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  model-validation:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate model
        run: |
          python scripts/validate_model.py \
            --model-path models/latest.pkl \
            --test-data data/test.csv

  security-scan:
    needs: model-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v1
        with:
          sarif_file: trivy-results.sarif

  deploy-staging:
    needs: [model-validation, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to staging
        run: |
          # Update manifests
          # Push to Git
          # ArgoCD syncs automatically
          echo "Deploying to staging..."

  e2e-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E tests
        run: |
          # Wait for deployment
          kubectl wait --for=condition=available --timeout=5m deployment/ml-model -n ml-staging

          # Run E2E tests
          pytest tests/e2e/ -v

  deploy-production:
    needs: e2e-tests
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://model.my-company.com
    steps:
      - uses: actions/checkout@v2
      - name: Manual approval
        uses: trstringer/manual-approval@v1.0.0
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: devops-team,ml-team
          minimum-approvals: 2
      - name: Deploy to production
        run: |
          # Update manifests
          # Push to Git
          # ArgoCD syncs automatically
          echo "Deploying to production..."
```

---

## Helm Charts для ML

### Helm Chart Structure

```
charts/ml-model/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-production.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   └── secret.yaml
└── README.md
```

### Chart.yaml

```yaml
apiVersion: v2
name: ml-model
description: Helm chart for ML model deployment
type: application
version: 1.0.0
appVersion: "1.2.3"

keywords:
  - ml
  - model
  - inference
  - kserve

maintainers:
  - name: ML Team
    email: ml-team@company.com
```

### values.yaml

```yaml
# Default values for ml-model
replicaCount: 3

image:
  repository: my-registry/ml-model
  pullPolicy: Always
  tag: ""

model:
  name: iris-classifier
  version: "1.0.0"
  storageUri: s3://my-bucket/models/v1.0.0

resources:
  requests:
    cpu: 1
    memory: 2Gi
  limits:
    cpu: 2
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: model.my-company.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: model-tls
      hosts:
        - model.my-company.com

monitoring:
  enabled: true
  prometheus:
    enabled: true
    port: 8080

secrets:
  enabled: false
  name: ""
```

### values-production.yaml

```yaml
# Production-specific values
replicaCount: 5

image:
  tag: "v1.2.3"

resources:
  requests:
    cpu: 2
    memory: 4Gi
  limits:
    cpu: 4
    memory: 8Gi

autoscaling:
  minReplicas: 3
  maxReplicas: 20

ingress:
  hosts:
    - host: model-production.my-company.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: model-production-tls
      hosts:
        - model-production.my-company.com

secrets:
  enabled: true
  name: model-secrets-prod
```

### templates/deployment.yaml

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: {{ include "ml-model.fullname" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    app.kubernetes.io/name: {{ include "ml-model.name" . }}
    helm.sh/chart: {{ include "ml-model.chart" . }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    app.kubernetes.io/managed-by: Helm
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: {{ .Values.model.storageUri }}
    runtimeVersion: "1.1.0"
    replicas: {{ .Values.replicaCount }}
    resources:
      requests:
        cpu: {{ .Values.resources.requests.cpu }}
        memory: {{ .Values.resources.requests.memory }}
      limits:
        cpu: {{ .Values.resources.limits.cpu }}
        memory: {{ .Values.resources.limits.memory }}
    {{- if .Values.secrets.enabled }}
    secrets:
      - name: {{ .Values.secrets.name }}
    {{- end }}
```

---

## Sealed Secrets

### Установка Sealed Secrets

```bash
# Установка kubeseal
go install github.com/bitnami-labs/sealed-secrets/v4/cmd/kubeseal@latest

# Создание secret
kubectl create secret generic model-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=api-key=sk-... \
  --dry-run=client \
  -o yaml > model-secrets.yaml

# Sealing secret (для коммита в Git)
kubeseal --controller-name=sealed-secrets \
          --controller-namespace=sealed-secrets \
          < model-secrets.yaml > sealed-secret.yaml
```

### Использование Sealed Secret

```yaml
# templates/secret.yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: {{ include "ml-model.fullname" . }}-secrets
  namespace: {{ .Release.Namespace }}
spec:
  encryptedData:
    database-url: {{ .Values.secrets.databaseUrl }}
    api-key: {{ .Values.secrets.apiKey }}
  template:
    metadata:
      name: {{ include "ml-model.fullname" . }}-secrets
      namespace: {{ .Release.Namespace }}
    type: Opaque
```

---

## Progressive Delivery

### Canary Deployment с Argo Rollouts

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: ml-model-canary
  namespace: ml-production
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 10m}
      - setWeight: 25
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 75
      - pause: {duration: 10m}
      setWeight: 100
      canaryService: ml-model-canary
      stableService: ml-model-stable
      trafficAnalysis:
        metrics:
        - name: request-success-rate
          thresholdRange:
            min: 99
        - name: request-duration
          thresholdRange:
            max: 500
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: ml-model
        image: my-registry/ml-model:v2.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "2"
            memory: "4Gi"
```

### Blue-Green Deployment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: ml-model-blue-green
  namespace: ml-production
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: ml-model-active
      previewService: ml-model-preview
      autoPromotionEnabled: false
      previewReplicaCount: 2
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
          matchLabels:
            app.kubernetes.io/name: ml-model
        args:
        - name: success-rate
          value: "99"
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: ml-model
        image: my-registry/ml-model:v2.0.0
        ports:
        - containerPort: 8080
```

---

## Monitoring и Notifications

### ArgoCD Notifications

```yaml
# argocd-notifications-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  context: |
    argocdUrl: https://argocd.my-company.com

  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded']
      send: [slack-notification]

  template.slack-notification: |
    message: |
      Application {{.app.metadata.name}} has been {{.app.status.operationState.phase}}.
      Details: {{.context.argocdUrl}}/applications/{{.app.metadata.name}}
    slack:
      attachments: |
        [{
          "title": "{{.app.metadata.name}}",
          "title_link": "{{.context.argocdUrl}}/applications/{{.app.metadata.name}}",
          "color": "#18be52",
          "fields": [
            {
              "title": "Sync Status",
              "value": "{{.app.status.sync.status}}",
              "short": true
            },
            {
              "title": "Repository",
              "value": "{{.app.spec.source.repoURL}}",
              "short": true
            }
          ]
        }]
```

---

## Best Practices

### Branch Strategy

```bash
# GitFlow для ML проектов
main              # Production-ready
  └── develop    # Development integration
         ├── feature/model-v2
         ├── feature/feature-store
         ├── hotfix/bug-123
         └── release/v1.2.0
```

### Manifest Organization

```bash
# Организация manifests по окружениям
k8s/
├── base/            # Базовые manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── overlays/         # Kustomize overlays
│   ├── dev/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
```

### Secrets Management

```bash
# Never commit real secrets!
# Use Sealed Secrets
kubeseal < secret.yaml > sealed-secret.yaml
git add sealed-secret.yaml
git commit -m "Add sealed secret"
```

---

## Checklist Перед GitOps Deployment

### ArgoCD Setup
- [ ] ArgoCD установлен в K8s
- [ ] Git repository подключен
- [ ] SSH/HTTPS доступ настроен
- [ ] RBAC permissions настроены
- [ ] Notifications настроены

### Git Repository
- [ ] Структура директорий создана
- [ ] Manifestы готовы
- [ ] Helm charts созданы
- [ ] Values files созданы
- [ ] README с инструкциями

### CI/CD Pipeline
- [ ] Unit tests настроены
- [ ] Integration tests настроены
- [ ] Model validation добавлено
- [ ] Security scan настроен
- [ ] E2E tests настроены
- [ ] Manual approval для production

### Deployment
- [ ] Pull request создан
- [ ] CI проверки прошли
- [ ] Code review завершён
- [ ] Merge в main
- [ ] ArgoCD синхронизировался
- [ ] Pods running
- [ ] Health checks прошли

---

**Вы готовы настроить GitOps и CI/CD для ML проектов!** 🚀✨
