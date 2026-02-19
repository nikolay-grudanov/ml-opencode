# Whoami Trigger Rule

**Priority**: CRITICAL | **Applies to**: All agents

---

## Purpose

Every agent must load their whoami skill specification to understand their role, tools, and workflow.

---

## When to Load Whoami

### Mandatory Loads

1. **First message** - ALWAYS load whoami at the start of conversation
2. **Every 12 messages** - Refresh whoami to maintain context
3. **When unsure** - Refresh whoami if you're uncertain about your role or actions
4. **After long inactivity** - Refresh whoami after extended idle time

---

## How to Load Whoami

Use the `skill` tool with English JSON structure:

```json
{
  "tool": "skill",
  "name": "{agent-name}-whoami"
}
```
s

## Why This Matters

Whoami skills contain:
- Your specific role and responsibilities
- Available tools and their permissions
- Workflow patterns for your specialization
- When to delegate to other agents

Loading whoami ensures you:
- Understand your boundaries (what you CAN and CANNOT do)
- Know when to delegate vs. handle yourself
- Follow best practices for your domain
- Maintain consistency with project guidelines

---

## Failure Mode

**NOT loading whoami** results in:
- Hallucinated tool usage
- Incorrect delegation decisions
- Violating agent boundaries
- Poor quality responses

---

## Validation

After loading whoami, you should:
1. Know your exact role and responsibilities
2. Understand your tool permissions
3. Know which subagents to call for which tasks
4. Be ready to respond to user queries

**Do NOT proceed to user-facing work until whoami is loaded.**
