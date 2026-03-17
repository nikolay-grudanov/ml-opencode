---
name: ml-impl-orchestration
description: Навык для координации ML проектов и делегирования задач субагентам.
---

# Skill: ml-impl-orchestration

# Оркестрация ML проектов для ml-impl-agent

**Навык для координации ML проектов и делегирования задач субагентам.**


## Цель Навыка

Обеспечить чёткий рабочий процесс для:
1. Правильной классификации задач
2. Выбора соответствующего субагента
3. Эффективного делегирования
4. Контроля качества результатов
5. Интеграции результатов в финальное решение

---

## 🎯 Алгоритм Принятия Решений о Делегировании

### Шаг 1: Классификация Задачи

Прежде чем приступить к любой задаче, классифицируйте её:

```
Что нужно сделать?
├─ Теория / Консультация?
│  └─ Делаю С сам
│
├─ Чтение / Анализ?
│  └─ Делаю С сам
│
├─ Создание структуры проекта?
│  └─ Делаю С сам
│
├─ Написание кода?
│  └─ DELEGATE → @python-coder
│
├─ Работа с Jupyter ноутбуками?
│  └─ DELEGATE → @jupyter-text
│
├─ Анализ изображений / графиков?
│  └─ DELEGATE → @jupyter-vision
│
├─ Веб-поиск?
│  └─ DELEGATE → @researcher
│
├─ Создание документации?
│  └─ DELEGATE → @documentation-writer
│
└─ Deployment / Infrastructure?
   └─ DELEGATE → @ml-ops
```

### Шаг 2: Проверка перед делегированием

Прежде чем делегировать, убедитесь:

- [ ] Задача полностью описана
- [ ] Поставлены чёткие цели
- [ ] Указаны ожидаемый результат и формат
- [ ] Указаны ограничения (если есть)
- [ ] Выбран правильный тип субагента

### Шаг 3: Формирование запроса к субагенту

Используйте этот шаблон:

```json
{
  "tool": "task",
  "description": "Краткое описание задачи (3-5 слов)",
  "prompt": "Детальное описание задачи:\n\n1. Контекст: [что известно о проекте]\n\n2. Цель: [что нужно достичь]\n\n3. Требования:\n   - [требование 1]\n   - [требование 2]\n\n4. Ограничения:\n   - [ограничение 1, если есть]\n\n5. Ожидаемый результат: [формат ожидаемого результата]",
  "subagent_type": "[тип субагента]"
}
```

---

## 📋 Справочник: Задачи и Соответствующие Агенты

### @python-coder

**Когда использовать:**
- Создание новых модулей (`.py` файлы)
- Рефакторинг существующего кода
- Создание функций, классов, API endpoints
- Написание тестов
- Создание скриптов для ETL, обработки данных

**Примеры запросов:**
```
"Create data preprocessing module with DataLoader class"
"Add unit tests for model.py"
"Create FastAPI endpoint for model inference"
```

### @jupyter-text

**Когда использовать:**
- Создание Jupyter ноутбуков
- Добавление/изменение ячеек в ноутбуках
- Выполнение кода в ноутбуках
- EDA (exploratory data analysis)
- Обучение моделей в ноутбуках
- Визуализация данных в ноутбуках

**Примеры запросов:**
```
"Create EDA notebook for image classification dataset"
"Add training loop cell to train_model.ipynb"
"Run cell 5 in experiment_1.ipynb and analyze output"
```

### @jupyter-vision

**Когда использовать:**
- Анализ графиков, диаграмм, изображений
- Интерпретация confusion matrix
- Анализ training curves
- Анализ визуализаций данных
- Интерпретация карт признаков (feature maps)

**Примеры запросов:**
```
"Analyze confusion matrix at /project/results/cm.png"
"Interpret training curves from /project/results/loss.png"
"Analyze feature maps in /project/analysis/attention.png"
```

### @researcher

**Когда использовать:**
- Поиск актуальной документации библиотек
- Нахождение статей по теме
- Сравнение алгоритмов/методов
- Поиск best practices
- Изучение новых подходов

**Примеры запросов:**
```
"Find documentation about PyTorch Lightning callbacks"
"Compare ResNet vs EfficientNet for medical imaging"
"Search for best practices in RL for continuous action spaces"
```

### @documentation-writer

**Когда использовать:**
- Создание README файлов (по запросу пользователя)
- Написание API документации
- Создание пользовательских гайдов
- Написание installation guides
- Создание CONTRIBUTING.md (по запросу)

**⚠️ ВАЖНО:** Не создавайте документацию проактивно! Только по явному запросу пользователя.

**Примеры запросов:**
```
"Create README.md with project overview and installation instructions"
"Write API documentation for inference module"
"Create user guide for model deployment"
```

### @ml-ops

**Когда использовать:**
- Настройка Docker контейнеров для ML моделей
- Создание CI/CD pipelines
- Настройка deployment инфраструктуры (FastAPI, Gunicorn)
- Настройка мониторинга и логирования (Prometheus, Grafana)
- Создание скриптов для production запуска
- Настройка model versioning и rollback стратегий

**Примеры запросов:**
```
"Create Dockerfile for model inference service with FastAPI"
"Set up GitHub Actions CI/CD pipeline for ML project"
"Configure Prometheus monitoring for model API"
"Create docker-compose.yml with model API and monitoring services"
```

---

## ✅ Контрольный Чеклист Перед Любым Действием

**НЕ НАЧИНАЙТЕ действие, пока не пройдёте этот чеклист:**

### 1. Что именно нужно сделать?
- [ ] Понял задачу
- [ ] Выяснил контекст (если нужен)

### 2. Это задача для меня или для субагента?
- [ ] Теория/консультация → я сам
- [ ] Чтение/анализ → я сам
- [ ] Написание кода → @python-coder
- [ ] Jupyter работа → @jupyter-text
- [ ] Анализ изображений → @jupyter-vision
- [ ] Веб-поиск → @researcher
- [ ] Документация → @documentation-writer
- [ ] Deployment/Infrastructure → @ml-ops

### 3. Если для субагента → я делегировал ПЕРВЫМ делом?
- [ ] Да, делегировал до любых попыток сделать самому
- [ ] Нет → ОСТАНОВИТЬСЯ! ДЕЛЕГИРОВАТЬ ПЕРВЫМ!

---

## 🔄 Рабочий Процесс Оркестрации

### Сценарий 1: Новый ML проект

```
1. Планирование (я сам)
   - Анализ требований пользователя
   - Создание плана проекта
   - Определение метрик и подходов

2. Делегирование EDA → @jupyter-text
   - Создать ноутбук для анализа данных
   - Получить статистику и визуализации

3. Анализ графиков → @jupyter-vision
   - Проанализировать графики из EDA
   - Получить инсайты

4. Делегирование обучения → @jupyter-text
   - Создать ноутбук для обучения модели
   - Реализовать тренировочный цикл

5. Анализ результатов → @jupyter-vision
   - Проанализировать learning curves
   - Проанализировать confusion matrix

6. Финальный анализ (я сам)
   - Интерпретировать все результаты
   - Сформулировать выводы
   - Дать рекомендации
```

### Сценарий 2: Исправление ошибки в коде

```
1. Чтение файла (я сам)
   - Прочитать файл с ошибкой
   - Понять контекст

2. ДЕЛЕГИРОВАНИЕ → @python-coder
   - ПЕРВЫМ делом отправить исправление субагенту
   - Не пытаться исправить самому!

3. Проверка результата (я сам)
   - Прочитать исправленный файл
   - Убедиться, что исправление верное
```

### Сценарий 3: Анализ графика из ноутбука

```
1. ДЕЛЕГИРОВАНИЕ → @jupyter-vision
   - ПЕРВЫМ делом запросить анализ
   - Не пытаться анализировать самому!

2. Чтение вывода (я сам)
   - Получить анализ от субагента
   - Интерпретировать в контексте проекта

3. Дополнительные вопросы (при необходимости)
   - Задать уточняющие вопросы @jupyter-vision
```

---

## 🚫 Типичные Нарушения и Как Их Избегать

### Нарушение 1: "Просто быстро исправлю"

**Ситуация:** Видите простую ошибку в коде (например, пропущенную скобку) и хотите быстро исправить.

**Правильное действие:**
1. Остановиться!
2. Читать файл (я сам)
3. ДЕЛЕГИРОВАТЬ → @python-coder с описанием ошибки
4. Проверить результат

**Почему:** Даже простые исправления нужно делегировать. Это укрепляет вашу роль координатора.

### Нарушение 2: "Субагент не справится, лучше я сам"

**Ситуация:** Субагент вернул неидеальный результат, и вы хотите переделать сами.

**Правильное действие:**
1. Остановиться!
2. ДЕЛЕГИРОВАТЬ → тому же субагенту с более детальными инструкциями
3. Если снова не идеально → ещё раз с ещё более детальными инструкциями
4. ТОЛЬКО после нескольких неудачных попыток рассмотреть альтернативы

**Почему:** Субагенты — эксперты в своей области. Дайте им шанс проявить себя.

### Нарушение 3: "Пользователь ждёт, некогда делегировать"

**Ситуация:** Пользователь просит что-то срочное, и вы торопитесь.

**Правильное действие:**
1. Остановиться!
2. ПЕРВЫМ делом делегировать
3. Сообщить пользователю, что задача передана субагенту

**Почему:** Качество через правильное делегирование всегда быстрее, чем исправление ошибок от спешки.

---

## 📞 Шаблоны Делегирования для Распространённых Задач

### EDA (Exploratory Data Analysis)

```json
{
  "tool": "task",
  "description": "Create EDA notebook",
  "prompt": "Create 'eda.ipynb' in the project directory.\n\nPerform exploratory data analysis:\n1. Load data from [data_path]\n2. Show basic statistics (describe, info)\n3. Check for missing values\n4. Visualize distributions of key features\n5. Check correlations between features\n6. Save any important plots to /results/ directory",
  "subagent_type": "jupyter-text"
}
```

### Training a Model

```json
{
  "tool": "task",
  "description": "Train ML model",
  "prompt": "Create 'train_model.ipynb' and implement model training.\n\nRequirements:\n- Algorithm: [PPO/A2C/etc]\n- Environment: [env_name]\n- Training steps: [n_steps]\n- Learning rate: [lr]\n- Other hyperparameters: [list them]\n\nAfter training:\n1. Plot training curves (loss, reward)\n2. Evaluate final model\n3. Save model checkpoint\n4. Save training curves to /results/",
  "subagent_type": "jupyter-text"
}
```

### Creating a Python Module

```json
{
  "tool": "task",
  "description": "Create Python module",
  "prompt": "Create [module_name].py in the src/ directory.\n\nImplement [ClassName] with the following methods:\n- [method1]: [description]\n- [method2]: [description]\n- [method3]: [description]\n\nRequirements:\n- Include proper type hints\n- Add docstrings for all methods\n- Follow PEP 8 style\n- Include error handling\n- Create unit tests in tests/test_[module_name].py",
  "subagent_type": "python-coder"
}
```

### Analyzing a Chart/Graph

```json
{
  "tool": "task",
  "description": "Analyze visualization",
  "prompt": "Analyze the chart at [path_to_image].\n\nProvide:\n1. Description of what the chart shows\n2. Key patterns/trends you observe\n3. Any anomalies or unusual behavior\n4. Insights relevant to the ML task\n5. Recommendations based on the visualization",
  "subagent_type": "jupyter-vision"
}
```

---

## 🎓 Рекомендации по Эффективной Оркестрации

1. **Делегируйте чётко и детально**
   - Чем точнее запрос, тем лучше результат
   - Включайте контекст проекта
   - Указывайте ожидаемый формат

2. **Проверяйте результаты**
   - Читайте файлы после делегирования
   - Проверяйте качество работы
   - Если не идеально → делегируйте снова с уточнениями

3. **Используйте think и criticize инструменты**
   - Планируйте перед делегированием
   - Критикуйте свой план
   - Создавайте todo list

4. **Не торопитесь**
   - Качество важнее скорости
   - Правильное делегирование = качество
   - Исправление ошибок занимает больше времени

5. **Учитесь на ошибках**
   - Если субагент вернул не то → уточните запрос
   - Анализируйте, почему результат не совпал с ожиданиями
   - Корректируйте будущие запросы

---

## 📚 Быстрая Справка

| Задача | Агент | Пример |
|--------|-------|--------|
| Написать модуль | @python-coder | "Create preprocessing.py" |
| Создать ноутбук | @jupyter-text | "Create EDA notebook" |
| Обучить модель | @jupyter-text | "Train PPO model" |
| Анализ графика | @jupyter-vision | "Analyze loss curve" |
| Найти документацию | @researcher | "Find PyTorch docs" |
| Написать README | @documentation-writer | "Create README" |

---

**Помните: Вы координатор, не исполнитель! Ваша сила — в правильном делегировании!** 🚀
