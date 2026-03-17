---
name: ml-ops-evidently
description: Evidently AI skill for ml-ops agent. Defines role: model drift detection, data quality monitoring, data drift analysis. Use for monitoring ML models in production, detecting drift, data quality checks. Load before drift monitoring tasks.
---
# Skill: Evidently AI для Model Drift Detection и Data Quality Monitoring

**Полная спецификация по мониторингу ML моделей с Evidently AI**

---

## Ваша Роль

Вы — **MLOps специалист по мониторингу ML моделей**. Настраиваете drift detection и data quality monitoring с Evidently AI.

---

## Что Вы Делаете Самостоятельно ✅

### Model Drift Detection
- Data drift detection (feature distribution changes)
- Target drift detection (target variable changes)
- Concept drift detection (relationship between features and target)
- Prediction drift detection (prediction distribution changes)
- Drift severity scoring

### Data Quality Monitoring
- Missing values detection
- Duplicate detection
- Data type validation
- Range validation
- Category drift detection
- Data integrity checks

### Monitoring Reports
- Daily/weekly/monthly monitoring reports
- Real-time drift alerts
- Dashboard creation (Grafana, Streamlit)
- Email/Slack notifications
- Historical drift analysis

### Metrics и Thresholds
- Statistical tests (KS test, Chi-Square, Wasserstein distance)
- Custom metrics и scoring
- Threshold tuning
- Alert configuration

---

## Что Вы Делегируете ❌

- **ML model deployment** → `@ml-ops-kubernetes-kserve`
- **Model training** → `@jupyter-text`
- **Model code** → `@python-coder`
- **Dashboard infrastructure** → `@ml-ops-kubernetes-kserve` (если нужно деплоить дашборд)

---

## Установка Evidently

### Basic Installation

```bash
# Установка Evidently
pip install evidently

# Или с дополнительными зависимостями
pip install evidently[dashboard]  # Для HTML дашбордов
pip install evidently[perf_counter]  # Для perf_counter метрик
```

### Docker Installation

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install Evidently
RUN pip install evidently pandas numpy scikit-plotly

# Copy monitoring script
COPY monitoring_script.py .
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Run monitoring
CMD ["python", "monitoring_script.py"]
```

---

## Basic Drift Detection

### Data Drift Detection

```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
import pandas as pd

# Reference data (training set)
reference_data = pd.read_csv("train_data.csv")

# Current data (production data)
current_data = pd.read_csv("production_data.csv")

# Column mapping
column_mapping = ColumnMapping(
    target="target",
    prediction="prediction",
    numerical_features=["feature1", "feature2", "feature3"],
    categorical_features=["cat_feature1", "cat_feature2"]
)

# Data drift report
data_drift_report = Report(metrics=[
    DataDriftPreset()
])

# Выполнение анализа
data_drift_report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Сохранение HTML отчёта
data_drift_report.save_html("data_drift_report.html")

# Получение drift score
drift_score = data_drift_report.as_dict()["metrics"][0]["result"]["drift_score"]
print(f"Data drift score: {drift_score}")

# Drift detected?
drift_detected = data_drift_report.as_dict()["metrics"][0]["result"]["dataset_drift"]
print(f"Drift detected: {drift_detected}")
```

### Target Drift Detection

```python
from evidently.metric_preset import TargetDriftPreset

# Target drift report
target_drift_report = Report(metrics=[
    TargetDriftPreset()
])

target_drift_report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Сохранение отчёта
target_drift_report.save_html("target_drift_report.html")

# Получение информации о target drift
target_drift_info = target_drift_report.as_dict()["metrics"][1]["result"]
print(f"Target drift detected: {target_drift_info['dataset_drift']}")
print(f"Target drift score: {target_drift_info['drift_score']}")
```

### Prediction Drift Detection

```python
from evidently.metric_preset import DataQualityPreset

# Prediction drift (распределение предсказаний)
prediction_drift_report = Report(metrics=[
    DataQualityPreset()
])

prediction_drift_report.run(
    reference_data=reference_data,
    current_data=current_data
)

prediction_drift_report.save_html("prediction_drift_report.html")
```

---

## Advanced Drift Detection

### Custom Drift Thresholds

```python
from evidently.options import DriftOptions

# Настройка порогов для drift detection
drift_options = DriftOptions(
    confidence=0.95,  # Уровень доверия
    threshold=0.05,    # Порог KS test
    nbins=50           # Количество бинов для гистограмм
)

# Data drift с custom thresholds
data_drift_report = Report(metrics=[
    DataDriftPreset(options=drift_options)
])

data_drift_report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

# Проверка порогов
drift_metrics = data_drift_report.as_dict()["metrics"][0]["result"]["drift_by_columns"]
for feature, metric in drift_metrics.items():
    drift_detected = metric["drift_detected"]
    p_value = metric["stat_test"]["p_value"]
    print(f"{feature}: drift={drift_detected}, p_value={p_value}")
```

### Concept Drift Detection

```python
from evidently.metric_preset import CatTargetDriftPreset
from evidently.metric_preset import NumTargetDriftPreset

# Concept drift (relationship между features и target изменилась)
concept_drift_report = Report(metrics=[
    CatTargetDriftPreset()  # Для категориального target
    # или
    NumTargetDriftPreset()  # Для числового target
])

concept_drift_report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=column_mapping
)

concept_drift_report.save_html("concept_drift_report.html")

# Получение concept drift метрик
concept_drift_info = concept_drift_report.as_dict()["metrics"][0]["result"]
print(f"Concept drift score: {concept_drift_info['drift_score']}")
```

### Drift Severity Scoring

```python
def calculate_drift_severity(drift_report):
    """Расчёт severity drift"""
    drift_metrics = drift_report.as_dict()["metrics"][0]["result"]["drift_by_columns"]

    severity_scores = {}
    for feature, metric in drift_metrics.items():
        drift_score = metric["drift_score"]
        p_value = metric["stat_test"]["p_value"]

        # Severity classification
        if drift_score > 0.8:
            severity = "CRITICAL"
        elif drift_score > 0.5:
            severity = "HIGH"
        elif drift_score > 0.2:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        severity_scores[feature] = {
            "severity": severity,
            "drift_score": drift_score,
            "p_value": p_value
        }

    return severity_scores

# Использование
severity_scores = calculate_drift_severity(data_drift_report)

# Фильтрация критичных признаков
critical_features = [f for f, s in severity_scores.items() if s["severity"] == "CRITICAL"]
print(f"Critical drift in features: {critical_features}")

# Автоматический alert если есть CRITICAL drift
if critical_features:
    send_alert(f"CRITICAL drift detected in: {critical_features}")
```

---

## Data Quality Monitoring

### Missing Values Detection

```python
from evidently.metric_preset import DataQualityPreset

# Data quality report
data_quality_report = Report(metrics=[
    DataQualityPreset()
])

data_quality_report.run(
    reference_data=reference_data,
    current_data=current_data
)

data_quality_report.save_html("data_quality_report.html")

# Получение информации о missing values
quality_metrics = data_quality_report.as_dict()["metrics"][0]["result"]
missing_values = quality_metrics["current_stats"]["missing_values"]

print("Missing values by column:")
for column, count in missing_values.items():
    percentage = (count / len(current_data)) * 100
    print(f"  {column}: {count} ({percentage:.2f}%)")

# Alert если missing values увеличились
for column, count in missing_values.items():
    ref_count = reference_data[column].isna().sum()
    if count > ref_count * 1.5:  # Увеличились на 50%
        send_alert(f"Missing values increased in {column}: {ref_count} -> {count}")
```

### Duplicate Detection

```python
# Поиск дубликатов
def check_duplicates(data, column_name="id"):
    """Проверка на дубликаты"""
    duplicates = data.duplicated(subset=[column_name])
    duplicate_count = duplicates.sum()
    duplicate_percentage = (duplicate_count / len(data)) * 100

    return {
        "duplicate_count": int(duplicate_count),
        "duplicate_percentage": float(duplicate_percentage)
    }

# Проверка reference data
ref_duplicates = check_duplicates(reference_data)
print(f"Reference duplicates: {ref_duplicates}")

# Проверка current data
curr_duplicates = check_duplicates(current_data)
print(f"Current duplicates: {curr_duplicates}")

# Alert если дубликаты увеличились
if curr_duplicates["duplicate_percentage"] > ref_duplicates["duplicate_percentage"] * 2:
    send_alert(f"Duplicates increased: {ref_duplicates} -> {curr_duplicates}")
```

### Range Validation

```python
# Валидация диапазонов значений
def validate_ranges(current_data, reference_data):
    """Проверка диапазонов значений"""
    violations = {}

    for column in reference_data.columns:
        if reference_data[column].dtype in ['int64', 'float64']:
            # Для числовых признаков
            min_val = reference_data[column].min()
            max_val = reference_data[column].max()

            # Проверка в current data
            curr_min = current_data[column].min()
            curr_max = current_data[column].max()

            if curr_min < min_val or curr_max > max_val:
                violations[column] = {
                    "expected_range": (min_val, max_val),
                    "actual_range": (curr_min, curr_max),
                    "violation": True
                }

    return violations

# Использование
violations = validate_ranges(current_data, reference_data)

if violations:
    print("Range violations:")
    for column, violation in violations.items():
        print(f"  {column}: expected {violation['expected_range']}, got {violation['actual_range']}")
        send_alert(f"Range violation in {column}")
```

### Category Drift Detection

```python
from evidently.metric_preset import CatTargetDriftPreset

# Для категориальных признаков
category_drift_report = Report(metrics=[
    CatTargetDriftPreset()
])

# Column mapping для категориальных признаков
cat_column_mapping = ColumnMapping(
    target="target",
    categorical_features=["category1", "category2"]
)

category_drift_report.run(
    reference_data=reference_data,
    current_data=current_data,
    column_mapping=cat_column_mapping
)

category_drift_report.save_html("category_drift_report.html")

# Получение информации о категориальном drift
cat_drift_info = category_drift_report.as_dict()["metrics"][0]["result"]
print(f"Category drift score: {cat_drift_info['drift_score']}")
```

---

## Real-time Monitoring

### Streaming Drift Detection

```python
from evidently import MetricPreset
from evidently import ColumnMapping
from evidently.calculation_engine.python import CalculationEngine
from evidently.ui.workspace import Workspace
from evidently.runner import DataDriftAnalyzer
from evidently.test_preset import NoTargetPerformanceTestPreset
from evidently import DatasetDriftMetric
import pandas as pd
from datetime import datetime

# Инициализация workspace
workspace = Workspace("my_project")

# Data drift analyzer
drift_analyzer = DataDriftAnalyzer(
    columns=["feature1", "feature2", "feature3"],
    timestamp_column="timestamp",
    window_size=1000,  # Размер окна для анализа
    n_samples=100,  # Количество samples для drift detection
    drift_threshold=0.05,  # Порог для drift detection
    calculation_engine=CalculationEngine.PYTHON
)

# Обновление analyzer с новыми данными
new_data = pd.read_csv("new_production_data.csv")

for idx, row in new_data.iterrows():
    # Добавление новой строки
    drift_analyzer.add(row)

    # Проверка drift каждые N rows
    if idx % 100 == 0:
        drift_result = drift_analyzer.analyze()

        if drift_result.drift_detected:
            print(f"Drift detected at {datetime.now()}")
            print(f"Drift score: {drift_result.drift_score}")
            print(f"Drifted columns: {drift_result.drifted_columns}")

            # Отправка alert
            send_alert(
                f"Real-time drift detected!\n"
                f"Drift score: {drift_result.drift_score}\n"
                f"Columns: {drift_result.drifted_columns}"
            )
```

### Batch Monitoring (Scheduled)

```python
import schedule
import time
from datetime import datetime

def run_daily_drift_monitoring():
    """Ежедневный мониторинг drift"""
    print(f"Running drift monitoring at {datetime.now()}")

    # Загрузка данных
    reference_data = pd.read_csv("reference_data.csv")
    current_data = pd.read_csv(f"production_data_{datetime.now().strftime('%Y%m%d')}.csv")

    # Data drift detection
    data_drift_report = Report(metrics=[DataDriftPreset()])
    data_drift_report.run(
        reference_data=reference_data,
        current_data=current_data
    )

    # Сохранение отчёта
    report_path = f"drift_reports/drift_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    data_drift_report.save_html(report_path)

    # Проверка drift
    drift_detected = data_drift_report.as_dict()["metrics"][0]["result"]["dataset_drift"]

    if drift_detected:
        # Отправка alert
        send_alert(
            f"Daily drift detected!\n"
            f"Report: {report_path}\n"
            f"Time: {datetime.now()}"
        )

    print(f"Drift monitoring completed: {drift_detected}")

# Планирование выполнения каждый день в 8:00
schedule.every().day.at("08:00").do(run_daily_drift_monitoring)

# Запуск
while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## Dashboard Creation

### Streamlit Dashboard

```python
# monitoring_dashboard.py
import streamlit as st
import pandas as pd
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
from evidently.metric_preset import DataQualityPreset
import json

st.set_page_config(
    page_title="ML Model Monitoring",
    layout="wide"
)

# Загрузка данных
st.sidebar.title("ML Model Monitoring Dashboard")
st.sidebar.file_uploader("Upload production data", type=["csv"])
st.sidebar.file_uploader("Upload reference data", type=["csv"])

# Секция для drift detection
st.header("Data Drift Detection")

if st.button("Analyze Drift"):
    # Загрузка данных
    reference_data = pd.read_csv("reference_data.csv")
    current_data = pd.read_csv("production_data.csv")

    # Drift analysis
    data_drift_report = Report(metrics=[DataDriftPreset()])
    data_drift_report.run(
        reference_data=reference_data,
        current_data=current_data
    )

    # Отображение результатов
    drift_metrics = data_drift_report.as_dict()["metrics"][0]["result"]
    drift_detected = drift_metrics["dataset_drift"]
    drift_score = drift_metrics["drift_score"]

    if drift_detected:
        st.error(f"⚠️ Drift detected! Score: {drift_score:.3f}")
    else:
        st.success(f"✅ No drift detected. Score: {drift_score:.3f}")

    # Drift по колонкам
    drift_by_columns = drift_metrics["drift_by_columns"]
    columns_df = pd.DataFrame.from_dict(drift_by_columns, orient='index')
    st.dataframe(columns_df)

    # Графики
    st.plotly_chart(data_drift_report.dashboard["drift"])

# Секция для data quality
st.header("Data Quality")

if st.button("Analyze Quality"):
    # Quality analysis
    quality_report = Report(metrics=[DataQualityPreset()])
    quality_report.run(
        reference_data=reference_data,
        current_data=current_data
    )

    # Отображение результатов
    quality_metrics = quality_report.as_dict()["metrics"][0]["result"]
    missing_values = quality_metrics["current_stats"]["missing_values"]

    # Missing values chart
    missing_df = pd.DataFrame(list(missing_values.items()), columns=["Column", "Missing Count"])
    st.bar_chart(missing_df, x="Column", y="Missing Count")

    # Отображение всех метрик
    st.json(quality_metrics)
```

### Grafana Dashboard (через Prometheus)

```python
# Экспорт drift metrics в Prometheus
from prometheus_client import start_http_server, Gauge
import time

# Создание Gauge метрик
drift_score_gauge = Gauge('evidently_drift_score', 'Data drift score', ['feature'])
drift_detected_gauge = Gauge('evidently_drift_detected', 'Drift detection flag')

def update_prometheus_metrics(drift_report):
    """Обновление Prometheus метрик"""
    drift_metrics = drift_report.as_dict()["metrics"][0]["result"]["drift_by_columns"]

    # Обновление drift score для каждой колонки
    for feature, metric in drift_metrics.items():
        drift_score_gauge.labels(feature=feature).set(metric["drift_score"])

    # Обновление флага drift detection
    dataset_drift = drift_report.as_dict()["metrics"][0]["result"]["dataset_drift"]
    drift_detected_gauge.set(1 if dataset_drift else 0)

# Запуск Prometheus server
start_http_server(8000)

# Цикл обновления метрик
while True:
    # Drift analysis
    data_drift_report = Report(metrics=[DataDriftPreset()])
    data_drift_report.run(
        reference_data=reference_data,
        current_data=current_data
    )

    # Обновление Prometheus метрик
    update_prometheus_metrics(data_drift_report)

    time.sleep(300)  # Обновление каждые 5 минут
```

---

## Alerts и Notifications

### Email Alerts

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_alert(subject, body, to_email):
    """Отправка email alert"""
    from_email = "monitoring@company.com"
    smtp_server = "smtp.company.com"
    smtp_port = 587
    smtp_username = "monitoring@company.com"
    smtp_password = "your-password"

    # Создание сообщения
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    # Отправка
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()
    server.login(smtp_username, smtp_password)
    server.send_message(msg)
    server.quit()

# Использование
if drift_detected:
    send_email_alert(
        subject="⚠️ Model Drift Detected",
        body=f"Drift detected in production model.\nDrift score: {drift_score}\nTime: {datetime.now()}",
        to_email="ml-team@company.com"
    )
```

### Slack Alerts

```python
import requests
import json

def send_slack_alert(message, webhook_url):
    """Отправка Slack alert"""
    slack_data = {
        "text": message,
        "username": "ML Monitoring Bot",
        "icon_emoji": ":warning:"
    }

    response = requests.post(webhook_url, json=slack_data)

    if response.status_code != 200:
        print(f"Failed to send Slack alert: {response.text}")

# Использование
if drift_detected:
    send_slack_alert(
        message=f"⚠️ Model Drift Detected!\nDrift score: {drift_score}",
        webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    )
```

### Alert Routing

```python
def route_alert(drift_severity, message):
    """Маршрутизация alert по severity"""
    if drift_severity == "CRITICAL":
        # Отправка всем каналам
        send_email_alert("CRITICAL Drift", message, "ml-team@company.com")
        send_slack_alert(f"@channel CRITICAL: {message}", slack_webhook_critical)
        send_pagerduty_alert("critical_drift", message, pagerduty_key)

    elif drift_severity == "HIGH":
        # Email + Slack
        send_email_alert("High Drift", message, "ml-team@company.com")
        send_slack_alert(f"High drift detected: {message}", slack_webhook_general)

    elif drift_severity == "MEDIUM":
        # Только Slack
        send_slack_alert(f"Medium drift: {message}", slack_webhook_general)

    elif drift_severity == "LOW":
        # Логирование
        log_message(message)

# Использование
severity_scores = calculate_drift_severity(data_drift_report)
for feature, score in severity_scores.items():
    if score["severity"] in ["CRITICAL", "HIGH"]:
        message = f"Drift in {feature}: {score['severity']}, score={score['drift_score']}"
        route_alert(score["severity"], message)
```

---

## Best Practices

### Monitoring Frequency

```python
# Рекомендуемые частоты мониторинга
MONITORING_FREQUENCY = {
    "real_time": "Continuous",  # Для критичных систем
    "high_frequency": "5 min",  # Для production моделей
    "medium_frequency": "1 hour",  # Для staging моделей
    "low_frequency": "1 day",  # Для анализа трендов
}
```

### Reference Data Update

```python
# Обновление reference data периодически
def update_reference_data(reference_data_path, current_data):
    """Обновление reference data для улучшения drift detection"""
    ref_data = pd.read_csv(reference_data_path)

    # Добавление новых данных (sliding window)
    updated_ref = pd.concat([ref_data, current_data])
    updated_ref = updated_ref.tail(10000)  # Последние 10K строк

    # Сохранение
    updated_ref.to_csv(reference_data_path, index=False)

# Использование раз в неделю
if datetime.now().weekday() == 0:  # Понедельник
    update_reference_data("reference_data.csv", current_data)
```

### Threshold Tuning

```python
# Адаптивные пороги
def calculate_adaptive_threshold(historical_drift_scores, percentile=95):
    """Расчёт адаптивного порога на основе исторических данных"""
    threshold = np.percentile(historical_drift_scores, percentile)
    return threshold

# Использование
historical_scores = [0.02, 0.03, 0.05, 0.04, 0.06, 0.03]
adaptive_threshold = calculate_adaptive_threshold(historical_scores)
print(f"Adaptive threshold: {adaptive_threshold}")
```

---

## Checklist Перед Настройкой Monitoring

### Evidently Setup
- [ ] Evidently установлен
- [ ] Зависимости установлены (pandas, numpy, scikit-plotly)
- [ ] Reference data загружен
- [ ] Current data source настроен

### Drift Detection
- [ ] Data drift detection настроен
- [ ] Target drift detection настроен
- [ ] Concept drift detection настроен
- [ ] Drift thresholds настроены
- [ ] Severity scoring настроен

### Data Quality
- [ ] Missing values detection настроен
- [ ] Duplicate detection настроен
- [ ] Range validation настроен
- [ ] Category drift detection настроен

### Monitoring System
- [ ] Dashboard создан (Streamlit/Grafana)
- [ ] Alerts настроены (Email/Slack)
- [ ] Alert routing настроен
- [ ] Monitoring frequency настроен
- [ ] Historical drift analysis настроен

### Testing
- [ ] Monitoring протестирован на synthetic data
- [ ] Alerts протестированы
- [ ] Dashboard проверен
- [ ] Latency monitoring проверен

---

**Вы готовы настраивать мониторинг ML моделей с Evidently AI!** 🚀✨
