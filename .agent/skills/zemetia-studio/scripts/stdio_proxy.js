#!/usr/bin/env node
/**
 * Zemetia Studio MCP Stdio-to-HTTP Proxy
 * Translates stdin/stdout JSON-RPC messages into HTTP POST requests to Zemetia Studio MCP.
 */

const https = require('https');
const readline = require('readline');

const MCP_URL = process.env.ZEMETIA_MCP_URL || 'https://studio.zemetia.com/api/mcp';
const MCP_TOKEN = process.env.ZEMETIA_MCP_TOKEN || 'e5aa20b6330ef419abe6b145e5f5ae344e51b4909462fdd094c6cfe848aac63a';

function forwardRequest(jsonPayload) {
  const url = new URL(MCP_URL);
  const data = JSON.stringify(jsonPayload);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MCP_TOKEN}`,
      'Content-Length': Buffer.byteLength(data),
      'User-Agent': 'Zemetia-MCP-StdioProxy/1.0',
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (body.trim()) {
          process.stdout.write(body.trim() + '\n');
        }
      } else {
        const errorResp = {
          jsonrpc: '2.0',
          id: jsonPayload.id ?? null,
          error: {
            code: -32000,
            message: `HTTP ${res.statusCode}: ${body}`,
          },
        };
        process.stdout.write(JSON.stringify(errorResp) + '\n');
      }
    });
  });

  req.on('error', (err) => {
    const errorResp = {
      jsonrpc: '2.0',
      id: jsonPayload.id ?? null,
      error: {
        code: -32603,
        message: err.message,
      },
    };
    process.stdout.write(JSON.stringify(errorResp) + '\n');
  });

  req.write(data);
  req.end();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    forwardRequest(parsed);
  } catch (err) {
    const errorResp = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    };
    process.stdout.write(JSON.stringify(errorResp) + '\n');
  }
});