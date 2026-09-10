"""
Zemetia Studio MCP CLI Client
Helper script for interacting with studio.zemetia.com MCP server.
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

def send_rpc(method: str, params: dict = None, url: str = DEFAULT_URL, token: str = DEFAULT_TOKEN):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params or {}
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Zemetia-MCP-Client/1.0"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        return {"error": {"status_code": e.code, "reason": e.reason, "body": body}}
    except Exception as e:
        return {"error": str(e)}

def test_connection(url: str = DEFAULT_URL, token: str = DEFAULT_TOKEN):
    print(f"Connecting to {url} ...")
    res = send_rpc("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "zemetia-cli", "version": "1.0.0"}
    }, url, token)
    
    if "result" in res:
        info = res["result"].get("serverInfo", {})
        proto = res["result"].get("protocolVersion", "")
        print(f"[SUCCESS] Connected to MCP Server '{info.get('name')}' (v{info.get('version')}, protocol {proto})")
        return True
    else:
        print(f"[ERROR] Failed to initialize: {res}")
        return False

def list_tools(url: str = DEFAULT_URL, token: str = DEFAULT_TOKEN):
    res = send_rpc("tools/list", {}, url, token)
    if "result" in res and "tools" in res["result"]:
        tools = res["result"]["tools"]
        print(f"Total tools available: {len(tools)}\n")
        for idx, t in enumerate(tools, 1):
            desc = t.get("description", "").split("\n")[0]
            print(f"{idx:3d}. {t['name']:<32} - {desc[:80]}")
    else:
        print(f"[ERROR] Could not fetch tools: {res}")

def call_tool(name: str, arguments: dict, url: str = DEFAULT_URL, token: str = DEFAULT_TOKEN):
    res = send_rpc("tools/call", {"name": name, "arguments": arguments}, url, token)
    if "result" in res:
        content = res["result"].get("content", [])
        for c in content:
            if c.get("type") == "text":
                text = c.get("text", "")
                try:
                    parsed = json.loads(text)
                    print(json.dumps(parsed, indent=2, ensure_ascii=False))
                except Exception:
                    print(text)
            else:
                print(c)
    else:
        print(json.dumps(res, indent=2))

def main():
    parser = argparse.ArgumentParser(description="Zemetia Studio MCP CLI Client")
    parser.add_argument("--url", default=DEFAULT_URL, help="MCP endpoint URL")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="Bearer token")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("test", help="Test connection to MCP server")
    subparsers.add_parser("list-tools", help="List all available MCP tools")

    call_p = subparsers.add_parser("call", help="Call a specific MCP tool")
    call_p.add_argument("tool", help="Tool name")
    call_p.add_argument("arguments", nargs="?", default="{}", help="JSON string of arguments")

    args = parser.parse_args()

    if args.command == "test":
        test_connection(args.url, args.token)
    elif args.command == "list-tools":
        list_tools(args.url, args.token)
    elif args.command == "call":
        try:
            parsed_args = json.loads(args.arguments)
        except json.JSONDecodeError as err:
            print(f"Invalid JSON for arguments: {err}")
            sys.exit(1)
        call_tool(args.tool, parsed_args, args.url, args.token)

if __name__ == "__main__":
    main()