---
name: file-writing-best-practices
description: Universal file writing best practices for ALL agents. Defines thresholds, decision tree, validation checklist, and bash templates for handling large files. Prevents JSON parsing errors. Use before ANY file write operation. Load before writing files.
---

# Skill: File Writing Best Practices (Universal)

**Универсальные best practices для записи файлов для ВСЕХ агентов**

---

## Критическая Важность

**Эта проблема затрагивает ВСЕ агентов:**
- Ошибка JSON parsing при записи больших файлов (>500 строк)
- Все агенты используют инструмент `write` через JSON
- Universal решение необходимо для защиты от систематических ошибок

---

## Пороги (Thresholds)

| Размер файла | Метод | Объяснение |
|-------------|-------|------------|
| **≤500 строк** или **≤10,000 символов** | `write` tool | Безопасно, JSON limit не превышен |
| **501-5000 строк** или **10,001-100,000 символов** | Чанки + append | LangChain pattern, безопасно |
| **>5000 строк** или **>100,000 символов** | Bash `cat <<EOF` | Production standard, надежно |

**Правило:** Если сомневаетесь → используйте bash для больших файлов!

---

## Decision Tree (Принятие Решения)

```
START: Хочу записать файл
|
V
Подсчитать строки и символы
|
V
(строки ≤ 500 И символы ≤ 10,000)?
/ \
YES   NO
|      |
V      V
Используй   (строки ≤ 5000)?
write tool  / \
          YES   NO
          |      |
          V      V
    Чанки + append  Bash cat <<EOF
          |
          V
    Verify: wc -l
```

---

## Pre-Write Ritual (Обязательный)

**ПРЕЖДЕ чем использовать инструмент `write`:**

### Шаг 1: Think (Размышление)
- Какой размер файла я создаю?
- Сколько строк/символов?
- Это конфиг, код, документ?

### Шаг 2: Estimate (Оценка)
- **Малый файл:** <500 строк → безопасно использовать `write`
- **Средний файл:** 500-5000 строк → используйте чанки
- **Большой файл:** >5000 строк → используйте bash

### Шаг 3: Validate (Проверка)
```markdown
[ ] Считано количество строк в контенте
[ ] Считана длина: len(content)
[ ] Принято решение: write / bash
[ ] Если bash → проверен шаблон <<'EOF'
```

### Шаг 4: Execute (Выполнение)
- Если малый → `write` tool
- Если средний → чанки + append
- Если большой → bash

### Шаг 5: Verify (Проверка результата)
- `wc -l /path/to/file` - проверить количество строк
- Проверить что файл создан и не пустой

---

## Bash Шаблоны (Для Больших Файлов)

### Шаблон 1: Однократная запись (Самый надежный)

```bash
cat > /path/to/file.txt << 'EOF'
Ваш контент здесь
Может быть любым размером
JSON safe
EOF

echo "File written: $(wc -l /path/to/file.txt)"
```

**ВАЖНО:**
- Используйте `<< 'EOF'` (с одинарными кавычками) - это предотвратит переменную подстановку
- Закрывающий `EOF` должен быть на отдельной строке без отступов

### Шаблон 2: Append (Для добавления)

```bash
# Первая запись
cat > /path/to/file.txt << 'EOF'
Часть 1 контента
EOF

# Добавление
cat >> /path/to/file.txt << 'EOF'
Часть 2 контента
EOF
```

### Шаблон 3: Чанки (Для очень больших файлов)

```bash
# Чанк 1
cat > /path/to/large_file.py << 'EOF_CHUNK1'
# Контент часть 1 (строки 1-500)
EOF_CHUNK1

# Чанк 2
cat >> /path/to/large_file.py << 'EOF_CHUNK2'
# Контент часть 2 (строки 501-1000)
EOF_CHUNK2

# Чанк 3
cat >> /path/to/large_file.py << 'EOF_CHUNK3'
# Контент часть 3 (строки 1001-1500)
EOF_CHUNK3
```

---

## Использование `write` Tool (Только для маленьких файлов)

### Когда безопасно использовать `write`:

✅ **ДА, используйте `write` когда:**
- Файл <500 строк
- Файл <10,000 символов
- Конфигурационные файлы
- Короткие скрипты
- Simple README files

❌ **НЕ используйте `write` когда:**
- Файл >500 строк → используйте bash
- Файл >10,000 символов → используйте bash
- Large documentation → используйте bash
- Data dumps → используйте bash
- Complex configs → используйте bash

---

## Пример: Правильный подход

### ❌ НЕПРАВИЛЬНО (вызовет ошибку):

```python
# ОШИБКА: 900+ строк в JSON write!
write(
    filePath="/path/to/skill.md",
    content="""---\nname: python-async-api\n...\n[900+ строк]..."""
)
```

**Результат:** JSON parsing error!

### ✅ ПРАВИЛЬНО (используем bash):

```python
# ПРАВИЛЬНО: Используем bash для большого файла
bash(
    command='cat > /path/to/skill.md << \'EOF\'\n---\nname: python-async-api\n...\n[900+ строк]...\nEOF',
    description='Write python-async-api skill file'
)
```

**Результат:** ✅ Файл создан успешно!

---

## Validation Checklist (Обязательный)

Перед записью ЛЮБОГО файла:

```markdown
## Before File Write Checklist

### Size Check
[ ] Подсчитано количество строк: `content.count('\n')`
[ ] Подсчитано количество символов: `len(content)`
[ ] Строки ≤ 500? Или символы ≤ 10,000?

### Decision
[ ] Если YES → использовать `write` tool
[ ] Если NO → использовать bash `cat <<EOF`

### Path Safety
[ ] Путь абсолютный и корректный
[ ] Нет traversal: `../`
[ ] Директория существует (или создана с mkdir -p)

### Content Safety
[ ] Нет секретов (API keys, passwords)
[ ] Нет SQL injection / code injection
[ ] Нет harmful commands

### Post-Write Verification
[ ] Файл создан: `ls -l /path/to/file`
[ ] Размер корректный: `wc -l /path/to/file`
[ ] Содержимое не пустое
```

---

## Common Pitfalls (Частые Ошибки)

### ❌ Ошибка 1: Большой файл через `write`

```python
# ОШИБКА!
write(filePath="large.py", content=large_content_900_lines)
```

**Исправление:**
```python
# ПРАВИЛЬНО!
bash(command=f"cat > large.py << 'EOF'\n{large_content_900_lines}\nEOF")
```

---

### ❌ Ошибка 2: EOF без кавычек (переменная подстановка)

```bash
# ОШИБКА! Переменные будут заменены
cat > file.txt << EOF
$HOME
$USER
EOF
```

**Исправление:**
```bash
# ПРАВИЛЬНО! Литеральная строка
cat > file.txt << 'EOF'
$HOME
$USER
EOF
```

---

### ❌ Ошибка 3: EOF с отступами

```bash
# ОШИБКА! EOF должен быть без отступов
    cat > file.txt << 'EOF'
    content
    EOF  # ← ОШИБКА! Отступ
```

**Исправление:**
```bash
# ПРАВИЛЬНО! EOF на отдельной строке без отступов
cat > file.txt << 'EOF'
content
EOF  # ← ПРАВИЛЬНО! Без отступов
```

---

### ❌ Ошибка 4: Не проверили размер

```python
# ОШИБКА! Просто пишем без проверки
write(filePath="skill.md", content=content)
```

**Исправление:**
```python
# ПРАВИЛЬНО! Сначала проверяем размер
lines = content.count('\n')
chars = len(content)

if lines <= 500 and chars <= 10000:
    write(filePath="skill.md", content=content)
else:
    bash(command=f"cat > skill.md << 'EOF'\n{content}\nEOF")
```

---

## Quick Reference (Краткий Справочник)

| Действие | Команда |
|---------|---------|
| Проверить строки файла | `wc -l /path/to/file` |
| Проверить символы в строке | Python: `len(content)` |
| Записать большой файл | `bash -c "cat > file << 'EOF'\ncontent\nEOF"` |
| Записать маленький файл | `write(filePath, content)` |
| Добавить в файл | `bash -c "cat >> file << 'EOF'\ncontent\nEOF"` |
| Создать директорию | `bash -c "mkdir -p /path/to/dir"` |

---

## Когда Загружать Этот Skill

**ALWAYS load before file operations:**
- 1. Каждый раз при старте (first message)
- 2. Каждые 12 сообщений (refresh)
- 3. Перед записью файла
- 4. При сомнениях о методе записи

---

## Заключение

**Для ВСЕХ агентов:**
1. **Always** используйте этот skill перед записью файлов
2. **Always** проверяйте размер перед использованием `write`
3. **Always** используйте bash для файлов >500 строк
4. **Always** верифицируйте результат после записи

**Следование этим правилам предотвращает 80-90% ошибок записи файлов!**
