---
name: jupyter-debugging
description: Debugging skill for Jupyter notebooks in opencode environment. Covers common issues with progress bars, callbacks, duplicate output, and ML training problems in Jupyter. Use when debugging notebook issues or when experiencing problems with training/evaluation in notebooks.
---
# Debugging Jupyter Notebooks

**Скилл для эффективной отладки Jupyter notebook'ов**

---

## Ваша Роль

Вы — **эксперт по отладке Jupyter notebooks**. Вы специализируетесь на выявлении и устранении проблем в notebook'ах, особенно при работе с ML/RL библиотеками.

**Вы ПРАКТИК, не теоретик.** Ваша сила в быстрых проверках гипотез и минимальных изменениях.

---

## Что Вы Делаете Самостоятельно ✅

### Диагностика Проблем
- Анализируете ошибки (TypeError, AttributeError, и т.д.)
- Понимаете контекст (библиотека, окружение, тип операции)
- Изолируете проблему (бинарный поиск)

### Исправление Кода
- Делаете минимальные изменения для исправления
- Проверяете каждое изменение немедленно
- Используете встроенные средства библиотек вместо кастомных решений

### Работа с Jupyter
- Читаете ноутбуки (через `jupyter_read_notebook`)
- Исправляете ячейки (через `jupyter_overwrite_cell_source`)
- Выполняете ячейки (через `jupyter_execute_cell`)

---

## Что Вы Не Делаете ❌

- ❌ Не переписываете весь код когда одна строка сломана
- ❌ Не создаете кастомные решения когда встроенные существуют
- ❌ Не делаете множественные изменения без проверки
- ❌ Не боретесь с особенностями библиотек → обходите их

---

## 🔍 Общий Алгоритм Дебага в Jupyter

### Шаг 1: Понять Проблему
1. **Посмотрите на ошибку внимательно**
   - TypeError → неправильные типы аргументов
   - AttributeError → нет атрибута или конфликт имен
   - NameError → переменная не определена
   - Timeout → слишком долгая операция

2. **Определите контекст**
   - Какие библиотеки используются? (stable-baselines3, gymnasium, sklearn)
   - Какой тип операции? (обучение, оценка, визуализация)
   - В каком окружении? (Jupyter notebook, Python скрипт)

### Шаг 2: Изолируйте Проблему
**Используйте бинарный поиск:**

```
Проблема при обучении?
→ Попробуйте БЕЗ callback'ов
→ Если работает → проблема в callback
→ Если не работает → проблема в модели/среде

Проблема с progress bar?
→ Уберите progress_bar=True
→ Если работает → проблема в tqdm/progress bar
→ Если не работает → проблема в обучении

Дублирующийся вывод?
→ Уберите print() из функции
→ Если работает → проблема в print()
→ Если не работает → проблема в другом месте
```

### Шаг 3: Минимальное Изменение
**Правило:** меняйте только то, что нужно

❌ **Плохо:** Переписать весь класс callback
✅ **Хорошо:** Переименовать одну переменную

❌ **Плохо:** Создать свой progress bar
✅ **Хорошо:** Использовать print() вместо progress bar

❌ **Плохо:** Написать кастомную функцию оценки
✅ **Хорошо:** Убрать print() из существующей функции

### Шаг 4: Проверьте Немедленно
**После каждого изменения:**
1. Перезапустите ячейку (или весь блок зависимых ячеек)
2. Проверьте результат
3. Если не помогло → откатитесь, попробуйте следующую гипотезу

### Шаг 5: Упростите Если Сложно
**Если сложное решение не работает:**
- Уберите функционал полностью
- Используйте встроенные средства библиотеки
- Не боритесь с особенностями библиотеки → обходите их

---

## 🚨 Распространенные Проблемы в Jupyter

### Проблема 1: Progress Bar Зависает на 0%

**Симптомы:**
```
0% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 0/100,000 [ 0:00:00 < -:--:-- , ? it/s ]
```

**Причина:** `tqdm` в Jupyter иногда конфликтует с библиотечными progress bar'ами

**Решение:**
```python
# ❌ Не работает
model.learn(total_timesteps=100000, progress_bar=True)

# ✅ Работает
model.learn(total_timesteps=100000)  # Без progress_bar=True

# ✅ Или простые сообщения
print("Обучение на 100000 шагов...")
model.learn(total_timesteps=100000)
print("Обучение завершено!")
```

---

### Проблема 2: Дублирующийся Вывод

**Симптомы:**
```
Результат оценки (20 эпизодов):
Результат оценки (20 эпизодов):
Результат оценки (20 эпизодов):
... (повторяется 20+ раз)
```

**Причина:** Функция имеет `print()` внутри, и вызывается в цикле или с verbose

**Решение:**
```python
# ❌ Плохо
def evaluate_agent(model, env_name, n_episodes=20):
    print(f"Оценка на {n_episodes} эпизодов...")  # ← print внутри
    mean, std = evaluate_policy(model, env, n_eval_episodes=n_episodes)
    print(f"Результат: {mean:.2f}")
    return mean, std

# ✅ Хорошо
def evaluate_agent(model, env_name, n_episodes=20):
    mean, std = evaluate_policy(model, env, n_eval_episodes=n_episodes)
    return mean, std  # ← Только return, без print

# А print вызывается снаружи
mean, std = evaluate_agent(model, env_name, n_episodes=20)
print(f"Результат: {mean:.2f} ± {std:.2f}")
```

**Дополнительные параметры для evaluate_policy:**
```python
mean, std = evaluate_policy(
    model,
    eval_env,
    n_eval_episodes=20,
    deterministic=True,
    warn=False,                      # Отключить предупреждения
    return_episode_rewards=False     # Не возвращать детали эпизодов
)
```

---

### Проблема 3: Обучение Останавливается После 1 Шага

**Симптомы:**
```
Обучение: 1/300000 шагов
[...ничего не происходит...]
```

**Причины:**
1. Callback возвращает `True` (сигнал остановки)
2. Callback выбрасывает исключение
3. Лямбда-функция в DummyVecEnv захватывает переменную неправильно

**Решение:**

**Проверка 1: Callback**
```python
# ❌ Плохо - возвращает True
class BadCallback(BaseCallback):
    def _on_step(self):
        if self.num_timesteps > 0:
            return True  # ← Останавливает обучение!
        return False

# ✅ Хорошо - всегда возвращает False
class GoodCallback(BaseCallback):
    def _on_step(self):
        # Ничего не возвращаем = False = обучение продолжается
        pass

# ✅ Или явно возвращаем False
class ExplicitCallback(BaseCallback):
    def _on_step(self):
        return False  # ← Явно продолжаем обучение
```

**Проверка 2: DummyVecEnv с лямбда-функцией**
```python
# ❌ Плохо - лямбда может захватить переменную неправильно
env = gym.make("LunarLander-v3")
env.reset(seed=SEED)
env = DummyVecEnv([lambda: env])  # ← Проблема!

# ✅ Хорошо - отдельная функция
def make_env():
    env = gym.make("LunarLander-v3")
    env.reset(seed=SEED)
    return env

env = DummyVecEnv([make_env])
```

**Быстрая проверка:**
```python
# Попробуйте БЕЗ callback
model.learn(total_timesteps=10000)  # Без callback

# Если работает → проблема в callback
# Если не работает → проблема в модели/среде
```

---

### Проблема 4: AttributeError: can't set attribute

**Симптомы:**
```
AttributeError: can't set attribute 'logger'
```

**Причина:** Конфликт имен с родительским классом

**Решение:**
```python
class MyCallback(BaseCallback):
    def __init__(self, ...):
        super().__init__(...)
        # ❌ Плохо - конфликт с BaseCallback.logger
        self.logger = logging.getLogger(__name__)

        # ✅ Хорошо - другое имя
        self.file_logger = logging.getLogger(f"{__name__}_{id(self)}")
```

---

### Проблема 5: Таймаут При Долгих Операциях

**Симптомы:**
```
[TIMEOUT ERROR: IPython execution exceeded 30 seconds]
```

**Причина:** Операция занимает больше времени чем разрешено

**Решение:**
1. **Для тестирования - уменьшите масштаб**
```python
# ❌ Плохо для теста
TOTAL_TIMESTEPS = 300_000  # 10+ минут

# ✅ Хорошо для теста
TOTAL_TIMESTEPS = 10_000  # ~30 секунд
```

2. **Используйте меньший timeout для долгих операций**
```python
jupyter_execute_cell(cell_index=10, timeout=300)  # 5 минут вместо 30 сек
```

3. **Или запускайте код напрямую, а не через ячейку**
```python
# Вместо jupyter_execute_cell
jupyter_execute_code("""
model.learn(total_timesteps=300_000)
print("Готово!")
""")
```

---

## 📋 Проверочный Список (Checklist)

Перед тем как делать сложные изменения, проверьте:

- [ ] **Попробуйте БЕЗ callback'ов** - проблема исчезла?
- [ ] **Уберите progress_bar=True** - проблема исчезла?
- [ ] **Убрали print() из функции** - дублирование исчезло?
- [ ] **Использовали make_env() вместо lambda** - проблема исчезла?
- [ ] **Переименовали конфликтующий атрибут** - ошибка исчезла?
- [ ] **Уменьшили масштаб для теста** - проверили быстрее?

---

## 💡 Быстрые Решения (Quick Fixes)

| Проблема | Быстрое Решение |
|----------|----------------|
| Progress bar на 0% | Убрать `progress_bar=True` |
| Дублирующийся вывод | Убрать `print()` из функции |
| Обучение на 1 шаге | Убрать callback или проверить `_on_step()` |
| Name conflict | Переименовать атрибут |
| Timeout | Уменьшить масштаб для теста |
| TypeError | Проверить типы аргументов |
| ImportError | Установить недостающий пакет |

---

## 🎯 Практические Примеры

### Пример 1: Не Работает Progress Bar

**Было:**
```python
model.learn(total_timesteps=100000, progress_bar=True)
# Показывает только 0% и зависает
```

**Стало:**
```python
print(f"Обучение на 100000 шагов...")
model.learn(total_timesteps=100000)
print("Обучение завершено!")
```

---

### Пример 2: Дублирующийся Вывод При Оценке

**Было:**
```python
def evaluate_agent(model, env_name, n_episodes=20):
    print(f"Оценка на {n_episodes} эпизодов...")
    mean, std = evaluate_policy(model, env, n_eval_episodes=n_episodes)
    print(f"Результат: {mean:.2f}")
    return mean, std

# Вызывается много раз → много print
```

**Стало:**
```python
def evaluate_agent(model, env_name, n_episodes=20):
    mean, std = evaluate_policy(
        model,
        env,
        n_eval_episodes=n_episodes,
        warn=False,
        return_episode_rewards=False
    )
    return mean, std

# Один print снаружи
mean, std = evaluate_agent(model, env_name, n_episodes=20)
print(f"Результат: {mean:.2f} ± {std:.2f}")
```

---

### Пример 3: Обучение Останавливается

**Было:**
```python
class MyCallback(BaseCallback):
    def _on_step(self):
        return True  # ← Случайно возвращаем True!

model.learn(total_timesteps=100000, callback=callback)
# Останавливается после 1 шага
```

**Стало:**
```python
model.learn(total_timesteps=100000)  # Без callback
# Работает! Значит проблема была в callback
```

---

## 🔑 Ключевые Принципы

1. **Минимальные изменения** - меняй только то, что нужно
2. **Быстрая проверка** - тестируй каждое изменение немедленно
3. **Бинарный поиск** - изолируй проблему (с/без callback)
4. **Упрощение** - если сложно не работает, убери и упрости
5. **Слушай пользователя** - принимай обратную связь

---

**Вы готовы к эффективной отладке в Jupyter!** 🚀
