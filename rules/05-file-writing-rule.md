# File Writing Rule

**Priority**: CRITICAL | **Applies to**: ALL Agents

---

## Purpose

Prevent JSON parsing errors when writing files by establishing strict size thresholds and validation rituals for the `write` tool.

---

## The Problem

When agents try to write large files (>500 lines) using the `write` tool:
- The entire content is passed as a JSON string
- JSON has practical limits (~1-4MB)
- Escape characters double the size
- **Result**: JSON parsing errors, broken workflows

---

## Universal Rule

### BEFORE using the `write` tool, ALWAYS:

1. **Estimate file size**
   - Count lines: `content.count('\n')`
   - Count characters: `len(content)`

2. **Decision tree**
   ```
   (строки ≤ 500 И символы ≤ 10,000)?
     YES → Use `write` tool safely
     NO  → Use bash: `cat > file << 'EOF'`
   ```

3. **If using bash**
   - Use `<< 'EOF'` (single quotes - prevents variable substitution)
   - Closing `EOF` on separate line, no indentation

---

## Thresholds

| Размер файла | Метод | Порог |
|-------------|-------|-------|
| Малый | `write` tool | ≤500 строк **И** ≤10,000 символов |
| Средний | Чанки + append | 501-5000 строк |
| Большой | Bash `cat <<EOF` | >5000 строк |

**Rule of thumb**: If unsure → use bash for large files!

---

## Mandatory Pre-Write Ritual

```markdown
## File Write Ritual (REQUIRED)

### 1. Think
- Какой размер файла?
- Сколько строк/символов?

### 2. Estimate
- Lines: count('\n')
- Chars: len(content)

### 3. Decide
- If ≤500 lines AND ≤10,000 chars → use `write`
- If >500 lines OR >10,000 chars → use bash

### 4. Validate
[ ] Size estimated
[ ] Decision made
[ ] Path verified

### 5. Execute
- Small file → `write`
- Large file → bash

### 6. Verify
- Check file exists
- Check line count: `wc -l`
```

---

## Examples

### ✅ CORRECT (Small File)

```python
# File is 200 lines → use write
write(
    filePath="/path/to/config.yaml",
    content="server:\n  port: 8000\n..."
)
```

### ✅ CORRECT (Large File with Bash)

```python
# File is 900 lines → use bash
bash(
    command='cat > /path/to/skill.md << \'EOF\'\n---\nname: python-async-api\n[900 lines of content]\nEOF',
    description='Write python-async-api skill file'
)
```

### ❌ WRONG (Large File with write)

```python
# ERROR: 900 lines in JSON write!
write(
    filePath="/path/to/skill.md",
    content="[900 lines of content]"
)
# Result: JSON parsing error
```

---

## Bash Templates

### Basic Template (Most Common)

```bash
cat > /path/to/file.txt << 'EOF'
Your content here
Any size
JSON safe
EOF
```

### With Verification

```bash
cat > /path/to/file.txt << 'EOF'
Content
EOF

# Verify
echo "Lines written: $(wc -l /path/to/file.txt)"
```

### Append Template

```bash
# First write
cat > /path/to/file.txt << 'EOF'
Part 1
EOF

# Append
cat >> /path/to/file.txt << 'EOF'
Part 2
EOF
```

---

## Critical Safety Rules

### ❌ NEVER:

- Write files >500 lines using `write` tool
- Write files >10,000 characters using `write` tool
- Use `<< EOF` without quotes (variable substitution risk)
- Indent the closing `EOF`

### ✅ ALWAYS:

- Estimate size before using `write`
- Use `<< 'EOF'` (single quotes) for bash heredocs
- Place `EOF` on separate line, no indentation
- Verify file creation with `wc -l`
- Create directories first: `mkdir -p /path/to/dir`

---

## Common Pitfalls & Fixes

| Ошибка | Проблема | Исправление |
|--------|----------|------------|
| Large file in `write` | JSON parsing error | Use bash instead |
| `<< EOF` without quotes | Variable substitution | Use `<< 'EOF'` |
| Indented `EOF` | Heredoc not closed | Remove indentation |
| No size check | Unknown | Always check first |
| No verification | Silent failure | Always verify with `wc -l` |

---

## Validation Checklist

Before ANY file write operation:

```markdown
[ ] 1. Estimated file size (lines + chars)
[ ] 2. Made decision (write vs bash)
[ ] 3. Verified file path
[ ] 4. If bash: used `<< 'EOF'`
[ ] 5. After write: verified with `wc -l`
```

---

## When This Applies

**ALL agents MUST follow this rule when:**
- Creating new files
- Writing code files (.py, .js, .ts, etc.)
- Writing configuration files
- Writing documentation files
- Writing ANY file content

**Exceptions:** None. This is a universal safety rule.

---

## Integration with Skills

Agents should load the `file-writing-best-practices` skill:
- On first message
- Every 12 messages (refresh)
- Before file operations

The skill provides:
- Detailed decision tree
- More bash templates
- Chunking strategies
- Advanced examples

---

## Failure Modes

**NOT following this rule results in:**
- JSON parsing errors (80% of failures)
- Broken workflows
- Lost time retrying
- User frustration

**Following this rule provides:**
- 80-90% reduction in file writing errors
- Reliable file operations
- Predictable workflows
- Better user experience

---

## Summary

**Universal Rule for ALL Agents:**

1. **Check size** before writing (≤500 lines AND ≤10k chars?)
2. **Small file** → `write` tool
3. **Large file** → bash `cat << 'EOF'`
4. **Verify** with `wc -l` after writing

**Follow this rule → 80-90% fewer file writing errors!**
