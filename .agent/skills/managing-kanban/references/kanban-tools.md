# Zemetia Kanban Tools Reference

Dokumentasi komprehensif seluruh 21 tool MCP untuk manajemen Kanban Board, Tiket, Dependensi/Blocker, Komentar/Catatan Progres, dan Pertanyaan/Klarifikasi (Questions) di Zemetia Studio (`https://studio.zemetia.com/api/mcp`).

---

## 1. Boards & Graphs

### `list_kanban_boards`
Mendapatkan seluruh kanban board aktif. Mengembalikan key, nama, deskripsi, relasi project, anggota tim, serta jumlah tiket terbuka (`openTickets`) dan tiket selesai (`doneTickets`).
- **Parameters**:
  - `includeArchived` (`boolean` *(wajib)*, default `false`): Apakah menyertakan board yang diarsipkan.
  - `query` (`string`, opsional): Filter pencarian nama/key board.

### `get_kanban_board`
Mengambil detail satu kanban board berdasarkan ID atau Key, termasuk ringkasan status tiket per kolom stage.
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Kode prefix board (misal: `GRKOD`, `YOPO`).
  *(Wajib mengisi salah satu)*

### `create_kanban_board`
Membuat kanban board baru untuk project atau inisiatif kerja.
- **Parameters**:
  - `name` (`string` *(wajib)*): Nama board.
  - `key` (`string` *(wajib)*): Prefix kode tiket (3–6 huruf kapital, contoh: `GRKOD`, `YOPO`).
  - `description` (`string`): Deskripsi tujuan atau SOP board.
  - `projectId` (`string`): ID project yang terhubung.

### `update_kanban_board`
Memperbarui informasi kanban board.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID board.
  - `name` (`string`): Nama baru.
  - `description` (`string`): Deskripsi baru.
  - `projectId` (`string`): Relasi project.
  - `archived` (`boolean`): Set true untuk mengarsipkan board.

### `delete_kanban_board`
Menghapus board beserta seluruh tiket, komentar, dan dependensinya.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID board.

### `get_kanban_graph`
Mengambil Directed Acyclic Graph (DAG) relasi dependensi seluruh tiket dalam satu board (tiket dan parent/child links).
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.

---

## 2. Tickets Lifecycle & Stages

Tahapan stage resmi pada Zemetia Studio:
- `TRIAGE` : Kotak masuk/peninjauan awal ide tiket.
- `TODO` : Antrean tugas yang sudah siap dijadwalkan.
- `SCHEDULED` : Tugas yang dialokasikan untuk jadwal sprint tertentu.
- `READY` : Tugas yang sudah bebas blocker dan siap diambil kapan saja.
- `IN_PROGRESS` : Tugas yang **sedang aktif dikerjakan saat ini**.
- `BLOCKED` : Tugas yang tertahan dependensi tiket lain atau menunggu jawaban pertanyaan kritis (`QUESTION`).
- `REVIEW` : Pekerjaan teknis selesai, sedang diverifikasi atau menunggu review.
- `DONE` : Pekerjaan selesai 100% dan sudah lolos verifikasi.

### `list_kanban_tickets`
Mengambil daftar tiket pada suatu board dengan filter opsional berdasarkan stage.
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.
  - `stage` (`string`, opsional): Salah satu enum stage di atas.

### `get_kanban_ticket`
Mengambil detail lengkap satu tiket berdasarkan ID, termasuk relasi parent/child, daftar blocker, komentar berulir, dan `blockState`.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID tiket.

### `create_kanban_ticket`
Membuat tiket baru pada kanban board.
- **Parameters**:
  - `title` (`string` *(wajib)*): Judul tiket yang ringkas dan jelas.
  - `boardId` (`string`, opsional): ID board tujuan.
  - `boardKey` (`string`, opsional): Key board tujuan.
  - `description` (`string`): Spesifikasi teknis, kriteria penerimaan, checklist (Markdown).
  - `stage` (`string`, enum di atas, default `TRIAGE`).
  - `priority` (`string`, enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, default `MEDIUM`).
  - `dueDate` (`string`): Tanggal tenggat (ISO format YYYY-MM-DD).
  - `parentId` (`string`): ID tiket induk jika tiket ini adalah sub-task.
  - `assigneeType` (`string`, enum: `UNASSIGNED`, `USER`, `AI`).
  - `assigneeId` (`string`): ID user jika ditugaskan ke manusia.
  - `aiAssignee` (`string`): Nama agen jika ditugaskan ke AI (misal: `"Antigravity"`).

### `update_kanban_ticket`
Memperbarui metadata atau isi tiket yang sudah ada.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID tiket.
  - `title` (`string`): Judul baru.
  - `description` (`string`): Deskripsi baru (Markdown).
  - `stage` (`string`): Status baru (mengubah stage juga menempatkan tiket di ujung kolom).
  - `priority` (`string`): Prioritas baru.
  - `dueDate` (`string`): Tanggal baru.
  - `parentId` (`string`): Parent baru.
  - `assigneeType` (`string`): Assignee type baru.
  - `assigneeId` (`string`): Assignee baru.
  - `aiAssignee` (`string`): AI assignee baru.

### `move_kanban_ticket`
Memindahkan tiket ke tahapan kolom stage lain secara teratur.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID tiket.
  - `stage` (`string` *(wajib)*): Target status (`TRIAGE`, `TODO`, `SCHEDULED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`).
  - `index` (`integer`, opsional): Indeks urutan dalam kolom baru (0 = paling atas). Jika diabaikan, ditempatkan di paling bawah kolom.

### `delete_kanban_ticket`
Menghapus tiket kanban beserta relasi komentarnya.
- **Parameters**:
  - `id` (`string` *(wajib)*): ID tiket.

---

## 3. Blockers & Dependencies

### `add_kanban_blocker`
Menghubungkan kartu pemblokir (`blockerId`) ke kartu yang diblokir (`ticketId`). Tiket yang diblokir otomatis tidak dapat dipindahkan ke `IN_PROGRESS`, `REVIEW`, atau `DONE` sampai tiket pemblokir berstatus `DONE`.
- **Parameters**:
  - `ticketId` (`string` *(wajib)*): ID tiket yang tertahan/terhambat.
  - `blockerId` (`string` *(wajib)*): ID tiket prasyarat yang harus diselesaikan terlebih dahulu.

### `remove_kanban_blocker`
Mencabut relasi pemblokir antara dua tiket.
- **Parameters**:
  - `ticketId` (`string` *(wajib)*): ID tiket yang diblokir.
  - `blockerId` (`string` *(wajib)*): ID tiket pemblokir.

### `get_kanban_block_state`
Memeriksa status dependensi tiket: mengembalikan boolean `blocked`, daftar tiket pemblokir yang belum `DONE` (`openBlockers`), dan daftar komentar bertipe pertanyaan terbuka yang menahan tiket (`openQuestions`).
- **Parameters**:
  - `ticketId` (`string` *(wajib)*): ID tiket.

---

## 4. Discussion, Questions & Collaboration

### `list_kanban_comments`
Mengambil riwayat komentar pada sebuah tiket kanban (diurutkan kronologis). Balasan (`replies`) tersarang rapi di bawah komentar induknya.
- **Parameters**:
  - `ticketId` (`string` *(wajib)*): ID tiket.

### `add_kanban_comment`
Menambahkan komentar progres, catatan teknis, atau mengajukan pertanyaan klarifikasi ke dalam tiket.
- **Parameters**:
  - `ticketId` (`string` *(wajib)*): ID tiket.
  - `body` (`string` *(wajib)*): Pesan catatan progres atau teks pertanyaan (Markdown).
  - `type` (`string`, enum: `"NOTE"` | `"QUESTION"`, default `"NOTE"`):
    - `"NOTE"`: Catatan progres rutin, changelog, atau log verifikasi teknis.
    - `"QUESTION"`: **Pertanyaan klarifikasi yang WAJIB dijawab**. Secara sistem Zemetia Studio, pertanyaan terbuka bertipe `QUESTION` akan menahan kartu (menjadikannya *blocked*) hingga dijawab.
  - `replyTo` (`string`, opsional): ID komentar induk yang ingin dibalas. **Membalas sebuah komentar bertipe `QUESTION` adalah tindakan resmi yang meng-unblock tiket tersebut**.
  - `aiAuthor` (`string`, opsional): Identitas agen (contoh: `"Antigravity"`).

### `list_kanban_open_questions`
Mengambil seluruh pertanyaan terbuka bertipe `QUESTION` yang belum dijawab di satu board beserta kartu tiket yang ditahannya. Ini adalah antrean *"pertanyaan apa yang sedang menunggu keputusan manusia"*.
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.

---

## 5. Team & Members

### `list_users`
Melihat daftar user terdaftar di sistem Zemetia Studio untuk mendapatkan `userId` sebelum melakukan assign atau invite.
- **Parameters**: *Tidak ada*.

### `list_kanban_board_members`
Melihat daftar anggota tim yang memiliki akses ke board tertentu.
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.

### `invite_kanban_board_member`
Mengundang anggota ke dalam board dengan role tertentu (`MEMBER`, `OWNER`).
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.
  - `userId` (`string` *(wajib)*): ID user yang diundang.
  - `role` (`string` *(wajib)*, enum: `"OWNER"`, `"MEMBER"`, default `"MEMBER"`).

### `remove_kanban_board_member`
Menghapus akses user dari suatu board.
- **Parameters**:
  - `boardId` (`string`, opsional): ID board.
  - `boardKey` (`string`, opsional): Key board.
  - `userId` (`string` *(wajib)*): ID user.