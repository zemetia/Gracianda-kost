---
name: managing-kanban
description: Manage Kanban boards, sprint tickets, blocker dependencies, question/answer unblocking, and team collaboration on Zemetia Studio via MCP. Use when the user mentions kanban, board tickets, agile planning, sprint tracking, moving tickets between stages, asking questions on cards, answering questions, or adding ticket comments.
---

# Managing Kanban Boards, Tickets & Collaborative Workflows

This skill guides the agent in orchestrating proactive Agile Kanban workflows on Zemetia Studio (`https://studio.zemetia.com/api/mcp`). 

> [!IMPORTANT]
> **Active Agent Principle**: Do not treat the Kanban board as a passive reading view. Keep cards updated in real time as work unfolds. Post structured comments (`NOTE`), ask blocking questions (`QUESTION`) instead of guessing requirements, answer questions (`replyTo`) to unblock cards, and move tickets systematically across stages so team members and stakeholders have 100% transparent visibility into ongoing work.

---

## Resources & Integration Points

- **MCP Endpoint**: `https://studio.zemetia.com/api/mcp`
- **Detailed Tools Reference**: [references/kanban-tools.md](references/kanban-tools.md)
- **Kanban CLI Helper**: [scripts/kanban_cli.py](scripts/kanban_cli.py)

---

## The Dynamic Kanban Lifecycle & Stage Transitions

Zemetia Studio uses the following formal stages:

```
[ TRIAGE / BACKLOG ]
         │
         ▼
  [ TODO / READY ]
         │
         ▼ (Start Work)
  [ IN_PROGRESS ] ◄──────────┐
         │                   │
         ├─► [ BLOCKED ] ────┘ (Answer QUESTION or Blocker DONE)
         │   (Unanswered QUESTION or Pending Dependency)
         ▼ (Code Complete & Tested)
   [ REVIEW ]
         │
         ▼ (Verified & Approved)
    [ DONE ]
```

### Stage Transition Rules

1. **`TODO` / `READY` $\rightarrow$ `IN_PROGRESS`**:
   - **When**: As soon as you begin actively working on a ticket (researching, planning, or writing code).
   - **Action**: Immediately move the card so everyone knows it is being handled:
     - Tool: `move_kanban_ticket(id="<ticketId>", stage="IN_PROGRESS")`
     - Or CLI: `python scripts/kanban_cli.py move <ticketId> IN_PROGRESS`
   - **Hygiene**: Never leave a ticket sitting in `TODO` while editing project files for it.

2. **`IN_PROGRESS` $\rightarrow$ `BLOCKED`**:
   - **When**: 
     - A prerequisite ticket is not yet finished (`openBlockers`).
     - Or you encounter ambiguous requirements, missing credentials, or critical design choices that require human decision-making.
   - **Action**: 
     - Post a `QUESTION` comment (see Question Protocol below).
     - Move stage to `BLOCKED`:
       - Tool: `move_kanban_ticket(id="<ticketId>", stage="BLOCKED")`
       - Or CLI: `python scripts/kanban_cli.py move <ticketId> BLOCKED`

3. **`BLOCKED` $\rightarrow$ `IN_PROGRESS`**:
   - **When**: The human answers the question (or you reply to the question via `replyTo`), or the blocking ticket reaches `DONE`.
   - **Action**:
     - Check block state: `get_kanban_block_state(ticketId="<ticketId>")` or `python scripts/kanban_cli.py status <ticketId>`.
     - Move back to `IN_PROGRESS` and resume execution.

4. **`IN_PROGRESS` $\rightarrow$ `REVIEW`**:
   - **When**: The implementation is finished, unit tests pass locally, and changes are ready for human or peer review.
   - **Action**:
     - Tool: `move_kanban_ticket(id="<ticketId>", stage="REVIEW")`
     - Or CLI: `python scripts/kanban_cli.py move <ticketId> REVIEW`
     - Leave a review summary comment highlighting what was changed and where to test.

5. **`REVIEW` $\rightarrow$ `DONE`**:
   - **When**: Final verification is complete and confirmed.
   - **Action**:
     - Post a final completion comment: summary of delivered files, acceptance criteria checklist, and verification results.
     - Move ticket to `DONE`:
       - Tool: `move_kanban_ticket(id="<ticketId>", stage="DONE")`
       - Or CLI: `python scripts/kanban_cli.py move <ticketId> DONE`

---

## Collaboration Protocol: Comments, Questions & Replies

Zemetia Studio comments support two distinct types:
1. **`NOTE`**: General progress updates, architectural logs, or completion summaries.
2. **`QUESTION`**: Blocking clarification questions directed to humans.

> [!WARNING]
> In Zemetia Studio, creating a comment with `type: "QUESTION"` automatically puts the ticket into a blocked state (`openQuestionCount > 0`). The card **cannot** legitimately proceed to `DONE` until that question receives a reply (`replyTo`) from a collaborator.

### 1. Asking a Question (`type: "QUESTION"`)
Whenever requirements are incomplete or architectural trade-offs exist:
- **Do not guess or assume silently**.
- Post a structured `QUESTION` on the ticket.
- Tool Call:
  ```json
  {
    "ticketId": "<ticketId>",
    "type": "QUESTION",
    "aiAuthor": "Antigravity",
    "body": "### Klarifikasi Desain\nApakah formula perhitungan margin menggunakan gross margin atau net margin setelah biaya operasional gedung?\n\n- Pilihan A: Gross margin (hanya sewa kamar vs beban kamar)\n- Pilihan B: Net margin komprehensif (semua pos pengeluaran gedung)\n\nRekomendasi kami: **Pilihan B** agar laporan konsisten dengan slide 6."
  }
  ```
- Or CLI:
  ```bash
  python scripts/kanban_cli.py ask <ticketId> "### Klarifikasi Desain..."
  ```

### 2. Answering / Replying to a Question (`replyTo`)
When the user responds or a decision is finalized:
- Replying to the parent comment ID unblocks the card.
- Tool Call:
  ```json
  {
    "ticketId": "<ticketId>",
    "replyTo": "<parentCommentId>",
    "aiAuthor": "Antigravity",
    "body": "Dikonfirmasi: Menggunakan Pilihan B (Net margin komprehensif). Melanjutkan implementasi kalkulasi."
  }
  ```
- Or CLI:
  ```bash
  python scripts/kanban_cli.py reply <ticketId> <parentCommentId> "Dikonfirmasi: Menggunakan Pilihan B..."
  ```

### 3. Monitoring Open Questions
To inspect what questions are holding up work across an entire board:
- Tool Call: `list_kanban_open_questions(boardId="<boardId>")`
- Or CLI: `python scripts/kanban_cli.py questions <boardId>`

### 4. Logging Regular Progress Updates (`type: "NOTE"`)
Post informative logs during implementation:
- Tool Call: `add_kanban_comment(ticketId="<ticketId>", body="Implemented calculation helper and added unit tests in src/services/pnl.ts.", aiAuthor="Antigravity")`
- Or CLI: `python scripts/kanban_cli.py comment <ticketId> "Implemented calculation helper..."`

---

## Standard Comment Templates

### Template 1: Start of Work Log
```markdown
### 🚀 Memulai Pengerjaan
- **Agen**: Antigravity
- **Fokus Utama**: [Nama Modul / Komponen]
- **Target Deliverable**: [File yang akan diubah / dibuat]
```

### Template 2: Question & Blocker
```markdown
### ❓ Butuh Keputusan / Klarifikasi
Kami mendeteksi dua opsi implementasi untuk kebutuhan ini:
1. **Opsi 1**: [Deskripsi singkat + konsekuensi]
2. **Opsi 2**: [Deskripsi singkat + konsekuensi]

👉 **Rekomendasi**: Opsi 1 karena lebih efisien dan selaras dengan skema database saat ini.
Mohon tanggapannya sebelum kami memindahkan tiket kembali ke IN_PROGRESS.
```

### Template 3: Completion & Delivery Summary
```markdown
### ✅ Implementasi Selesai & Terverifikasi
- **Ringkasan Perubahan**:
  - `src/components/Chart.tsx`: Menambahkan visualisasi tren bulanan.
  - `src/lib/api.ts`: Mengintegrasikan endpoint P&L.
- **Kriteria Penerimaan**:
  - [x] Angka terformat Rupiah (`Rp XX.XXX.XXX`)
  - [x] Responsive di layar mobile & desktop
- **Hasil Pengujian**: Test suite passing 100% tanpa regresi.
```

---

## Direct CLI Helper Reference

The repository includes a ready-to-use CLI script in [scripts/kanban_cli.py](scripts/kanban_cli.py):

```bash
# 1. Daftar semua board
python scripts/kanban_cli.py boards

# 2. Daftar tiket pada board (bisa filter stage)
python scripts/kanban_cli.py tickets <board_id>
python scripts/kanban_cli.py tickets <board_id> --stage IN_PROGRESS

# 3. Cek status blokir tiket & open questions
python scripts/kanban_cli.py status <ticket_id>

# 4. Pindahkan stage tiket (TRIAGE, TODO, SCHEDULED, READY, IN_PROGRESS, BLOCKED, REVIEW, DONE)
python scripts/kanban_cli.py move <ticket_id> IN_PROGRESS
python scripts/kanban_cli.py move <ticket_id> BLOCKED
python scripts/kanban_cli.py move <ticket_id> REVIEW
python scripts/kanban_cli.py move <ticket_id> DONE

# 5. Kirim catatan progres (NOTE)
python scripts/kanban_cli.py comment <ticket_id> "Progress update text"

# 6. Ajukan pertanyaan blocking ke manusia (QUESTION)
python scripts/kanban_cli.py ask <ticket_id> "Pertanyaan klarifikasi yang menahan pekerjaan"

# 7. Balas pertanyaan / komentar (Unblocks card jika membalas QUESTION)
python scripts/kanban_cli.py reply <ticket_id> <comment_id> "Jawaban klarifikasi"

# 8. Lihat daftar komentar berulir pada tiket
python scripts/kanban_cli.py comments <ticket_id>

# 9. Lihat daftar semua pertanyaan terbuka yang menahan board
python scripts/kanban_cli.py questions <board_id>

# 10. Lihat relasi graph / DAG board
python scripts/kanban_cli.py graph <board_id>
```

---

## Checklist Sebelum Menutup Tiket

- [ ] Status tiket sudah berada di `IN_PROGRESS` selama pengerjaan.
- [ ] Tidak ada pertanyaan terbuka (`openQuestions`) yang belum dijawab.
- [ ] Tidak ada dependensi terbuka (`openBlockers`) yang belum selesai.
- [ ] Kode sudah diuji dan diverifikasi secara teknis.
- [ ] Ringkasan penyelesaian (`NOTE`) sudah diposting di kolom komentar tiket.
- [ ] Kartu dipindahkan ke `REVIEW` atau `DONE`.