---
name: zemetia-studio
description: Connects to and manages resources on studio.zemetia.com via MCP. Use when working with Zemetia Studio tasks, to-do lists, CRM leads pipeline, customer contacts, projects, invoices, expenses, kanban boards, portfolio entries, or simulation paper trading.
---

# Zemetia Studio Integration Skill

Integrates directly with the `studio.zemetia.com` MCP platform to manage operations across tasks, CRM leads, projects, finances, kanban tickets, and paper trading simulations.

## Configuration Overview

- **Endpoint**: `https://studio.zemetia.com/api/mcp`
- **Transport**: Stateless Streamable HTTP (JSON-RPC 2.0)
- **Authentication**: Bearer Token
- **Global Config Location**: `~/.gemini/config/mcp_config.json`
- **Tools Reference**: [references/tools-reference.md](references/tools-reference.md)
- **Python CLI Helper**: [scripts/zemetia_client.py](scripts/zemetia_client.py)
- **Stdio Proxy Bridge**: [scripts/stdio_proxy.js](scripts/stdio_proxy.js)

---

## When to Use This Skill

Activate this skill whenever the user asks to:
1. **Manage Tasks & Todos**: Check overdue tasks, inspect `task_overview`, create or complete tasks, organize into lists (`Buy List`, `Belajar`, `Jadwal`, etc.).
2. **Handle CRM & Leads**: Check pipeline statistics (`get_lead_pipeline_stats`), track leads due for follow-up, log research findings (`update_lead_research`), record outreach (`add_lead_activity`), or move stages (`Researching` -> `Contacted` -> `Qualified` -> `Won`/`Lost`).
3. **Manage People & Clients**: Look up contacts, associate relations/socials, create or update clients and company profiles.
4. **Oversee Projects & Kanban**: Search projects, add progress logs, list boards, create and assign kanban tickets, update blocker states.
5. **Track Invoices & Expenses**: Create and monitor invoice statuses, log payments, track operational expenses.
6. **Execute Financial Simulation & Paper Trading**: Search tickers (`search_simulation_symbol`), buy/sell positions (`open_simulation_position`, `close_simulation_position`), track P&L (`get_simulation_stats`), register price targets (`add_simulation_prediction`), and record market sentiment cards (`add_simulation_news_card`).

---

## Core Workflows

### 1. Daily Task & Todo Workflow
Always start with an orientation overview before mutating tasks:
1. Call `task_overview` to fetch open count, today's due items, overdue tasks, and lists.
2. Query specific lists with `list_tasks` (filtering by `view: "today"`, `"upcoming"`, `"unscheduled"`, or `"completed"`).
3. Create new tasks using `create_task`:
   ```json
   {
     "title": "Follow up with client",
     "priority": "HIGH",
     "dueDate": "today",
     "list": "Jadwal"
   }
   ```
4. Complete tasks using `complete_task` (`id: "<taskId>"`).

### 2. CRM Leads Pipeline Workflow
1. Check pipeline health: `get_lead_pipeline_stats`.
2. Inspect leads needing attention: `list_leads_due_for_followup`.
3. Filter leads by stage: `list_leads` with `stage: "RESEARCHING" | "CONTACTED" | "QUALIFIED"`.
4. Update research profile: `update_lead_research` (safe to run incrementally for `businessSize`, `painPoints`, `websiteQuality`, etc.).
5. Record communication history: `add_lead_activity` (`type: "OUTREACH_SENT" | "REPLY_RECEIVED" | "NOTE" | "MEETING"`).
6. Progress lead: `move_lead_stage` or `update_lead`.

### 3. Project & Kanban Execution
1. Search active projects: `search_projects` (`query: "..."`).
2. Log project status: `add_project_log` (`projectId: "..."`, `content: "..."`).
3. Fetch kanban board state: `get_kanban_board` or `get_kanban_graph`.
4. Create ticket: `create_kanban_ticket` (`boardId: "..."`, `title: "..."`, `priority: "HIGH"`).
5. Move ticket between columns: `move_kanban_ticket` (`ticketId: "..."`, `targetColumnId: "..."`).

### 4. Paper Trading & Financial Simulation
1. Review portfolio balance & cash: `get_simulation_stats` or `get_simulation_portfolio`.
2. Find ticker symbol: `search_simulation_symbol` (`query: "BBCA"` or `"AAPL"`).
3. Execute paper trade:
   ```json
   {
     "symbol": "BBCA",
     "exchange": "JK",
     "quantity": 100,
     "reason": "Technical breakout confirmation",
     "creatorName": "Antigravity Agent"
   }
   ```
4. Post market analysis card: `add_simulation_news_card` (`title: "..."`, `sources: "Reuters"`, `body: "Analysis conclusion...", sentiment: "POSITIVE"`).

---

## Tool Execution Methods

### A. Direct MCP Tool Calls
When MCP tools are loaded into the agent session, invoke the tool names directly:
- `task_overview`, `list_tasks`, `create_task`
- `list_leads`, `get_lead_pipeline_stats`
- `list_projects`, `search_projects`
- `list_simulation_positions`, `open_simulation_position`

### B. CLI Script Helper
For terminal debugging, background tasks, or direct CLI execution:
```bash
# Test connection
python ~/.gemini/config/skills/zemetia-studio/scripts/zemetia_client.py test

# List all 110 tools
python ~/.gemini/config/skills/zemetia-studio/scripts/zemetia_client.py list-tools

# Call tool with arguments
python ~/.gemini/config/skills/zemetia-studio/scripts/zemetia_client.py call task_overview
python ~/.gemini/config/skills/zemetia-studio/scripts/zemetia_client.py call list_tasks '{"limit": 5}'
```

### C. Stdio Bridge
To bridge stdio-based clients to the Zemetia Studio HTTP endpoint:
```bash
node ~/.gemini/config/skills/zemetia-studio/scripts/stdio_proxy.js
```