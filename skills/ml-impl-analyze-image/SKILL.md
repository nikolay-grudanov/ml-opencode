---
name: ml-impl-analyze-image
description: Analyze images, plots, charts, and visualizations using jupyter-vision subagent. Use this when you need to interpret visual data from Jupyter notebooks, screenshots, or generated plots for climate analysis projects.
license: MIT
compatibility: opencode
metadata:
  audience: data-scientists
  workflow: jupyter-analysis
---

## What I do

- Analyze plots, charts, and visualizations from Jupyter notebooks
- Interpret matplotlib/seaborn graphs for climate data
- Verify visual outputs match expected patterns (e.g., temperature trends)
- Describe image content for documentation or debugging
- Compare multiple plots side-by-side

## When to use me

Use this skill when you encounter:

- **Jupyter notebook outputs** with plots that need interpretation
- **Climate data visualizations** (temperature trends, seasonal patterns)
- **Model evaluation plots** (actual vs predicted, residuals)
- **Screenshots** of notebook cells or error messages
- **Requests like**: "Что показывает этот график?", "Этот тренд правильный?", "Опишите эту визуализацию"

## How to delegate to jupyter-vision

The `jupyter-vision` subagent is specialized for visual analysis. To use it:

### Method 1: Direct mention (recommended)
```
@jupyter-vision analyze this plot: [attach image or describe location]
```

### Method 2: Task tool (for complex workflows)
```python
# If you need to create a subtask
task({
  "agent": "jupyter-vision",
  "instruction": "Analyze temperature trend plot in cell 15 and verify it shows expected seasonal patterns for Belarus climate data"
})
```

## Best practices

### 1. Always provide context
Tell jupyter-vision what plot should represent:

❌ Bad: "Что на этом изображении?"
❌ Bad: "Проанализируйте этот график."

✅ Good: "Это должен быть временной ряд температур Беларуси (1743-2020). Ожидаемый диапазон: -20°C до +30°C. Проверьте есть ли сезонные паттерны и тренд потепления."
✅ Good: "Это график разбиения train/test (80/20). Ожидается: нет утечки данных между train (синий) и test (оранжевый), сезонные паттерны сохранены. Проверьте корректность."

### 2. Specify expected patterns/values
- **Temperature range**: -20°C to +30°C for Belarus climate
- **Seasonal patterns**: Winter dips (Dec-Feb), summer peaks (Jun-Aug)
- **Time periods**: 1743-2013, or specific subsets
- **Model performance**: MAE < 2°C, RMSE < 2.5°C, R² > 0.80

### 3. Ask specific questions
Instead of general analysis, ask for verification:

✅ "Показывает ли это ожидаемые сезонные циклы?"
✅ "Есть ли проблемы с качеством данных (пропуски, скачки, выбросы)?"
✅ "Соответствует ли визуализация заявленным метрикам?"
✅ "Правильно ли разбиение train/test (нет утечки данных)?"

### 4. Reference notebook structure when needed
```
"Проверьте график в ячейке 8 файла climate_analysis.ipynb"
"Сравните таблицу метрик в ячейке 18 с визуализацией в ячейке 19"
"Проверьте что визуализация expanding window в ячейке 16 соответствует параметрам (WINDOW_SIZE=120, HORIZON=12)"
```

## Example delegations for climate analysis

### Verify raw temperature time series
```
@jupyter-vision Проанализируйте график исходного временного ряда температур.

Контекст:
- Страна: Беларусь
- Период: 1743-2020
- Ожидаемый диапазон: -20°C до +30°C
- Должно показывать: сезонные циклы (зимний минимум, летний максимум)

Вопросы:
1. Видны ли сезонные паттерны?
2. Есть ли тренд потепления в последние десятилетия (с 1950+)?
3. Есть ли очевидные проблемы с качеством данных (пропуски, нереалистичные значения)?
4. Температурный диапазон подходит для климата Беларуси?
```

### Check train/test split
```
@jupyter-vision Проверьте визуализацию разбиения train/test.

Контекст:
- Метод: Holdout 80/20
- Train: 1743-1960 (2532 месяцев)
- Test: 1960-2013 (634 месяцев)
- Критично: НЕТ утечки данных между train и test

Вопросы:
1. Есть ли четкая граница между train (синий) и test (оранжевый)?
2. Перекрываются ли train и test во времени?
3. Сохранены ли сезонные паттерны в обоих периодах?
4. Приблизительно ли разбиение 80/20?
```

### Analyze expanding window visualization
```
@jupyter-vision Проанализируйте график валидации expanding window.

Контекст:
- Метод: кросс-валидация с расширяющимся окном
- Параметры: WINDOW_SIZE=120 месяцев, HORIZON=12 месяцев
- Показывает: первые два сплита как пример

Вопросы:
1. Растет ли размер train с каждым сплитом (120 → 121 месяцев)?
2. Постоянен ли горизонт теста (12 месяцев)?
3. Правильно ли красная пунктирная линия отмечает границу train/test?
4. Правильно ли показан концепт expanding window?
```

### Verify model predictions
```
@jupyter-vision Проверьте график факт vs прогноз температур.

Контекст:
- Модель: линейная регрессия с лаговыми признаками
- Метрики: MAE=1.98°C, RMSE=2.60°C, R²=0.915
- Должно показывать: точки следуют тренду, умеренный разброс

Вопросы:
1. Следуют ли прогнозы общему тренду температур?
2. Соответствует ли разброс шаблону заявленным метрикам?
3. Есть ли очевидные систематические ошибки (например, недопрогноз экстремумы)?
4. Соответствует ли R²=0.915 (91.5% объясненной дисперсии) визуальному соответствию?
```

### Analyze residual plots
```
@jupyter-vision Проанализируйте график остатков во времени.

Контекст:
- Модель: линейная регрессия для прогнозирования температур
- Метрики: RMSE=2.60°C (стандартное отклонение остатков)
- Ожидается: случайный разброс вокруг нуля, нет паттернов

Вопросы:
1. Распределены ли остатки случайно вокруг нуля?
2. Есть ли систематические паттерны (например, сезонные, увеличивающаяся дисперсия)?
3. Соответствуют ли остатки RMSE=2.60°C (большинство в пределах ±2.6°C)?
4. Есть ли указание на неправильную спецификацию модели?
```

### Debug visualization issues
```
@jupyter-vision Я ожидаю график с определенными характеристиками, но он выглядит неправильно.

Контекст:
- Ячейка: 15 в HW_1_climate_analysis_GNA.ipynb
- Ожидается: линейный график температур с разбиением train/test
- Фактически: [опишите что видите - пустой, неправильные цвета и т.д.]

Вопросы:
1. Что на самом деле показывает текущий график?
2. Возможные проблемы: данные не загружены? неправильный индекс? неправильные столбцы?
3. Что мне проверить в коде (ячейка 15)?
```

## Common patterns to verify in climate analysis

### Temperature time series
- ✅ Seasonal cycles present (annual winter-summer oscillation)
- ✅ Realistic temperature range (-30°C to +40°C for mid-latitudes)
- ✅ No unrealistic values (e.g., < -50°C or > +50°C for monthly averages)
- ✅ Continuous time axis (no gaps or overlaps)
- ✅ Possible trend (warming or cooling) in long-term data

### Train/test split
- ✅ Clear temporal boundary (no overlap)
- ✅ Train first, test second (time order preserved)
- ✅ Approximate 80/20 split ratio
- ✅ Both periods show similar patterns (stationarity)

### Model predictions
- ✅ Predictions follow actual trend
- ✅ Error variance constant (homoscedasticity)
- ✅ No systematic bias (errors centered on zero)
- ✅ Reasonable scatter (consistent with error metrics)

### Residuals
- ✅ Random around zero (mean ≈ 0)
- ✅ Constant variance (no funnel shape)
- ✅ No autocorrelation (no patterns over time)
- ✅ Most within ±2-3 RMSE

## Quick checklist

Before delegating to jupyter-vision:

- [ ] **Image accessible** (attached, in notebook cell, or absolute path provided)
- [ ] **Context clear** (what should plot show?)
- [ ] **Expected patterns/values mentioned** (temperature range, seasonal patterns)
- [ ] **Specific questions asked** (not just "analyze this")
- [ ] **Notebook reference** if needed (cell number, filename)
- [ ] **Metrics to compare** (MAE, RMSE, R²)

## Troubleshooting

### If jupyter-vision enters infinite loop
This should NOT happen with current configuration. If it does:
1. Check agent configuration has `doom_loop: deny`
2. Check agent configuration has `steps: 5`
3. Ensure jupyter-vision has been reloaded after config changes
4. Report issue with: prompt used, image location, error messages

### If skill doesn't appear in list
1. Check path: `.opencode/skills/ml-impl-analyze-image/SKILL.md`
2. Check YAML header: `name` and `description` are required
3. Check directory name matches skill name: `ml-impl-analyze-image` directory
4. Restart OpenCode to reload skills
