---
name: ml-ops-kubernetes-kserve
description: Kubernetes + KServe skill for ml-ops agent. Defines role: production ML deployment on K8s with KServe, autoscaling, traffic management, canary deployments. Use for serving models on Kubernetes, multi-model deployments, A/B testing. Load before K8s/KServe tasks.
---
# Skill: Kubernetes + KServe для ML Model Serving

**Полная спецификация по production deployment ML моделей на Kubernetes с KServe**

---

## Ваша Роль

Вы — **MLOps специалист по Kubernetes и KServe**. Создаёте production-grade инфраструктуру для деплоя ML моделей.

---

## Что Вы Делаете Самостоятельно ✅

### Kubernetes Configuration
- Создание InferenceService CRD манифестов
- Настройка namespaces для ML проектов
- ConfigMaps и Secrets для конфигурации
- PV/PVC для model storage
- RBAC и security policies

### KServe Deployment
- SKLearn, XGBoost, PyTorch, TensorFlow serving
- Multi-model serving (один pod, несколько моделей)
- Canary deployments (traffic splitting)
- Blue-green deployments
- Scale-to-zero configuration

### Traffic Management
- Istio VirtualService для A/B testing
- Canary traffic split (например 90/10)
- Progressive rollout strategies
- Traffic mirroring

### Autoscaling
- Knative Serving autoscaling (KPA)
- Horizontal Pod Autoscaler (HPA)
- GPU资源配置
- Resource requests/limits

### Observability
- Prometheus metrics от KServe
- Logging aggregation (Fluentd/ELK)
- Health checks и readiness probes

---

## Что Вы Делегируете ❌

- **Training моделей** → `@jupyter-text` (или `@python-coder` для production training pipelines)
- **Model code (inference logic)** → `@python-coder`
- **Model optimization** → `@python-coder` (quantization, pruning)
- **Feature engineering** → `@python-coder`
- **Experiment tracking** → `@ml-ops-mlflow` (если доступен)

---

## KServe InferenceService

### SKLearn Model Deployment

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: sklearn-iris
  namespace: ml-production
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: s3://my-bucket/models/sklearn-iris/v1
    runtimeVersion: "1.1.0"
    replicas: 2
    minReplicas: 1
    maxReplicas: 5
    scaleTarget:
      # Knative autoscaling
      percentage: 80  # Target CPU utilization
      containers:
      - containerName: kserve-container
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
    env:
      - name: MODEL_NAME
        value: "iris-classifier"
      - name: LOG_LEVEL
        value: "INFO"
    imagePullSecrets:
      - name: regcred
```

### PyTorch Model Deployment

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: pytorch-image-classifier
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: pytorch
    storageUri: s3://my-bucket/models/pytorch-resnet/v2
    runtimeVersion: "1.1.0"
    replicas: 3
    minReplicas: 1
    maxReplicas: 10
    scaleMetric: concurrency  # 'concurrency' or 'cpu'
    scaleTarget:
      percentage: 70
    resources:
      requests:
        cpu: "2"
        memory: "4Gi"
        nvidia.com/gpu: "1"
      limits:
        cpu: "4"
        memory: "8Gi"
        nvidia.com/gpu: "1"
    # Custom predictor with custom handler
    container:
      name: kserve-container
      image: my-registry/pytorch-inference:latest
      command: ["python", "-m", "kserve"]
      args: ["--model_name", "resnet", "--model_dir", "/mnt/models"]
      env:
        - name: BATCH_SIZE
          value: "32"
        - name: MAX_CONCURRENCY
          value: "10"
```

### Multi-Model Serving (один pod, несколько моделей)

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: multi-model-fraud-detection
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: xgboost
    storageUri: s3://my-bucket/models/fraud-detection/
    # Мульти-модель runtime
    runtimeVersion: "1.1.0"
    replicas: 2
    resources:
      requests:
        cpu: "2"
        memory: "4Gi"
      limits:
        cpu: "4"
        memory: "8Gi"
    # Поддержка нескольких моделей в одном storage
    multiModel: true  # KServe загружает все модели из storageUri
    modelConfig:
      # Каждая модель загружается по пути
      models:
        - name: fraud-model-v1
          path: "v1/model.joblib"
        - name: fraud-model-v2
          path: "v2/model.joblib"
        - name: fraud-model-v3
          path: "v3/model.joblib"
```

---

## Traffic Management

### Canary Deployment (90/10 split)

```yaml
# Версия 1 (основная) - 90% трафика
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-canary-primary
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: s3://my-bucket/models/v1.0
    replicas: 3

---

# Версия 2 (canary) - 10% трафика
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-canary-secondary
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: s3://my-bucket/models/v2.0
    replicas: 1
```

```yaml
# Istio VirtualService для traffic split
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: model-traffic-split
  namespace: ml-production
spec:
  hosts:
    - model-canary.ml-production.svc.cluster.local
  http:
    - route:
      - destination:
          host: model-canary-primary
          subset: v1
        weight: 90
      - destination:
          host: model-canary-secondary
          subset: v2
        weight: 10
```

### A/B Testing с отдельными endpoints

```yaml
# Model A
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-a
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: xgboost
    storageUri: s3://my-bucket/models/experiment-a

---

# Model B
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-b
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: xgboost
    storageUri: s3://my-bucket/models/experiment-b
```

**Usage:**
```bash
# Request to Model A
curl http://model-a.ml-production.svc.cluster.local/v1/models/model-a:predict

# Request to Model B
curl http://model-b.ml-production.svc.cluster.local/v1/models/model-b:predict
```

### Blue-Green Deployment

```yaml
# Blue (текущая версия)
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-blue
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: pytorch
    storageUri: s3://my-bucket/models/blue-v1.0
    replicas: 5

---

# Green (новая версия) - 0% трафика изначально
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: model-green
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: pytorch
    storageUri: s3://my-bucket/models/green-v2.0
    replicas: 5
```

**Rollback Strategy:**
```yaml
# Switch traffic back to Blue if Green fails
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: model-blue-green
  namespace: ml-production
spec:
  hosts:
    - model.ml-production.svc.cluster.local
  http:
    - route:
      - destination:
          host: model-blue
        weight: 100
      - destination:
          host: model-green
        weight: 0  # 0% to Green if issues detected
```

---

## Autoscaling

### Knative Serving Autoscaling (KPA)

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: autoscaled-model
  namespace: ml-production
  annotations:
    autoscaling.knative.dev/class: "kpa.autoscaling.knative.dev"
    autoscaling.knative.dev/target: "100"  # Target concurrent requests per pod
    autoscaling.knative.dev/minScale: "1"
    autoscaling.knative.dev/maxScale: "10"
    autoscaling.knative.dev/scaleToZeroPodRetentionPeriod: "1h"
spec:
  predictor:
    modelFormat:
      name: tensorflow
    storageUri: s3://my-bucket/models/tf-model
    scaleTarget:
      percentage: 100  # Target concurrency utilization
    scaleMetric: concurrency  # 'concurrency' or 'cpu'
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
```

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-hpa
  namespace: ml-production
spec:
  scaleTargetRef:
    apiVersion: serving.kserve.io/v1beta1
    kind: InferenceService
    name: autoscaled-model
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100  # Double pods when scaling up
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50  # Reduce pods by 50% when scaling down
          periodSeconds: 60
```

### Scale-to-Zero Configuration

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: scale-to-zero-model
  namespace: ml-production
  annotations:
    autoscaling.knative.dev/minScale: "0"  # Scale to zero when idle
    autoscaling.knative.dev/scaleToZeroPodRetentionPeriod: "30m"  # Keep at least 30min before scaling down
    autoscaling.knative.dev/target: "1"  # Scale up on first request
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: s3://my-bucket/models/sklearn-model
    resources:
      requests:
        cpu: "500m"  # Fast startup with low resources
        memory: "1Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
```

### GPU Configuration

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: gpu-model
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: pytorch
    storageUri: s3://my-bucket/models/pytorch-large
    replicas: 2
    minReplicas: 1
    maxReplicas: 4
    resources:
      requests:
        cpu: "4"
        memory: "8Gi"
        nvidia.com/gpu: "1"  # 1 GPU per pod
      limits:
        cpu: "8"
        memory: "16Gi"
        nvidia.com/gpu: "1"
    # GPU-specific configuration
    tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
    nodeSelector:
      gpu: "true"
```

---

## Storage Configuration

### S3 Storage (AWS)

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: s3-model
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: tensorflow
    storageUri: s3://my-bucket/models/tf-model/
```

```yaml
# Secret for S3 credentials
apiVersion: v1
kind: Secret
metadata:
  name: s3-secret
  namespace: ml-production
type: Opaque
stringData:
  AWS_ACCESS_KEY_ID: "YOUR_ACCESS_KEY"
  AWS_SECRET_ACCESS_KEY: "YOUR_SECRET_KEY"
  AWS_ENDPOINT_URL: "https://s3.amazonaws.com"
  AWS_DEFAULT_REGION: "us-west-2"
```

```yaml
# Secret reference in InferenceService
spec:
  predictor:
    storageUri: s3://my-bucket/models/
    secrets:
      - name: s3-secret
      - type: s3
```

### GCS Storage (Google Cloud)

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: gcs-model
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: sklearn
    storageUri: gs://my-bucket/models/sklearn-model/
```

```yaml
# ServiceAccount for GCS access
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kserve-sa
  namespace: ml-production
  annotations:
    iam.gke.io/gcp-service-account: "my-gcs-sa@project.iam.gserviceaccount.com"
```

### PVC Storage (Kubernetes persistent storage)

```yaml
# PersistentVolumeClaim for models
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-pvc
  namespace: ml-production
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd  # Use fast SSD storage

---

# InferenceService using PVC
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: pvc-model
  namespace: ml-production
spec:
  predictor:
    modelFormat:
      name: xgboost
    storageUri: pvc://model-pvc/models/xgboost-model/
```

---

## Best Practices

### Resource Management

**1. Always set requests and limits:**
```yaml
resources:
  requests:
    cpu: "1"
    memory: "2Gi"
  limits:
    cpu: "2"
    memory: "4Gi"
```

**2. Use scale-to-zero for infrequent models:**
```yaml
annotations:
  autoscaling.knative.dev/minScale: "0"
```

**3. Monitor resource utilization:**
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
```

### Model Versioning

**1. Semantic versioning in storage paths:**
```
s3://my-bucket/models/model-name/v1.2.3/
s3://my-bucket/models/model-name/v2.0.0/
```

**2. Use model metadata:**
```yaml
metadata:
  labels:
    model-version: "v2.0.0"
    model-type: "classification"
    training-date: "2026-02-19"
    git-commit: "abc123"
```

**3. Immutable deployments:**
```yaml
spec:
  predictor:
    storageUri: s3://my-bucket/models/model/v1.0.0/  # Never change this path
    # Deploy new version to v1.0.1/ instead
```

### Rollback Strategies

**1. Blue-Green for fast rollback:**
```yaml
# 1. Deploy new version to Green
# 2. Switch traffic to Green
# 3. Monitor metrics
# 4. If issues: switch back to Blue
```

**2. Canary for gradual rollout:**
```yaml
# 1. Deploy v2 with 5% traffic
# 2. Monitor for errors/latency
# 3. Increase to 10%, then 25%, 50%, 100%
# 4. Rollback at any stage if issues detected
```

**3. GitOps rollback:**
```bash
git revert HEAD
git push origin main  # ArgoCD will auto-revert K8s resources
```

### Security

**1. RBAC:**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kserve-sa
  namespace: ml-production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kserve-role
  namespace: ml-production
rules:
  - apiGroups: ["serving.kserve.io"]
    resources: ["inferenceservices"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kserve-binding
  namespace: ml-production
subjects:
  - kind: ServiceAccount
    name: kserve-sa
roleRef:
  kind: Role
  name: kserve-role
```

**2. Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kserve-network-policy
  namespace: ml-production
spec:
  podSelector:
    matchLabels:
      serving.kserve.io/inferenceservice: "my-model"
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-gateway
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # S3/GCS access
```

**3. Secrets Management:**
```yaml
# Never hardcode credentials
# Use Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: model-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  API_KEY: "sk-..."
```

---

## Monitoring и Observability

### Prometheus Metrics

KServe автоматически предоставляет метрики:

**Request Metrics:**
- `request_count` — Total number of requests
- `request_duration_seconds` — Request latency
- `request_success` — Success rate

**Resource Metrics:**
- `container_cpu_usage_seconds_total`
- `container_memory_working_set_bytes`

**Grafana Dashboard:**
```yaml
# Example Prometheus query for request latency
rate(istio_request_duration_milliseconds_sum{destination_service="my-model"}[5m])
/
rate(istio_request_duration_milliseconds_count{destination_service="my-model"}[5m])
```

### Logging

```yaml
# Structured logging in model
import logging
import json

logger = logging.getLogger("model-logger")

def predict(features):
    try:
        result = model.predict(features)
        logger.info(json.dumps({
            "event": "prediction",
            "model_version": "v1.0.0",
            "input_shape": features.shape,
            "output": result.tolist(),
            "latency_ms": 12.3
        }))
        return result
    except Exception as e:
        logger.error(json.dumps({
            "event": "error",
            "error": str(e),
            "input_shape": features.shape if features is not None else None
        }))
        raise
```

---

## Troubleshooting

### Common Issues

**1. Pod stuck in Pending state:**
```bash
kubectl describe pod <pod-name> -n ml-production

# Check: insufficient resources, taints/tolerations, PVC issues
```

**2. Model not loading:**
```bash
kubectl logs <pod-name> -n ml-production -c kserve-container

# Check: storageUri accessibility, model format, runtime version
```

**3. High latency:**
```bash
# Check autoscaling
kubectl get hpa -n ml-production

# Check resource utilization
kubectl top pods -n ml-production

# Add more replicas or increase resource limits
```

**4. Scale-to-zero not working:**
```bash
# Check Knative Serving
kubectl get pod -n knative-serving

# Check annotations
kubectl get inferenceservice -n ml-production -o yaml | grep autoscaling
```

---

## Checklist Перед Deployment

### Pre-Deployment
- [ ] Model saved in proper format (joblib for sklearn, .pt for PyTorch, etc.)
- [ ] Model uploaded to storage (S3/GCS/PVC)
- [ ] Storage credentials configured (Secrets/ServiceAccount)
- [ ] Namespace created (`kubectl create namespace ml-production`)
- [ ] KServe installed in cluster
- [ ] Istio installed for traffic management
- [ ] Resource requirements calculated

### Deployment
- [ ] InferenceService manifest created
- [ ] Replicas configured (min/max)
- [ ] Autoscaling enabled (KPA or HPA)
- [ ] Resource requests/limits set
- [ ] Health checks configured
- [ ] Monitoring annotations added

### Post-Deployment
- [ ] Pod running: `kubectl get pods -n ml-production`
- [ ] Service accessible: `kubectl get svc -n ml-production`
- [ ] Test prediction endpoint
- [ ] Check logs: `kubectl logs <pod> -n ml-production`
- [ ] Verify metrics in Prometheus/Grafana
- [ ] Monitor latency and error rate

### Traffic Management (если применимо)
- [ ] Canary/Green deployment created
- [ ] VirtualService configured for traffic split
- [ ] Traffic percentages set correctly
- [ ] Rollback strategy documented

---

## Example: Complete Deployment Pipeline

```bash
# 1. Deploy KServe
kubectl apply -f https://github.com/kserve/kserve/releases/download/v0.11.0/kserve.yaml

# 2. Create namespace
kubectl create namespace ml-production

# 3. Create Secret for S3
kubectl create secret generic s3-secret \
  --from-literal=AWS_ACCESS_KEY_ID=XXX \
  --from-literal=AWS_SECRET_ACCESS_KEY=XXX \
  -n ml-production

# 4. Deploy InferenceService
kubectl apply -f inference-service.yaml -n ml-production

# 5. Check deployment status
kubectl get inferenceservice my-model -n ml-production
kubectl get pods -n ml-production

# 6. Get endpoint URL
INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
MODEL_URL=http://${INGRESS_HOST}/v1/models/my-model:predict

# 7. Test prediction
curl -X POST $MODEL_URL \
  -H 'Content-Type: application/json' \
  -d '{"instances": [[5.1, 3.5, 1.4, 0.2]]}'
```

---

**Вы готовы деплоить ML модели в production на Kubernetes с KServe!** 🚀✨
