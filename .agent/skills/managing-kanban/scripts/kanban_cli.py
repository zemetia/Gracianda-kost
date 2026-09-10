"""
Zemetia Studio Kanban CLI Helper
Specialized CLI utility for inspecting and managing Kanban boards, tickets, questions, and comments.
"""

import sys
import json
import urllib.request
import urllib.error
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DEFAULT_URL = "https://studio.zemetia.com/api/mcp"
DEFAULT_TOKEN = "e5aa20b6330ef419abe6b145e5f5ae344e51b4909462fdd094c6cfe848aac63a"

def rpc_call(name: str, arguments: dict, url: str = DEFAULT_URL, token: str = DEFAULT_TOKEN):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": name,
            "arguments": arguments
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Zemetia-Kanban-CLI/1.1"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            res = json.loads(body)
            if "result" in res:
                content = res["result"].get("content", [])
                for c in content:
                    if c.get("type") == "text":
                        text = c.get("text", "")
                        try:
                            return json.loads(text)
                        except Exception:
                            return text
            return res
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        return {"error": f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {"error": str(e)}

def list_boards(url, token):
    data = rpc_call("list_kanban_boards", {"includeArchived": False}, url, token)
    if isinstance(data, list):
        print(f"Total Kanban Boards: {len(data)}\n")
        for b in data:
            key = b.get("key", "N/A")
            name = b.get("name", "Unnamed")
            bid = b.get("id", "")
            open_cnt = b.get("openTickets", 0)
            done_cnt = b.get("doneTickets", 0)
            proj = b.get("project") or {}
            proj_name = f" (Project: {proj.get('name')})" if proj.get("name") else ""
            print(f"[{key}] {name}{proj_name}")
            print(f"      ID: {bid} | Open: {open_cnt} | Done: {done_cnt}")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))

def list_tickets(board_id, stage, limit, url, token):
    args = {"boardId": board_id}
    if stage:
        args["stage"] = stage
    data = rpc_call("list_kanban_tickets", args, url, token)
    tickets = data if isinstance(data, list) else data.get("tickets", []) if isinstance(data, dict) else []
    if tickets:
        filtered = tickets[:limit] if limit else tickets
        print(f"Tickets on Board {board_id} (count: {len(filtered)}/{len(tickets)}):\n")
        for t in filtered:
            key = t.get("key", f"#{t.get('number')}")
            st = t.get("stage", "TODO")
            prio = t.get("priority", "MEDIUM")
            title = t.get("title", "")
            tid = t.get("id", "")
            blocked = t.get("blocked", False)
            q_cnt = t.get("openQuestionCount", 0)
            b_cnt = t.get("openBlockerCount", 0)
            
            status_flags = []
            if blocked:
                status_flags.append("BLOCKED")
            if q_cnt > 0:
                status_flags.append(f"{q_cnt} QUESTION(S)")
            if b_cnt > 0:
                status_flags.append(f"{b_cnt} BLOCKER(S)")
            flag_str = f" [{', '.join(status_flags)}]" if status_flags else ""
            
            print(f"{key:<10} [{st:<11}] [{prio:<6}]{flag_str} {title}")
            print(f"           ID: {tid}")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))

def get_ticket(ticket_id, url, token):
    data = rpc_call("get_kanban_ticket", {"id": ticket_id}, url, token)
    print(json.dumps(data, indent=2, ensure_ascii=False))

def move_ticket(ticket_id, stage, index, url, token):
    args = {"id": ticket_id, "stage": stage}
    if index is not None:
        args["index"] = index
    data = rpc_call("move_kanban_ticket", args, url, token)
    print(json.dumps(data, indent=2, ensure_ascii=False))

def add_comment(ticket_id, body, c_type, reply_to, author, url, token):
    args = {
        "ticketId": ticket_id,
        "body": body,
        "type": c_type or "NOTE"
    }
    if reply_to:
        args["replyTo"] = reply_to
    if author:
        args["aiAuthor"] = author
    data = rpc_call("add_kanban_comment", args, url, token)
    print(json.dumps(data, indent=2, ensure_ascii=False))

def list_questions(board_id, url, token):
    args = {"boardId": board_id}
    data = rpc_call("list_kanban_open_questions", args, url, token)
    if isinstance(data, list):
        if not data:
            print(f"No open questions on board {board_id}. All cards are unblocked from questions.")
            return
        print(f"Open Questions on Board {board_id} (count: {len(data)}):\n")
        for q in data:
            q_id = q.get("id", "")
            body = q.get("body", "").strip()
            ticket = q.get("ticket") or {}
            t_key = ticket.get("key") or ticket.get("id") or "Unknown"
            t_title = ticket.get("title") or ""
            author = q.get("author") or {}
            author_name = author.get("name") or q.get("aiAuthor") or "Unknown"
            print(f"• Question ID: {q_id}")
            print(f"  Ticket     : [{t_key}] {t_title}")
            print(f"  Asked By   : {author_name}")
            print(f"  Body       : {body}")
            print(f"  To answer  : python scripts/kanban_cli.py reply {ticket.get('id', '')} {q_id} \"<Your Answer>\"\n")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))

def list_comments(ticket_id, url, token):
    data = rpc_call("list_kanban_comments", {"ticketId": ticket_id}, url, token)
    if isinstance(data, list):
        if not data:
            print(f"No comments found for ticket {ticket_id}.")
            return
        print(f"Comments on Ticket {ticket_id} (count: {len(data)}):\n")
        for c in data:
            c_id = c.get("id", "")
            c_type = c.get("type", "NOTE")
            author = c.get("author") or {}
            author_name = author.get("name") or c.get("aiAuthor") or "Unknown"
            created = (c.get("createdAt") or "")[:19].replace("T", " ")
            body = (c.get("body") or "").strip()
            replies = c.get("replies") or []
            tag = f"[{c_type}]"
            print(f"• {tag} {c_id} | By: {author_name} ({created})")
            print(f"  {body}")
            for r in replies:
                r_id = r.get("id", "")
                r_author = r.get("author") or {}
                r_author_name = r_author.get("name") or r.get("aiAuthor") or "Unknown"
                r_created = (r.get("createdAt") or "")[:19].replace("T", " ")
                r_body = (r.get("body") or "").strip()
                print(f"    └── [REPLY] {r_id} | By: {r_author_name} ({r_created})")
                print(f"        {r_body}")
            print()
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))

def get_status(ticket_id, url, token):
    data = rpc_call("get_kanban_block_state", {"ticketId": ticket_id}, url, token)
    print(json.dumps(data, indent=2, ensure_ascii=False))

def get_graph(board_id, url, token):
    data = rpc_call("get_kanban_graph", {"boardId": board_id}, url, token)
    print(json.dumps(data, indent=2, ensure_ascii=False))

def main():
    parser = argparse.ArgumentParser(description="Zemetia Studio Kanban CLI Helper")
    parser.add_argument("--url", default=DEFAULT_URL, help="MCP endpoint")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="Bearer token")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # Boards
    sub.add_parser("boards", help="List all kanban boards")

    # Tickets
    p_tickets = sub.add_parser("tickets", help="List tickets for a board")
    p_tickets.add_argument("board_id", help="Board ID or Board Key")
    p_tickets.add_argument("--stage", help="Filter stage: TRIAGE, TODO, SCHEDULED, READY, IN_PROGRESS, BLOCKED, REVIEW, DONE")
    p_tickets.add_argument("--limit", type=int, default=50, help="Max tickets to display")

    # Single Ticket
    p_get = sub.add_parser("ticket", help="Get ticket details (JSON)")
    p_get.add_argument("ticket_id", help="Ticket ID")

    # Block status
    p_status = sub.add_parser("status", help="Check block state and unanswered questions for a ticket")
    p_status.add_argument("ticket_id", help="Ticket ID")

    # Move ticket
    p_move = sub.add_parser("move", help="Move ticket stage")
    p_move.add_argument("ticket_id", help="Ticket ID")
    p_move.add_argument("stage", choices=["TRIAGE", "TODO", "SCHEDULED", "READY", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"], help="Target stage")
    p_move.add_argument("--index", type=int, default=None, help="Column index position (0-based)")

    # Comment (General NOTE or typed)
    p_comment = sub.add_parser("comment", help="Add progress comment / note to ticket")
    p_comment.add_argument("ticket_id", help="Ticket ID")
    p_comment.add_argument("body", help="Comment body (Markdown)")
    p_comment.add_argument("--type", choices=["NOTE", "QUESTION"], default="NOTE", help="Comment type")
    p_comment.add_argument("--reply-to", dest="reply_to", default=None, help="Parent comment ID if replying")
    p_comment.add_argument("--author", default="Antigravity", help="AI author name")

    # Ask Question (QUESTION type - blocks card)
    p_ask = sub.add_parser("ask", help="Ask a blocking question on a ticket")
    p_ask.add_argument("ticket_id", help="Ticket ID")
    p_ask.add_argument("body", help="Question text (Markdown)")
    p_ask.add_argument("--author", default="Antigravity", help="AI author name")

    # Reply to Question or Comment (unblocks ticket if answering a question)
    p_reply = sub.add_parser("reply", help="Reply to a question/comment on a ticket (unblocks card)")
    p_reply.add_argument("ticket_id", help="Ticket ID")
    p_reply.add_argument("comment_id", help="Comment ID to reply to")
    p_reply.add_argument("body", help="Answer / reply body (Markdown)")
    p_reply.add_argument("--author", default="Antigravity", help="AI author name")

    # List Comments
    p_list_comments = sub.add_parser("comments", help="List all threaded comments on a ticket")
    p_list_comments.add_argument("ticket_id", help="Ticket ID")

    # List Questions
    p_questions = sub.add_parser("questions", help="List open unanswered questions on a board")
    p_questions.add_argument("board_id", help="Board ID")

    # Graph
    p_graph = sub.add_parser("graph", help="Get dependency graph for a board")
    p_graph.add_argument("board_id", help="Board ID")

    args = parser.parse_args()

    if args.cmd == "boards":
        list_boards(args.url, args.token)
    elif args.cmd == "tickets":
        list_tickets(args.board_id, args.stage, args.limit, args.url, args.token)
    elif args.cmd == "ticket":
        get_ticket(args.ticket_id, args.url, args.token)
    elif args.cmd == "status":
        get_status(args.ticket_id, args.url, args.token)
    elif args.cmd == "move":
        move_ticket(args.ticket_id, args.stage, args.index, args.url, args.token)
    elif args.cmd == "comment":
        add_comment(args.ticket_id, args.body, args.type, args.reply_to, args.author, args.url, args.token)
    elif args.cmd == "ask":
        add_comment(args.ticket_id, args.body, "QUESTION", None, args.author, args.url, args.token)
    elif args.cmd == "reply":
        add_comment(args.ticket_id, args.body, "NOTE", args.comment_id, args.author, args.url, args.token)
    elif args.cmd == "comments":
        list_comments(args.ticket_id, args.url, args.token)
    elif args.cmd == "questions":
        list_questions(args.board_id, args.url, args.token)
    elif args.cmd == "graph":
        get_graph(args.board_id, args.url, args.token)

if __name__ == "__main__":
    main()