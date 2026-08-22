"""
POST /api/lead
Body: {"wa":"9876543210","name":"...","date":"...","place":"...",
       "lagna":"Kanya","nakshatra":"Vishakha","paath":"Sunderkand","lang":"hi"}

Set LEAD_WEBHOOK in Vercel → Settings → Environment Variables to the URL that
should receive the lead (your WhatsApp sender, a Google Sheet webhook, Zapier,
whatever you use). Without it the endpoint accepts the lead and logs it, so the
front end never breaks — but nothing is delivered.
"""
import json
import os
import re
import urllib.request
from http.server import BaseHTTPRequestHandler

WEBHOOK = os.environ.get("LEAD_WEBHOOK", "").strip()


def clean(body):
    wa = re.sub(r"\D", "", str(body.get("wa") or ""))
    if len(wa) != 10:
        raise ValueError("need a 10-digit number")
    keep = ("name", "date", "time", "place", "lagna", "nakshatra",
            "paath", "lang", "question")
    out = {"wa": wa, "source": "astro.sanskritagain.com"}
    for k in keep:
        v = body.get(k)
        if v:
            out[k] = str(v)[:120]
    return out


def forward(lead):
    if not WEBHOOK:
        print("LEAD (no webhook set):", json.dumps(lead, ensure_ascii=False))
        return "logged"
    req = urllib.request.Request(
        WEBHOOK,
        data=json.dumps(lead, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return f"sent:{r.status}"
    except Exception as e:                      # never fail the visitor's flow
        print("LEAD forward failed:", e, json.dumps(lead, ensure_ascii=False))
        return "queued"


class handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n) or "{}")
            lead = clean(body)
            self._send(200, {"ok": True, "status": forward(lead)})
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception:
            self._send(500, {"error": "could not save"})

    def do_GET(self):
        self._send(200, {"ok": True, "webhook": bool(WEBHOOK)})
