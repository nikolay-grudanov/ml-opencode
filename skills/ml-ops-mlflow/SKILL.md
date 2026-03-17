---
name: ml-ops-mlflow
description: MLflow skill for ml-ops agent. Defines role: experiment tracking, model registry, serving with MLflow. Use for tracking experiments, versioning models, deploying with MLflow server. Load before MLflow tasks.
---
# Skill: MLflow для Experiment Tracking, Model Registry и Serving

**Полная спецификация по MLflow для управления ML экспериментами и деплоем**

---

## Ваша Роль

Вы — **MLOps специалист по MLflow**. Управляете полным жизненным циклом ML моделей через MLflow.

---

## Что Вы Делаете Самостоятельно ✅

### Experiment Tracking
- Настройка MLflow Tracking Server
- Логирование параметров, метрик, артефактов
- Логирование моделей (sklearn, pytorch, tensorflow)
- Логирование датасетов
- Сравнение экспериментов

### Model Registry
- Регистрация моделей в MLflow Registry
- Управление stages (Staging, Production, Archived)
- Управление версиями моделей
- Model versioning strategies
- Model lineage tracking

### MLflow Serving
- Деплой моделей через MLflow Models
- MLflow Serving (REST API)
- Kubernetes integration
- Docker deployment

### Model Management
- А/B testing через MLflow
- Canary deployments
- Batch inference jobs
- Model promotion workflows

---

## Что Вы Делегируете ❌

- **Model training** → `@jupyter-text` (эксперименты в ноутбуках)
- **Model code** → `@python-coder` (production modules)
- **Model optimization** → `@python-coder` (quantization, pruning)
- **Inference logic** → `@python-coder` (custom predictors)
- **Deployment infra** → `@ml-ops-kubernetes-kserve` (если K8s/KServe нужен)

---

## MLflow Tracking Server Setup

### Local MLflow Server

```bash
# Запуск локального MLflow Tracking Server
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlartifacts \
  --host 0.0.0.0 \
  --port 5000

# Или с PostgreSQL
mlflow server \
  --backend-store-uri postgresql://user:password@localhost:5432/mlflow \
  --default-artifact-root s3://my-bucket/mlartifacts \
  --host 0.0.0.0 \
  --port 5000
```

### Docker MLflow Server

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install MLflow
RUN pip install mlflow[extras] psycopg2-binary boto3

# Create directories
RUN mkdir -p /app/mlartifacts

# Expose port
EXPOSE 5000

# Run MLflow server
CMD ["mlflow", "server", \
      "--backend-store-uri", "postgresql://mlflow:mlflow@postgres:5432/mlflow", \
      "--default-artifact-root", "/app/mlartifacts", \
      "--host", "0.0.0.0", \
      "--port", "5000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: mlflow
      POSTGRES_USER: mlflow
      POSTGRES_PASSWORD: mlflow
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mlflow:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    volumes:
      - ./mlartifacts:/app/mlartifacts

volumes:
  postgres_data:
```

---

## Experiment Tracking

### Базовое Логирование

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import pandas as pd

# Настройка MLflow
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("iris-classification")

# Загрузка данных
data = pd.read_csv("iris.csv")
X = data.drop('target', axis=1)
y = data['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Начало эксперимента
with mlflow.start_run():
    # Логирование параметров
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 10)
    mlflow.log_param("random_state", 42)

    # Обучение модели
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Предсказания
    predictions = model.predict(X_test)

    # Логирование метрик
    accuracy = accuracy_score(y_test, predictions)
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("test_samples", len(y_test))

    # Логирование модели
    mlflow.sklearn.log_model(
        model,
        "random_forest_model",
        registered_model_name="IrisClassifier"
    )

    # Логирование артефактов
    mlflow.log_artifact("feature_importance.png")
    mlflow.log_artifact("confusion_matrix.png")

    print(f"Accuracy: {accuracy}")
```

### Логирование PyTorch Модели

```python
import mlflow
import mlflow.pytorch
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# Настройка MLflow
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("pytorch-image-classification")

# PyTorch модель
class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.fc = nn.Linear(64 * 6 * 6, 10)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.max_pool2d(x, 2)
        x = torch.relu(self.conv2(x))
        x = torch.max_pool2d(x, 2)
        x = x.view(-1, 64 * 6 * 6)
        x = self.fc(x)
        return x

model = SimpleCNN()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters())

# Training loop
with mlflow.start_run():
    mlflow.log_param("epochs", 10)
    mlflow.log_param("learning_rate", 0.001)
    mlflow.log_param("batch_size", 32)

    for epoch in range(10):
        epoch_loss = 0.0

        for batch_idx, (data, target) in enumerate(train_loader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        # Логирование метрик по эпохам
        avg_loss = epoch_loss / len(train_loader)
        mlflow.log_metric("train_loss", avg_loss, step=epoch)

        print(f"Epoch {epoch}: Loss = {avg_loss}")

    # Логирование модели
    mlflow.pytorch.log_model(
        model,
        "pytorch_cnn_model",
        registered_model_name="ImageClassifier"
    )
```

### Логирование Custom Artifacts

```python
import mlflow
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

with mlflow.start_run():
    # ... обучение модели ...

    # Логирование датасета
    train_data_sample = X_train.head(100)
    train_data_sample.to_csv("train_data_sample.csv", index=False)
    mlflow.log_artifact("train_data_sample.csv")

    # Создание confusion matrix
    cm = confusion_matrix(y_test, predictions)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)

    # Сохранение графика
    plt.figure(figsize=(8, 6))
    disp.plot()
    plt.savefig("confusion_matrix.png", dpi=300)
    plt.close()

    # Логирование графика
    mlflow.log_artifact("confusion_matrix.png")

    # Логирование custom metrics (словарь)
    custom_metrics = {
        "precision": 0.95,
        "recall": 0.93,
        "f1_score": 0.94
    }
    mlflow.log_metrics(custom_metrics)

    # Логирование dictionary как параметра
    hyperparams = {
        "n_estimators": 100,
        "max_depth": 10,
        "min_samples_split": 2,
        "min_samples_leaf": 1
    }
    mlflow.log_params(hyperparams)
```

### Логирование с Tags и Notes

```python
with mlflow.start_run() as run:
    # Добавление tags
    mlflow.set_tag("model_type", "random_forest")
    mlflow.set_tag("dataset", "iris")
    mlflow.set_tag("author", "data-scientist")
    mlflow.set_tag("git_commit", "abc123")

    # Добавление описания
    mlflow.set_tag("description", "Random Forest для классификации iris с tune гиперпараметров")

    # Добавление notes
    mlflow.set_text("experiment_notes", """
    Эксперимент с Random Forest классификатором.

    Результаты:
    - Accuracy: 0.96
    - Тренировка заняла 5 минут

    Следующие шаги:
    - Попробовать XGBoost
    - Добавить feature engineering
    """)

    # ... обучение модели ...
```

---

## Model Registry

### Регистрация Модели

```python
import mlflow
from mlflow.tracking import MlflowClient

# Создание клиента
client = MlflowClient(tracking_uri="http://localhost:5000")

# Регистрация новой модели
model_uri = "runs:/<run-id>/model"
model_version = client.create_model_version(
    name="IrisClassifier",
    source=model_uri,
    description="Random Forest v1.0"
)

print(f"Model version: {model_version.version}")
print(f"Model stage: {model_version.current_stage}")
```

### Управление Stages

```python
# Переход модели в Staging
client.transition_model_version_stage(
    name="IrisClassifier",
    version=1,
    stage="Staging"
)

# Переход в Production
client.transition_model_version_stage(
    name="IrisClassifier",
    version=1,
    stage="Production"
)

# Архивирование старой версии
client.transition_model_version_stage(
    name="IrisClassifier",
    version=2,
    stage="Archived"
)
```

### Получение Модели из Registry

```python
# Загрузка последней версии Production модели
import mlflow.sklearn

model = mlflow.sklearn.load_model(
    "models:/IrisClassifier/Production"
)

# Или загрузка конкретной версии
model_v1 = mlflow.sklearn.load_model(
    "models:/IrisClassifier/1"
)
```

### Model Versioning Strategies

```python
# Semantic versioning
def register_model_with_version(run_id, model_name, major, minor, patch):
    """Регистрация модели с semantic versioning"""
    client = MlflowClient()

    # Получение всех версий
    versions = client.get_latest_versions(model_name)
    latest_version = max([v.version for v in versions])

    # Новая версия
    new_version = int(latest_version) + 1

    # Регистрация
    model_version = client.create_model_version(
        name=model_name,
        source=f"runs:/{run_id}/model",
        description=f"v{major}.{minor}.{patch}"
    )

    return model_version.version

# Использование
with mlflow.start_run():
    # ... обучение ...
    version = register_model_with_version(
        run.info.run_id,
        "IrisClassifier",
        major=1,
        minor=0,
        patch=0
    )
    print(f"Registered version: {version}")
```

### Model Lineage Tracking

```python
# Получение lineage модели
from mlflow.tracking import MlflowClient

client = MlflowClient(tracking_uri="http://localhost:5000")

# Получение версии модели
model_version = client.get_model_version("IrisClassifier", "1")

# Получение run информации
run = client.get_run(model_version.run_id)

# Логирование lineage
print(f"Model version: {model_version.version}")
print(f"Model stage: {model_version.current_stage}")
print(f"Run ID: {model_version.run_id}")
print(f"Parameters: {run.data.params}")
print(f"Metrics: {run.data.metrics}")
print(f"Artifacts: {run.data.params}")

# Получение parent runs (если модель обучена на выходе другой модели)
parent_runs = client.search_runs(
    experiment_ids=[run.info.experiment_id],
    filter_string=f"tags.mlflow.parentRunId = '{run.info.run_id}'"
)
```

---

## MLflow Serving

### Локальный MLflow Serving

```bash
# Сборка Docker образа с моделью
mlflow models build-docker \
  -m models:/IrisClassifier/Production \
  -n iris-classifier

# Запуск контейнера
docker run -p 5001:8080 \
  --env "MLFLOW_MODEL_NAME=IrisClassifier" \
  iris-classifier:latest
```

### REST API Запросы

```bash
# Health check
curl http://localhost:5001/ping

# Prediction
curl -X POST http://localhost:5001/invocations \
  -H 'Content-Type: application/json' \
  -d '{
    "instances": [
      [5.1, 3.5, 1.4, 0.2],
      [6.2, 3.4, 5.4, 2.3]
    ]
  }'
```

```python
import requests
import json

# Загрузка модели
model_name = "IrisClassifier"
model_stage = "Production"

# Prediction
url = f"http://localhost:5001/invocations"
headers = {"Content-Type": "application/json"}

data = {
    "instances": [
        [5.1, 3.5, 1.4, 0.2],
        [6.2, 3.4, 5.4, 2.3]
    ]
}

response = requests.post(url, headers=headers, json=data)
predictions = response.json()

print(predictions)
```

### Kubernetes Deployment с MLflow

```yaml
# Deployment YAML для MLflow model
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlflow-model
  namespace: ml-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mlflow-model
  template:
    metadata:
      labels:
        app: mlflow-model
    spec:
      containers:
      - name: mlflow-model
        image: mlflow-model:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
        env:
        - name: MLFLOW_MODEL_NAME
          value: "IrisClassifier"
        - name: MLFLOW_MODEL_URI
          value: "s3://my-bucket/mlartifacts/IrisClassifier/Production"
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /ping
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ping
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mlflow-model-service
  namespace: ml-production
spec:
  selector:
    app: mlflow-model
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

### Custom Inference Code

```python
# custom_inference.py
import mlflow.pyfunc

class CustomInferenceModel(mlflow.pyfunc.PythonModel):
    def __init__(self):
        self.model = None

    def load_context(self, context):
        """Загрузка модели и зависимостей"""
        import joblib
        self.model = joblib.load(context.artifacts["model"])

    def predict(self, context, model_input):
        """Кастомная логика предсказания"""
        # Предобработка
        processed = self.preprocess(model_input)

        # Предсказание
        predictions = self.model.predict(processed)

        # Постобработка
        result = self.postprocess(predictions)

        return result

    def preprocess(self, input_data):
        """Предобработка данных"""
        import pandas as pd
        import numpy as np

        df = pd.DataFrame(input_data)
        # Ваша логика предобработки
        return df

    def postprocess(self, predictions):
        """Постобработка результатов"""
        import numpy as np

        # Ваша логика постобработки
        result = {
            "predictions": predictions.tolist(),
            "confidence": np.max(predictions).tolist()
        }
        return result

# Логирование модели с custom inference
with mlflow.start_run():
    model = CustomInferenceModel()

    mlflow.pyfunc.log_model(
        artifact_path="custom_model",
        python_model=model,
        registered_model_name="CustomInferenceModel"
    )
```

---

## A/B Testing с MLflow

### Настройка A/B Testing

```python
import mlflow
import numpy as np

# Версии моделей для A/B testing
model_a = mlflow.pyfunc.load_model("models:/IrisClassifier/1")
model_b = mlflow.pyfunc.load_model("models:/IrisClassifier/2")

def ab_testing_prediction(X):
    """A/B testing: 50% модель A, 50% модель B"""
    predictions = []

    for i, x in enumerate(X):
        # Random split: 50/50
        if i % 2 == 0:
            pred = model_a.predict([x])[0]
            model_used = "model_a"
        else:
            pred = model_b.predict([x])[0]
            model_used = "model_b"

        predictions.append({
            "prediction": pred,
            "model_used": model_used,
            "input_id": i
        })

    return predictions

# Логирование A/B testing результатов
with mlflow.start_run(run_name="ab_test_model_v1_vs_v2"):
    # Запуск A/B testing
    test_data = X_test
    results = ab_testing_prediction(test_data)

    # Расчёт метрик для каждой модели
    results_df = pd.DataFrame(results)
    model_a_results = results_df[results_df["model_used"] == "model_a"]
    model_b_results = results_df[results_df["model_used"] == "model_b"]

    # Логирование метрик
    mlflow.log_metric("model_a_accuracy", calculate_accuracy(model_a_results))
    mlflow.log_metric("model_b_accuracy", calculate_accuracy(model_b_results))
    mlflow.log_metric("model_a_samples", len(model_a_results))
    mlflow.log_metric("model_b_samples", len(model_b_results))

    # Логирование детальных результатов
    results_df.to_csv("ab_test_results.csv", index=False)
    mlflow.log_artifact("ab_test_results.csv")

    # Выбор лучшей модели
    if model_a_accuracy > model_b_accuracy:
        best_model = "model_a"
    else:
        best_model = "model_b"

    mlflow.set_tag("best_model", best_model)
    mlflow.set_tag("test_type", "ab_testing")
```

### Canary Deployment с MLflow

```python
def canary_deployment(traffic_split=0.1):
    """
    Canary deployment:
    - 90% traffic на production модель (v1)
    - 10% traffic на canary модель (v2)
    """
    import random

    production_model = mlflow.pyfunc.load_model("models:/IrisClassifier/Production")
    canary_model = mlflow.pyfunc.load_model("models:/IrisClassifier/Staging")

    def predict_with_canary(X):
        results = []
        for x in X:
            # Random traffic split
            if random.random() < traffic_split:
                pred = canary_model.predict([x])[0]
                model_used = "canary"
            else:
                pred = production_model.predict([x])[0]
                model_used = "production"

            results.append({
                "prediction": pred,
                "model_used": model_used
            })
        return results

    return predict_with_canary

# Использование
predict_function = canary_deployment(traffic_split=0.1)
results = predict_function(X_test)

# Логирование canary результатов
with mlflow.start_run(run_name="canary_deployment_v2"):
    # ... логирование метрик ...
    mlflow.log_metric("canary_traffic_percentage", 10)
    mlflow.log_metric("production_traffic_percentage", 90)
```

---

## Batch Inference

### Batch Prediction Job

```python
import mlflow
import pandas as pd
from pathlib import Path

def batch_prediction(input_path, output_path):
    """Batch inference job с MLflow моделью"""
    # Загрузка модели
    model = mlflow.pyfunc.load_model("models:/IrisClassifier/Production")

    # Загрузка данных
    data = pd.read_csv(input_path)

    # Batch prediction
    predictions = model.predict(data)

    # Сохранение результатов
    results = pd.DataFrame({
        "input_id": range(len(predictions)),
        "prediction": predictions
    })
    results.to_csv(output_path, index=False)

    return predictions

# Логирование batch job
with mlflow.start_run(run_name="batch_inference_job"):
    # Бatch prediction
    predictions = batch_prediction(
        input_path="batch_input.csv",
        output_path="batch_output.csv"
    )

    # Логирование метрик
    mlflow.log_metric("batch_size", len(predictions))
    mlflow.log_metric("job_duration_seconds", 45.6)

    # Логирование артефактов
    mlflow.log_artifact("batch_output.csv")
    mlflow.log_artifact("batch_input.csv")

    print(f"Processed {len(predictions)} predictions")
```

### Сcheduled Batch Job с MLflow

```python
from mlflow import projects
import os

# MLflow Project для batch job
# mlflow_project/MLproject
"""
name: batch_inference

entry_points:
  main:
    parameters:
      input_path: {type: string}
      output_path: {type: string}
    command: "python batch_job.py --input-path {input_path} --output-path {output_path}"
"""

# Запуск scheduled batch job
def run_scheduled_batch_job():
    """Запуск batch job по расписанию"""
    from mlflow.tracking import MlflowClient

    client = MlflowClient(tracking_uri="http://localhost:5000")

    # Запуск MLflow Project
    run = projects.run(
        uri="mlflow_project",
        entry_point="main",
        parameters={
            "input_path": "s3://my-bucket/batch_input.csv",
            "output_path": "s3://my-bucket/batch_output.csv"
        },
        experiment_name="batch_inference"
    )

    print(f"Started batch job: {run.info.run_id}")
    return run.info.run_id

# Использование в scheduled task (например, с cron)
if __name__ == "__main__":
    run_id = run_scheduled_batch_job()
    print(f"Batch job run ID: {run_id}")
```

---

## Best Practices

### Experiment Organization

```python
# Иерархическая структура экспериментов
experiments = {
    "iris": "iris-classification",
    "iris/models": "iris-model-comparison",
    "iris/optimization": "iris-hyperparameter-tuning",
    "mnist": "mnist-classification",
    "mnist/models": "mnist-model-comparison"
}

# Создание experiments
for name, display_name in experiments.items():
    try:
        mlflow.create_experiment(display_name)
        print(f"Created experiment: {display_name}")
    except Exception as e:
        print(f"Experiment {display_name} already exists")
```

### Model Versioning Convention

```python
# Конвенция именования моделей
MODEL_NAMING = {
    "prefix": "Iris",
    "version": "v{major}.{minor}.{patch}",
    "suffix": "RandomForest"
}

# Пример:
# Iris-v1.0.0-RandomForest
# Iris-v1.1.0-RandomForest
# Iris-v2.0.0-XGBoost

def get_model_name(major, minor, patch, model_type):
    """Генерация имени модели по конвенции"""
    return f"{MODEL_NAMING['prefix']}-v{major}.{minor}.{patch}-{model_type}"

# Использование
model_name = get_model_name(1, 0, 0, "RandomForest")
mlflow.register_model(f"runs:/{run_id}/model", model_name)
```

### Continuous Integration с MLflow

```yaml
# .github/workflows/mlflow.yml
name: MLflow Experiment CI

on: [push]

jobs:
  train-and-register:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9

      - name: Install dependencies
        run: |
          pip install mlflow[extras] scikit-learn

      - name: Run training script
        run: |
          mlflow run . \
            --experiment-name iris-classification \
            --backend-store-uri sqlite:///mlflow.db \
            --default-artifact-root ./mlartifacts
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}

      - name: Register best model
        run: |
          python register_best_model.py
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_REGISTRY_URI: ${{ secrets.MLFLOW_REGISTRY_URI }}
```

---

## Checklist Перед Использованием MLflow

### Tracking Server Setup
- [ ] MLflow Tracking Server запущен
- [ ] Backend store настроен (PostgreSQL/MySQL)
- [ ] Artifact root настроен (S3/GCS/локально)
- [ ] MLflow UI доступен (http://localhost:5000)
- [ ] Permissions настроены (RBAC)

### Experiment Tracking
- [ ] Experiment создан
- [ ] Tracking URI настроен
- [ ] Параметры логируются
- [ ] Метрики логируются
- [ ] Артефакты логируются
- [ ] Tags добавлены для организации

### Model Registry
- [ ] Модель зарегистрирована
- [ ] Versioning strategy определена
- [ ] Stage настроен (Staging/Production)
- [ ] Lineage трекается
- [ ] Model metadata добавлена

### Serving
- [ ] Model打包 (build-docker)
- [ ] Serving server запущен
- [ ] Health check проходит
- [ ] Prediction endpoint работает
- [ ] Monitoring настроен

---

**Вы готовы управлять ML экспериментами и деплоями с MLflow!** 🚀✨
