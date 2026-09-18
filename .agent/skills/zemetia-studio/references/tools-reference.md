# Zemetia Studio MCP Tools Reference

Dokumentasi lengkap seluruh tool yang disediakan oleh server MCP `studio.zemetia.com`.
Total tool terdaftar: **110 tools**.

---

## Tasks & Lists (14 tools)

### `task_overview`
Orientation snapshot of the to-do module: per-view open counts, every list with its open-task count, and the overdue + due-today tasks. Call this first when asked anything open-ended about tasks.

*Tidak membutuhkan parameter.*

### `list_task_lists`
List every to-do list (folder) with its open-task count.

*Tidak membutuhkan parameter.*

### `create_task_list`
Create a new to-do list (folder). The slug is derived from the name and de-duplicated.

**Parameters:**
- `name` (`string` *(wajib)*)
- `color` (`string`): Design-token color key used for the list dot in the UI.

### `update_task_list`
Rename a to-do list, change its color, or reorder it. Renaming regenerates the slug.

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `color` (`string`)
- `sortOrder` (`integer`)

### `delete_task_list`
Delete a to-do list. Its tasks are kept and fall back to "no list" unless `deleteTasks` is true.

**Parameters:**
- `id` (`string` *(wajib)*)
- `deleteTasks` (`boolean` *(wajib)*): When true, the list's tasks are deleted along with it.

### `list_tasks`
Query tasks. `view` applies a saved filter (today includes anything already overdue; upcoming is strictly after today; unscheduled means no due date; completed covers DONE and CANCELLED). Filters combine with AND. Defaults to open tasks across every list.

**Parameters:**
- `view` (`string`)
- `list` (`string`): A list id, slug, or name (case-insensitive). Pass "none" to detach the task from every list.
- `project` (`string`): A project id or name (case-insensitive substring, must match exactly one project). Pass "none" for a task with no project.
- `status` (`array`): Overrides the status implied by `view`.
- `priority` (`array`)
- `search` (`string`): Case-insensitive substring match on the task title.
- `dueBefore` (`string`): Accepts an ISO date (2026-08-14), an ISO datetime, or the shorthands "today", "tomorrow", "yesterday", "+3d", "+2w". Pass null to clear it.
- `dueAfter` (`string`): Accepts an ISO date (2026-08-14), an ISO datetime, or the shorthands "today", "tomorrow", "yesterday", "+3d", "+2w". Pass null to clear it.
- `limit` (`integer` *(wajib)*)

### `get_task`
Get a single task by id, including its list and project.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_task`
Create a to-do item. Everything except `title` is optional — a task needs neither a list nor a project. List and project are resolved by name, so no lookup call is needed first.

**Parameters:**
- `title` (`string` *(wajib)*)
- `notes` (`any`): Free-form details. Pass null to clear.
- `status` (`string`)
- `priority` (`string`)
- `dueDate` (`any`): Accepts an ISO date (2026-08-14), an ISO datetime, or the shorthands "today", "tomorrow", "yesterday", "+3d", "+2w". Pass null to clear it.
- `list` (`any`): A list id, slug, or name (case-insensitive). Pass "none" to detach the task from every list.
- `project` (`any`): A project id or name (case-insensitive substring, must match exactly one project). Pass "none" for a task with no project.
- `createMissingList` (`boolean` *(wajib)*): When true, an unrecognized `list` name is created instead of erroring.

### `create_tasks`
Create several tasks in one call, each with its own optional list/project/due date. Use this instead of repeated create_task calls when breaking work down into steps.

**Parameters:**
- `tasks` (`array` *(wajib)*)

### `update_task`
Update a task. Only the fields you pass change; omit a field to leave it as-is, and pass null to clear `dueDate`, `notes`, `list`, or `project`. Setting status to DONE stamps the completion time.

**Parameters:**
- `id` (`string` *(wajib)*)
- `title` (`string`)
- `notes` (`any`): Free-form details. Pass null to clear.
- `status` (`string`)
- `priority` (`string`)
- `dueDate` (`any`): Accepts an ISO date (2026-08-14), an ISO datetime, or the shorthands "today", "tomorrow", "yesterday", "+3d", "+2w". Pass null to clear it.
- `list` (`any`): A list id, slug, or name (case-insensitive). Pass "none" to detach the task from every list.
- `project` (`any`): A project id or name (case-insensitive substring, must match exactly one project). Pass "none" for a task with no project.
- `createMissingList` (`boolean` *(wajib)*): When true, an unrecognized `list` name is created instead of erroring.

### `complete_task`
Mark a task DONE and stamp its completion time.

**Parameters:**
- `id` (`string` *(wajib)*)

### `reopen_task`
Move a completed or cancelled task back to TODO and clear its completion time.

**Parameters:**
- `id` (`string` *(wajib)*)

### `delete_task`
Permanently delete a task. Prefer complete_task for work that was finished.

**Parameters:**
- `id` (`string` *(wajib)*)

### `clear_completed_tasks`
Permanently delete every DONE and CANCELLED task, optionally limited to one list. Returns the deleted count.

**Parameters:**
- `list` (`string`): A list id, slug, or name (case-insensitive). Pass "none" to detach the task from every list.

---

## CRM & Leads Pipeline (16 tools)

### `list_leads`
List leads in the cold-outreach pipeline. Filter by stage, country, category (substring) and/or priority, or free-text `search` across name/category/address. This is the automation surface for research + outreach — pair with get_lead_research/list_lead_contacts/list_lead_activities for the full picture on a lead.

**Parameters:**
- `stage` (`string`)
- `country` (`string`)
- `category` (`string`)
- `priority` (`string`)
- `search` (`string`)

### `get_lead`
Get one lead by id, including its research profile, contacts, and activity timeline.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_lead`
Create a lead: a prospective business to research and reach out to. Location is sourced from Google Maps: pass `mapsUrl` (the maps listing link) plus `address`/`country` transcribed from it, or fill `address`/`country` by hand when there's no map listing (common for online-only businesses) — all three are optional since not every lead has a resolvable location. Optionally pass `email`/`whatsapp` to attach it as the lead's first contact channel right away if you already have one; otherwise use add_lead_contact once you find one. Stage defaults to RESEARCHING.

**Parameters:**
- `name` (`string` *(wajib)*)
- `category` (`string`)
- `mapsUrl` (`string`)
- `address` (`string`)
- `country` (`string`)
- `website` (`string`)
- `email` (`string`)
- `whatsapp` (`string`)
- `source` (`string`)
- `stage` (`string`)
- `priority` (`string`)
- `nextFollowUpAt` (`string`)
- `assigneeType` (`string`)
- `assigneeId` (`any`)
- `aiAssignee` (`any`)

### `update_lead`
Update a lead's core fields: name, category, location, website, source, priority, assignee, next follow-up date, and/or stage. Changing `stage` here re-appends the lead to the end of the new column — use move_lead_stage to place it at a specific position instead.

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `category` (`any`)
- `mapsUrl` (`any`)
- `address` (`any`)
- `country` (`any`)
- `website` (`any`)
- `source` (`any`)
- `stage` (`string`)
- `priority` (`string`)
- `nextFollowUpAt` (`any`)
- `assigneeType` (`string`)
- `assigneeId` (`any`)
- `aiAssignee` (`any`)

### `move_lead_stage`
Move a lead to another pipeline stage (Researching, To Contact, Contacted, Replied, Qualified, Won, Lost). Optionally give a 0-based `index` to place it at a specific position in that column; omitted means append.

**Parameters:**
- `id` (`string` *(wajib)*)
- `stage` (`string` *(wajib)*)
- `index` (`integer`)

### `delete_lead`
Delete a lead along with its research profile, contacts, and activity history. Cannot be undone.

**Parameters:**
- `id` (`string` *(wajib)*)

### `get_lead_research`
Get the structured research profile for a lead (business profile, digital presence, decision maker & pain points, competitor/reference angle). Returns null if nothing has been researched yet.

**Parameters:**
- `leadId` (`string` *(wajib)*)

### `update_lead_research`
Fill in or update a lead's research profile. All fields are optional and independent — pass only what you found this time; fields you omit are left untouched, so this is safe to call repeatedly as research progresses (business profile today, digital presence tomorrow, etc). Fields: businessSize, employeeEstimate, foundedYear, industryDetail (business profile) · websiteQuality, socialFollowers, onlineReputation (digital presence) · decisionMaker, painPoints (who to talk to and what Zemetia can solve) · competitors, referenceAngle (the "why us" pitch angle).

**Parameters:**
- `leadId` (`string` *(wajib)*)
- `businessSize` (`string`)
- `employeeEstimate` (`string`)
- `foundedYear` (`integer`)
- `industryDetail` (`string`)
- `websiteQuality` (`string`)
- `socialFollowers` (`string`)
- `onlineReputation` (`string`)
- `decisionMaker` (`string`)
- `painPoints` (`string`)
- `competitors` (`string`)
- `referenceAngle` (`string`)

### `list_lead_contacts`
List the outreach channels (WhatsApp, Telegram, Email, Instagram, phone, etc.) recorded for a lead.

**Parameters:**
- `leadId` (`string` *(wajib)*)

### `add_lead_contact`
Record an outreach channel/handle for a lead — a phone number, @handle, email address, or profile URL, tagged with which channel it is.

**Parameters:**
- `leadId` (`string` *(wajib)*)
- `channel` (`string` *(wajib)*)
- `value` (`string` *(wajib)*)
- `label` (`string`)
- `isPrimary` (`boolean`)

### `update_lead_contact`
Update a lead contact channel/value/label, or flip which contact is primary.

**Parameters:**
- `id` (`string` *(wajib)*)
- `channel` (`string`)
- `value` (`string`)
- `label` (`any`)
- `isPrimary` (`boolean`)

### `delete_lead_contact`
Remove an outreach channel from a lead.

**Parameters:**
- `id` (`string` *(wajib)*)

### `add_lead_activity`
Log a research note or outreach event on a lead's timeline. `type`: NOTE for research findings, OUTREACH_SENT once a message has gone out on a channel (set `channel`), REPLY_RECEIVED for their response, MEETING for a call/meeting log. `body` is Markdown. Defaults to an AI-authored entry — pass `aiAuthor` to name the agent. Optionally pass `nextFollowUpAt` to push the lead's follow-up date forward in the same call.

**Parameters:**
- `leadId` (`string` *(wajib)*)
- `type` (`string`)
- `channel` (`string`)
- `body` (`string` *(wajib)*)
- `aiAuthor` (`string`)
- `nextFollowUpAt` (`string`)

### `list_lead_activities`
List a lead's research notes and outreach history, newest first.

**Parameters:**
- `leadId` (`string` *(wajib)*)

### `get_lead_pipeline_stats`
Get the CRM pipeline's overall progress: total leads, a count per stage, wonCount/lostCount/activeCount, winRate (won / (won+lost), as a percentage — 0 if nothing is decided yet), and dueForFollowUpCount (leads overdue for a follow-up, excluding Won/Lost). This is the "how far along are we" / "what's our win rate" answer.

*Tidak membutuhkan parameter.*

### `list_leads_due_for_followup`
List leads whose next follow-up date has passed (and are not already Won/Lost) — the "who needs attention today" queue for a daily outreach pass. Optionally pass `before` (ISO date) to check against a different point in time instead of now.

**Parameters:**
- `before` (`string`)

---

## People & Contacts (15 tools)

### `person_overview`
Orientation snapshot of the personal network module: total people tracked and who is due for a follow-up. Call this first when asked anything open-ended about your network or "who might I get an opportunity from".

*Tidak membutuhkan parameter.*

### `get_person`
Get a single person by id: contacts, relations to other people (from this person's point of view), the flexible custom-info dictionary, and opportunity-tracking fields.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_person`
Add a new person to your personal network. Only `name` is required. Optionally seed one contact channel (`contactChannel`/`contactValue`) in the same call, or use add_person_contact afterwards for more.

**Parameters:**
- `name` (`string` *(wajib)*)
- `contactChannel` (`string`)
- `contactValue` (`string`)
- `nickname` (`any`)
- `photoUrl` (`any`)
- `story` (`any`): Markdown. Freeform: how you met, background, context.
- `relationContext` (`any`): Short label for quick scanning, e.g. "teman kuliah", "klien lama", "kenalan Instagram".
- `firstMetLocation` (`any`)
- `firstMetAt` (`any`): ISO date/datetime, or null to clear.
- `notes` (`any`): Markdown. General-purpose notes — anything ongoing, distinct from `story` (how you met) or `opportunityNotes` (opportunity-specific).
- `opportunityPriority` (`string`)
- `opportunityNotes` (`any`): Markdown.
- `nextFollowUpAt` (`any`): ISO date/datetime, or null to clear.

### `update_person`
Update a person's core fields. Only the fields you pass change; pass `null` to clear a nullable field (nickname, photoUrl, story, relationContext, firstMetLocation, firstMetAt, opportunityNotes, nextFollowUpAt).

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `nickname` (`any`)
- `photoUrl` (`any`)
- `story` (`any`): Markdown. Freeform: how you met, background, context.
- `relationContext` (`any`): Short label for quick scanning, e.g. "teman kuliah", "klien lama", "kenalan Instagram".
- `firstMetLocation` (`any`)
- `firstMetAt` (`any`): ISO date/datetime, or null to clear.
- `notes` (`any`): Markdown. General-purpose notes — anything ongoing, distinct from `story` (how you met) or `opportunityNotes` (opportunity-specific).
- `opportunityPriority` (`string`)
- `opportunityNotes` (`any`): Markdown.
- `nextFollowUpAt` (`any`): ISO date/datetime, or null to clear.

### `delete_person`
Permanently delete a person along with their contacts and relations. Cannot be undone.

**Parameters:**
- `id` (`string` *(wajib)*)

### `list_person_contacts`
List the contact channels (phone, WhatsApp, Instagram, LinkedIn, etc.) recorded for a person.

**Parameters:**
- `personId` (`string` *(wajib)*)

### `add_person_contact`
Record a contact channel/handle for a person — a phone number, @handle, email, or profile URL.

**Parameters:**
- `personId` (`string` *(wajib)*)
- `channel` (`string` *(wajib)*)
- `value` (`string` *(wajib)*)
- `label` (`string`)
- `isPrimary` (`boolean`)

### `update_person_contact`
Update a person contact channel/value/label, or flip which contact is primary.

**Parameters:**
- `id` (`string` *(wajib)*)
- `channel` (`string`)
- `value` (`string`)
- `label` (`any`)
- `isPrimary` (`boolean`)

### `delete_person_contact`
Remove a contact channel from a person.

**Parameters:**
- `id` (`string` *(wajib)*)

### `get_person_relations`
List every relation involving one person, from that person's point of view: what the other person is to them, what they are to the other person, and whether each direction is active.

**Parameters:**
- `personId` (`string` *(wajib)*)

### `set_person_relation`
Create or update the relationship between two people, personA and personB (either order — there is always exactly one row per pair, so calling this again with the pair reversed updates the same relation instead of creating a duplicate). `aToBActive`/`labelOfBFromA` describe what personB is to personA (e.g. personA is the parent, personB the child -> labelOfBFromA: "anak"); `bToAActive`/`labelOfAFromB` describe the reverse (labelOfAFromB: "ayah"). For a symmetric relation like "sekedar kenal" (acquaintance), set both labels the same and both active flags true. Only the fields you pass are written.

**Parameters:**
- `personAId` (`string` *(wajib)*)
- `personBId` (`string` *(wajib)*)
- `aToBActive` (`boolean`)
- `bToAActive` (`boolean`)
- `labelOfBFromA` (`any`): What personB is to personA.
- `labelOfAFromB` (`any`): What personA is to personB.

### `delete_person_relation`
Remove the relationship between two people (either order).

**Parameters:**
- `personAId` (`string` *(wajib)*)
- `personBId` (`string` *(wajib)*)

### `get_person_info`
Read the flexible custom-info dictionary for a person (Firestore-style nested document, no fixed schema). Omit `path` to get the whole dictionary, or pass a dot path (e.g. "kuliah.s1") to read one nested value.

**Parameters:**
- `personId` (`string` *(wajib)*)
- `path` (`string`)

### `set_person_info`
Set one value in a person's custom-info dictionary at a dot path (e.g. "kuliah.s1" -> "ITS", or "kucing" -> "Sinta"), creating intermediate nested objects as needed. Sibling keys are left untouched. `value` can be a string, number, boolean, or any JSON value.

**Parameters:**
- `personId` (`string` *(wajib)*)
- `path` (`string` *(wajib)*)
- `value` (`any` *(wajib)*)

### `delete_person_info`
Delete one key from a person's custom-info dictionary at a dot path.

**Parameters:**
- `personId` (`string` *(wajib)*)
- `path` (`string` *(wajib)*)

---

## Clients & Projects (10 tools)

### `list_clients`
List all clients with their project count.

*Tidak membutuhkan parameter.*

### `get_client`
Get a single client by id, including their projects.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_client`
Create a new client.

**Parameters:**
- `name` (`string` *(wajib)*)
- `email` (`string`)
- `phone` (`string`)
- `company` (`string`)
- `logoUrl` (`string`)

### `update_client`
Update fields on an existing client.

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `email` (`string`)
- `phone` (`string`)
- `company` (`string`)
- `logoUrl` (`string`)

### `list_projects`
List projects, optionally filtered by status or clientId.

**Parameters:**
- `status` (`string`)
- `clientId` (`string`)

### `get_project`
Get a single project by id, including client, invoices, logs, and service types.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_project`
Create a new project for a client.

**Parameters:**
- `name` (`string` *(wajib)*)
- `clientId` (`string` *(wajib)*)
- `status` (`string`)
- `startDate` (`any` *(wajib)*)
- `dueDate` (`any`)
- `liveUrl` (`string`)
- `githubUrl` (`string`)

### `update_project`
Update fields on an existing project (status, dates, urls, name).

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `status` (`string`)
- `dueDate` (`any`)
- `liveUrl` (`string`)
- `githubUrl` (`string`)

### `add_project_log`
Append a log entry (note, milestone, status change, maintenance) to a project.

**Parameters:**
- `projectId` (`string` *(wajib)*)
- `type` (`string` *(wajib)*)
- `note` (`string` *(wajib)*)

### `search_projects`
Search projects by name (case-insensitive substring match).

**Parameters:**
- `query` (`string` *(wajib)*)

---

## Finance (Invoices & Expenses) (7 tools)

### `list_invoices`
List invoices, optionally filtered by status or projectId.

**Parameters:**
- `status` (`string`)
- `projectId` (`string`)

### `get_invoice`
Get a single invoice by id, including its logs.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_invoice`
Create a new invoice for a project. Subtotal and total are computed from items.

**Parameters:**
- `projectId` (`string` *(wajib)*)
- `clientName` (`string` *(wajib)*)
- `clientEmail` (`string`)
- `clientPhone` (`string`)
- `items` (`array` *(wajib)*)
- `tax` (`number` *(wajib)*)
- `dueDate` (`any`)
- `notes` (`string`)

### `update_invoice_status`
Update an invoice status and optionally record a paid amount / paid date.

**Parameters:**
- `id` (`string` *(wajib)*)
- `status` (`string` *(wajib)*)
- `paidAmount` (`number`)
- `paidAt` (`any`)

### `add_invoice_log`
Append a log note to an invoice (e.g. reminder sent, payment received).

**Parameters:**
- `invoiceId` (`string` *(wajib)*)
- `note` (`string` *(wajib)*)

### `list_expenses`
List expenses, optionally filtered by category or date range.

**Parameters:**
- `category` (`string`)
- `from` (`any`)
- `to` (`any`)

### `create_expense`
Record a new expense.

**Parameters:**
- `category` (`string` *(wajib)*)
- `amount` (`number` *(wajib)*)
- `description` (`string`)
- `date` (`any`)

---

## Portfolio Showcase (13 tools)

### `list_portfolio_entries`
List portfolio entries, optionally filtered by status or featured flag.

**Parameters:**
- `status` (`string`)
- `featured` (`boolean`)

### `get_portfolio_entry`
Get a single portfolio entry by id.

**Parameters:**
- `id` (`string` *(wajib)*)

### `update_portfolio_entry`
Update a portfolio entry — publish/unpublish, feature, or edit metadata. Only the fields you pass are touched; pass `null` to liveUrl/githubUrl to clear them. Use set_portfolio_tech_stack for the tech stack and add/update/remove_portfolio_block for the article body.

**Parameters:**
- `id` (`string` *(wajib)*)
- `status` (`string`)
- `featured` (`boolean`)
- `industry` (`string`)
- `duration` (`string`)
- `liveUrl` (`any`)
- `githubUrl` (`any`)
- `coverImage` (`string`): Absolute image URL, or an empty string to clear the cover.
- `gallery` (`array`): Replaces the whole gallery. Videos accept YouTube/Vimeo URLs (embedded) or a direct file URL.
- `filterTag` (`string`): Discovery filter the public projects page groups this entry under.
- `servicesProvided` (`array`): Replaces the whole services list.

### `list_tech_stacks`
List every TechStack row (shared across projects and portfolio entries) with its id, name and category.

**Parameters:**
- `category` (`string`)

### `create_tech_stack`
Create a TechStack row so it can be attached to portfolio entries. `iconSlug` is a simpleicons.org slug (e.g. "nextdotjs", "tailwindcss") — the public page renders https://cdn.simpleicons.org/<iconSlug>.

**Parameters:**
- `name` (`string` *(wajib)*)
- `iconSlug` (`string`)
- `category` (`string`)

### `set_portfolio_tech_stack`
Replace a portfolio entry's tech stack with the named technologies. Names must already exist — call list_tech_stacks to see them, or create_tech_stack to add one. Pass an empty array to clear the stack.

**Parameters:**
- `id` (`string` *(wajib)*)
- `techStack` (`array` *(wajib)*)

### `initialize_portfolio_entry`
Create a blank DRAFT portfolio entry for a project (auto-generates the slug from the project name). Fails if the project does not exist or already has a portfolio entry.

**Parameters:**
- `projectId` (`string` *(wajib)*)

### `list_portfolio_blocks`
List the article content blocks (paragraph, heading, image, youtube, ...) of a portfolio entry's body, each tagged with its stable `id` — use that id to target a block with add/update/remove.

**Parameters:**
- `id` (`string` *(wajib)*)

### `add_portfolio_block`
Insert a content block into a portfolio entry's article body — a text paragraph, heading, image, or YouTube embed. Omit `afterBlockId` to append at the end, or pass the `id` of an existing block (from list_portfolio_blocks) to insert right after it.

**Parameters:**
- `id` (`string` *(wajib)*)
- `afterBlockId` (`string`)
- `block` (`any` *(wajib)*)

### `update_portfolio_block`
Replace the content of the block with the given `blockId` (from list_portfolio_blocks) in a portfolio entry's article body. The block's id is preserved.

**Parameters:**
- `id` (`string` *(wajib)*)
- `blockId` (`string` *(wajib)*)
- `block` (`any` *(wajib)*)

### `remove_portfolio_block`
Remove the block with the given `blockId` (from list_portfolio_blocks) from a portfolio entry's article body.

**Parameters:**
- `id` (`string` *(wajib)*)
- `blockId` (`string` *(wajib)*)

### `list_simulation_portfolios`
List every simulation portfolio (id, key, name, base currency, cash balance).

*Tidak membutuhkan parameter.*

### `get_simulation_portfolio`
Get one simulation portfolio by id or key. Omit both to use the default portfolio (auto-created on first use).

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)

---

## Kanban Boards & Tickets (22 tools)

### `list_kanban_boards`
List kanban boards (ticketing boards) with their key, creator, creation date, invited members and open/done ticket counts. Optionally filter by a name/key search or include archived boards. Boards are private to their members; this API key is trusted and sees all of them, but a human only sees the boards they were invited to.

**Parameters:**
- `query` (`string`)
- `includeArchived` (`boolean` *(wajib)*)

### `get_kanban_board`
Get one kanban board by id or key, including a per-stage ticket summary.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)

### `create_kanban_board`
Create a new kanban board. Boards are flat — they stand alone or link to a project; assignment happens on tickets, not boards. You MUST pass `creatorName` — your own agent name — because the board records who created it and you have no user account. Boards are private: pass `memberIds` (user ids) to invite people, otherwise no non-admin human will see the board.

**Parameters:**
- `name` (`string` *(wajib)*)
- `description` (`string`)
- `projectId` (`string`)
- `creatorName` (`string` *(wajib)*): Your agent name, recorded as the board creator
- `memberIds` (`array`)

### `list_users`
List the team accounts (id, name, email, role). Use this to find the user id to invite to a kanban board or to assign a card to.

*Tidak membutuhkan parameter.*

### `list_kanban_board_members`
List the users invited to a board. Only these people (plus app OWNER/ADMIN accounts) can see the board and its cards.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)

### `invite_kanban_board_member`
Invite a user to a board, which is what makes the board visible to them. Use `list_users` to find the user id. Role OWNER also lets them manage the guest list.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)
- `userId` (`string` *(wajib)*)
- `role` (`string` *(wajib)*)

### `remove_kanban_board_member`
Remove a user from a board — they immediately lose sight of it. The last remaining owner cannot be removed.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)
- `userId` (`string` *(wajib)*)

### `update_kanban_board`
Update a kanban board: name, description, linked project or archived flag.

**Parameters:**
- `id` (`string` *(wajib)*)
- `name` (`string`)
- `description` (`any`)
- `projectId` (`any`)
- `archived` (`boolean`)

### `delete_kanban_board`
Delete a kanban board. All of its tickets and their comments are deleted with it — this cannot be undone.

**Parameters:**
- `id` (`string` *(wajib)*)

### `get_kanban_graph`
Get ONE board's ticket graph: every ticket with its parentId, plus the parent→child links between them. This is the card relationship graph shown inside a board.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)

### `list_kanban_tickets`
List the tickets (cards) of ONE kanban board, identified by board id or key. Optionally filter to a single stage. Returns tickets grouped by stage in column order.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)
- `stage` (`string`)

### `get_kanban_ticket`
Get one ticket by id: parent/child tickets, blockers, threaded comments, and a `blockState` explaining whether the card may move forward.

**Parameters:**
- `id` (`string` *(wajib)*)

### `create_kanban_ticket`
Create a ticket (card) on a kanban board. `description` is Markdown. Stage defaults to TRIAGE, priority to MEDIUM. Use parentId to link it under another ticket.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)
- `title` (`string` *(wajib)*)
- `description` (`string`)
- `stage` (`string`)
- `priority` (`string`)
- `dueDate` (`string`)
- `parentId` (`string`)
- `assigneeType` (`string`)
- `assigneeId` (`any`)
- `aiAssignee` (`any`)

### `update_kanban_ticket`
Update a ticket: title, description (Markdown), priority, due date, parent ticket, assignee, and/or stage. Changing `stage` also re-appends the ticket to the end of the new column.

**Parameters:**
- `id` (`string` *(wajib)*)
- `title` (`string`)
- `description` (`any`)
- `stage` (`string`)
- `priority` (`string`)
- `dueDate` (`any`)
- `parentId` (`any`)
- `assigneeType` (`string`)
- `assigneeId` (`any`)
- `aiAssignee` (`any`)

### `move_kanban_ticket`
Move a ticket to another stage (Triage, Todo, Scheduled, Ready, In Progress, Blocked, Review, Done). Optionally give a 0-based `index` to place it at a specific position in that column; omitted means append.

**Parameters:**
- `id` (`string` *(wajib)*)
- `stage` (`string` *(wajib)*)
- `index` (`integer`)

### `delete_kanban_ticket`
Delete a ticket and its comments. Child tickets survive but lose their parent link.

**Parameters:**
- `id` (`string` *(wajib)*)

### `add_kanban_blocker`
Make a card wait on another card: `ticketId` cannot move to In Progress, Review or Done until `blockerId` reaches Done. Circular blocks are rejected.

**Parameters:**
- `ticketId` (`string` *(wajib)*)
- `blockerId` (`string` *(wajib)*)

### `remove_kanban_blocker`
Stop a card from waiting on another card.

**Parameters:**
- `ticketId` (`string` *(wajib)*)
- `blockerId` (`string` *(wajib)*)

### `get_kanban_block_state`
Check whether a card may move forward: returns `blocked`, the blocker cards not yet Done, and the unanswered QUESTION comments holding it up.

**Parameters:**
- `ticketId` (`string` *(wajib)*)

### `list_kanban_open_questions`
Every unanswered QUESTION on a board, with the card it blocks. This is the 'what am I waiting on a human for' queue — poll it before assuming a blocked card can proceed.

**Parameters:**
- `boardId` (`string`)
- `boardKey` (`string`)

### `list_kanban_comments`
List the comments on a ticket, oldest first. Replies are nested under their parent comment; QUESTION comments carry `type: "QUESTION"`.

**Parameters:**
- `ticketId` (`string` *(wajib)*)

### `add_kanban_comment`
Add a comment to a ticket. Defaults to an AI-authored NOTE; pass `aiAuthor` to name the agent. Pass `type: "QUESTION"` to ask something that must be answered before the card can move to In Progress, Review or Done — use this to ask the human for a decision instead of guessing. Pass `replyTo` with a comment id to reply; replying to a QUESTION is what unblocks the card, and a reply from the same author who asked does NOT count as an answer.

**Parameters:**
- `ticketId` (`string` *(wajib)*)
- `body` (`string` *(wajib)*)
- `type` (`string`)
- `replyTo` (`string`)
- `aiAuthor` (`string`)

---

## Simulation & Paper Trading (11 tools)

### `search_simulation_symbol`
Search EODHD for a ticker by name or code (e.g. "apple" or "BBCA"). Returns Code/Exchange/Name/Currency matches — use the Code+Exchange with open_simulation_position.

**Parameters:**
- `query` (`string` *(wajib)*)

### `open_simulation_position`
Buy to open a new paper position. `exchange` is the EODHD exchange code ("US" for US stocks, "JK" for Indonesian/IDX stocks). `reason` is required — explain why this trade is being taken. Price defaults to today's cached close, or a live EODHD lookup if none is cached yet. `entryFeeBase` (optional, default 0) is a flat fee deducted from the wallet on top of the entry cost. Fails if the wallet has insufficient cash. You MUST pass `creatorName` — your own agent name — because the position records who opened it and you have no user account. Note: there is no MCP tool to add cash to the wallet — only an admin can top it up from the UI.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)
- `symbol` (`string` *(wajib)*)
- `exchange` (`string` *(wajib)*)
- `quantity` (`number` *(wajib)*)
- `reason` (`string` *(wajib)*)
- `priceNative` (`number`)
- `entryFeeBase` (`number`)
- `creatorName` (`string` *(wajib)*): Your agent name, recorded as the position creator

### `close_simulation_position`
Sell to close an open paper position by its id. Price defaults to today's cached close, or a live EODHD lookup. Realizes P&L and credits the portfolio's cash balance.

**Parameters:**
- `positionId` (`string` *(wajib)*)
- `priceNative` (`number`)

### `list_simulation_positions`
List positions for a portfolio, optionally filtered to OPEN or CLOSED.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)
- `status` (`string`)

### `get_simulation_stats`
Get portfolio performance: cash balance, wallet value (cash + open positions), open/closed position counts, win rate, loss rate, and total realized P&L.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)

### `refresh_simulation_prices`
Refresh today's EOD price snapshot (from EODHD) for every symbol currently held open in a portfolio, plus every symbol with a still-pending prediction, plus the USDIDR rate. Meant to run about once a day.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)

### `list_simulation_predictions`
List price-target predictions, optionally filtered by symbol/exchange and/or status (PENDING/HIT/MISSED). Predictions are called on a symbol, not tied to any single buy/sell transaction — a symbol may be re-bought and re-sold multiple times while a prediction keeps running independently.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)
- `symbol` (`string`)
- `exchange` (`string`)
- `status` (`string`)

### `add_simulation_prediction`
Call a price target on a symbol — independent of whether you currently hold a position in it. `direction`: UP means "expect the price to close above targetPriceNative" inside the date range; DOWN (resistance) means "expect it to close below". Checked once a day off the EOD close cache (see refresh_simulation_prices) — flips to HIT the first day the condition is true inside [rangeStart, rangeEnd], or MISSED once the range elapses without a hit. There is no edit tool — to revise a call, delete it with delete_simulation_prediction and add the corrected one.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)
- `symbol` (`string` *(wajib)*)
- `exchange` (`string` *(wajib)*)
- `direction` (`string` *(wajib)*)
- `targetPriceNative` (`number` *(wajib)*)
- `rangeStart` (`string` *(wajib)*): ISO date (YYYY-MM-DD) the prediction window starts
- `rangeEnd` (`string` *(wajib)*): ISO date (YYYY-MM-DD) the prediction window ends
- `reason` (`string` *(wajib)*)

### `delete_simulation_prediction`
Delete a prediction outright by its id (from list_simulation_predictions). There is no edit — a prediction is a dated call, not a mutable field, so revising one means deleting it and adding the corrected version.

**Parameters:**
- `predictionId` (`string` *(wajib)*)

### `add_simulation_news_card`
Log a news/analysis card: an event, why it matters, and its likely market impact — not just a headline. Structure every card the same way: `title` is the topic/event being analyzed (e.g. "Iran-America war"); `sources` is a comma-separated list of the outlets this analysis draws from (e.g. "Reuters, Bloomberg, CNBC Indonesia") — cite real, plausible sources for the event, never invent one; `body` (Markdown) is your conclusion — the reasoned takeaway on what this likely does to price, not a summary of the news itself (e.g. "Escalation raises safe-haven demand, likely pushing gold higher; supply-disruption risk from the conflict zone likely pushes oil higher too"). Example: title "Iran-America war", sources "Reuters, Al Jazeera, Bloomberg", body "Likely bullish for gold (safe haven) and oil (supply risk) while tensions escalate." `symbol`/`exchange` tie the card to one instrument; omit both for a portfolio-wide/macro note (e.g. gold or oil themes with no single simulation holding). `tags` additionally surfaces this same card on other symbols' detail pages — a comma-separated list of "SYMBOL.EXCHANGE" pairs (e.g. "AAPL.US, BBCA.JK"), useful when one event affects several holdings at once. Set `sentiment` to the overall directional tilt of your conclusion for that symbol.

**Parameters:**
- `portfolioId` (`string`)
- `portfolioKey` (`string`)
- `symbol` (`string`)
- `exchange` (`string`)
- `date` (`string` *(wajib)*)
- `title` (`string` *(wajib)*)
- `sources` (`string`): Comma-separated list of source outlets, e.g. "Reuters, Bloomberg"
- `body` (`string` *(wajib)*): Markdown conclusion/analysis — the likely market impact, not a news summary
- `url` (`string`)
- `sentiment` (`string`)
- `tags` (`string`): Comma-separated "SYMBOL.EXCHANGE" pairs this card should also surface under, e.g. "AAPL.US, BBCA.JK"

### `list_simulation_news_cards`
List news/analysis cards, optionally filtered by date (YYYY-MM-DD) and/or symbol(+exchange).

**Parameters:**
- `date` (`string`)
- `symbol` (`string`)
- `exchange` (`string`)

---

## Other Tools (2 tools)
### `list_people`
List people in your personal network. `search` matches name/nickname/relationContext/story (case-insensitive substring). Filter by opportunityPriority and/or dueForFollowUp (nextFollowUpAt has passed).

### `list_people_due_for_followup`
List people whose next follow-up date has passed — the "who should I check in with" queue. Optionally pass `before` (ISO date) to check against a different point in time instead of now.
