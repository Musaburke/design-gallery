#!/usr/bin/env python3
"""Sum the token usage of Claude Code subagent transcripts and price it at API rates.

Usage:
  python3 tools/agent-usage.py <out.json> <id>=<transcript.jsonl> [<id>=<transcript.jsonl> ...]

Each transcript line with a `message.usage` is one API response. Streamed responses
can repeat on several lines with the same message id, so each id is counted once
(its last line wins). Prices are per million tokens and must match the model in
the transcript; update PRICES when the model or its pricing changes.
"""
import json
import sys
from datetime import datetime

# USD per million tokens. Source: the claude-api skill's model table and prompt
# caching notes (cache writes 1.25x input for 5 minutes, 2x for 1 hour).
PRICES = {
    'claude-opus-5-5': {
        'input': 4.00,
        'cache_write_5m': 5.00,
        'cache_write_1h': 8.00,
        'cache_read': 0.20,
        'output': 20.00,
    },
}


def summarise(path):
    by_id = {}
    stamps = []
    tools = 0
    for line in open(path, encoding='utf-8'):
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get('timestamp'):
            stamps.append(row['timestamp'])
        msg = row.get('message')
        if not isinstance(msg, dict):
            continue
        if row.get('type') == 'assistant' and isinstance(msg.get('content'), list):
            tools += sum(1 for b in msg['content'] if isinstance(b, dict) and b.get('type') == 'tool_use')
        if 'usage' in msg and msg.get('id'):
            by_id[msg['id']] = (msg.get('model'), msg['usage'])

    totals = {'input': 0, 'cache_write_5m': 0, 'cache_write_1h': 0, 'cache_read': 0, 'output': 0}
    models = set()
    for model, u in by_id.values():
        models.add(model)
        cc = u.get('cache_creation') or {}
        w5 = cc.get('ephemeral_5m_input_tokens')
        w1 = cc.get('ephemeral_1h_input_tokens')
        if w5 is None and w1 is None:
            w5, w1 = u.get('cache_creation_input_tokens', 0), 0
        totals['input'] += u.get('input_tokens', 0)
        totals['cache_write_5m'] += w5 or 0
        totals['cache_write_1h'] += w1 or 0
        totals['cache_read'] += u.get('cache_read_input_tokens', 0)
        totals['output'] += u.get('output_tokens', 0)

    if len(models) != 1 or next(iter(models)) not in PRICES:
        raise SystemExit(f'{path}: no price for model(s) {sorted(m or "?" for m in models)}')
    model = next(iter(models))
    price = PRICES[model]
    cost = sum(totals[k] * price[k] / 1_000_000 for k in totals)

    minutes = None
    if len(stamps) >= 2:
        t = sorted(datetime.fromisoformat(s.replace('Z', '+00:00')) for s in stamps)
        minutes = round((t[-1] - t[0]).total_seconds() / 60, 1)

    return {
        'model': model,
        'requests': len(by_id),
        'toolCalls': tools,
        'minutes': minutes,
        'tokens': totals,
        'totalTokens': sum(totals.values()),
        'costUsd': round(cost, 2),
    }


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    out = {}
    for arg in sys.argv[2:]:
        key, _, path = arg.partition('=')
        out[key] = summarise(path)
    with open(sys.argv[1], 'w', encoding='utf-8') as f:
        json.dump({'prices': PRICES, 'runs': out}, f, indent=2)
        f.write('\n')
    for key, r in out.items():
        print(f"{key:16} {r['totalTokens']:>12,} tokens  ${r['costUsd']:>7.2f}  {r['requests']} requests  {r['minutes']} min")


if __name__ == '__main__':
    main()
