from __future__ import annotations

import html
import math
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "tmp/pdfs/vsahasranew_Telugu.html"
OUT_DIR = ROOT / "output/pdf"
HTML_OUT = OUT_DIR / "sri_vishnu_sahasranama_8x3_108pp.html"
CONTENT_PAGES = 94


TELUGU_DIGITS = str.maketrans("0123456789", "౦౧౨౩౪౫౬౭౮౯")

APPROVED_TEXT_FIXES = {
    "పవిత్రాణాం పవిత్రం యో మంగలానాం చ మంగలం ।": "పవిత్రాణాం పవిత్రం యో మంగళానాం చ మంగళం ।",
    "యస్మింశ్చ ప్రలయం యాంతి పునరేవ యుగక్షయే ॥ ౧౭ ॥": "యస్మింశ్చ ప్రళయం యాంతి పునరేవ యుగక్షయే ॥ ౧౭ ॥",
    "త్రిసామా హృదయం తస్య శాంత్యర్థే వినియోజ్యతే ॥ ౨౧ ॥": "త్రిసామా హృదయం తస్య శాంత్యర్థే వినియుజ్యతే ॥ ౨౧ ॥",
    "క్షీరోదన్వత్ప్రదేశే శుచిమణివిలసత్సైకతేర్మౌక్తికానాం": "క్షీరోదన్వత్ప్రదేశే శుచిమణివిలసత్సైకతే మౌక్తికానాం",
    "ప్రభూతస్త్రికకుబ్ధామ పవిత్రం మంగలం పరం ॥ ౭ ॥": "ప్రభూతస్త్రికకుబ్ధామ పవిత్రం మంగళం పరం ॥ ౭ ॥",
    "అహః సంవత్సరో వ్యాలః ప్రత్యయః సర్వదర్శనః ॥ ౧౦ ॥": "అహః సంవత్సరో వ్యాళః ప్రత్యయః సర్వదర్శనః ॥ ౧౦ ॥",
    "సోహఽమేకేన శ్లోకేన స్తుత ఏవ న సంశయః ॥ ౨౪ ॥": "సోఽహమేకేన శ్లోకేన స్తుత ఏవ న సంశయః ॥ ౨౪ ॥",
}


def normalize_line(line: str) -> str:
    line = html.unescape(line)
    line = re.sub(r"<[^>]+>", "", line)
    line = line.replace("\xa0", " ")
    line = re.sub(r"\s+", " ", line).strip()
    if not line:
        return ""

    line = line.replace("---", "-")
    line = re.sub(r"\s+\.\s+var.*$", " ।", line)
    line = re.sub(r"\s+\.\s+or\s+.*$", " ।", line)
    line = re.sub(r"\s+var\s+.*$", "", line)
    line = re.sub(r"\s+var\??.*$", "", line)
    line = re.sub(r"(\.\.\s*\d+\s*\.\.?)\s+.+$", r"\1", line)
    line = re.sub(r"\s+\.$", " ।", line)

    def verse_repl(match: re.Match[str]) -> str:
        number = (match.group(1) or "").translate(TELUGU_DIGITS)
        if number:
            return f" ॥ {number} ॥"
        return " ॥"

    line = re.sub(r"\s*\.\.\s*(\d+)?\s*\.\.?\s*$", verse_repl, line)
    line = re.sub(r"\s*\.\.\s*$", " ॥", line)
    line = re.sub(r"^\.\.\s*హరిః ఓం తత్సత్\s*॥?$", "॥ హరిః ఓం తత్సత్ ॥", line)
    line = re.sub(r"\s+\.$", " ।", line)
    line = APPROVED_TEXT_FIXES.get(line, line)
    return line


def extract_lines() -> list[str]:
    text = SRC.read_text(encoding="utf-8")
    match = re.search(r'<PRE[^>]*id="content"[^>]*>(.*?)</PRE>', text, re.S | re.I)
    if not match:
        raise RuntimeError("Could not find SanskritDocuments content PRE")

    body = match.group(1)
    body = re.sub(r"<a\b[^>]*>.*?</a>", "", body, flags=re.S | re.I)
    body = re.sub(r"<h2[^>]*>(.*?)</h2>", r"\n## \1\n", body, flags=re.S | re.I)
    lines = [normalize_line(line) for line in body.splitlines()]

    cleaned: list[str] = []
    added_extra_heading = False
    for line in lines:
        if not line:
            continue
        if line == "NA" or line.startswith("Encoded and proofread by"):
            break
        if line in {"Additional Concluding Shlokas", "Alternate Concluding Shlokas"}:
            if added_extra_heading:
                continue
            added_extra_heading = True
            line = "॥ అధిక శ్లోకాః ॥"
        if line.startswith("%"):
            continue
        cleaned.append(line)

    start = next(i for i, line in enumerate(cleaned) if "శ్రీవిష్ణుసహస్రనామస్తోత్రం" in line)
    trimmed = cleaned[start:]
    end = next(i for i, line in enumerate(trimmed) if line == "ఓం తత్ సత్ ।")
    return trimmed[:end + 1]


def line_units(line: str) -> float:
    if line.startswith("##"):
        return 1.45
    if len(line) <= 34:
        return 1.0
    return 1.0 + math.ceil((len(line) - 34) / 36) * 0.82


def is_standalone(line: str) -> bool:
    list_endings = (
        "ఋషిః ।",
        "ఛందః ।",
        "దేవతా ।",
        "బీజం ।",
        "శక్తిః ।",
        "మంత్రః ।",
        "కీలకం ।",
        "అస్త్రం ।",
        "నేత్రం ।",
        "కవచం ।",
        "యోనిః ।",
        "దిగ్బంధః ॥",
        "ధ్యానం ।",
        "వినియోగః ॥",
        "నమః ।",
        "నమః ॥",
    )
    return (
        line.startswith("##")
        or line.endswith("ఉవాచ -")
        or line.endswith("న్యాసః ।")
        or line.endswith("ధ్యానం ।")
        or line.endswith(list_endings)
        or line in {"స్తోత్రం ।", "హరిః ఓం ।", "ఓం తత్ సత్ ।"}
        or line.startswith("ఇతి ")
        or "ఓం నమ ఇతి" in line
    )


def is_verse_end(line: str) -> bool:
    return "॥" in line or is_standalone(line)


def make_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if is_standalone(line):
            if current:
                blocks.append(current)
                current = []
            blocks.append([line])
            continue
        current.append(line)
        if is_verse_end(line):
            blocks.append(current)
            current = []
    if current:
        blocks.append(current)
    return blocks


def block_units(block: list[str]) -> float:
    return sum(line_units(line) for line in block)


def page_line_count(page: list[list[str]]) -> int:
    return sum(len(block) for block in page)


def paginate(lines: list[str], pages: int = CONTENT_PAGES) -> list[list[list[str]]]:
    blocks = make_blocks(lines)
    chunks: list[list[list[str]]] = []
    current: list[list[str]] = []
    line_count = 0
    initial_max_lines = 5

    for block in blocks:
        next_lines = len(block)
        if current and line_count + next_lines > initial_max_lines:
            chunks.append(current)
            current = []
            line_count = 0
        current.append(block)
        line_count += next_lines

    if current:
        chunks.append(current)

    merge_limit = 6
    while len(chunks) > pages:
        candidates = [
            i for i in range(len(chunks) - 1)
            if page_line_count(chunks[i] + chunks[i + 1]) <= merge_limit
        ]
        if not candidates:
            merge_limit += 1
            continue
        best = min(candidates, key=lambda i: page_line_count(chunks[i] + chunks[i + 1]))
        chunks[best:best + 2] = [chunks[best] + chunks[best + 1]]

    return chunks


def page_html(page_no: int, body: str, cls: str = "page") -> str:
    return f'<section class="{cls}"><div class="body">{body}</div><footer>{page_no}</footer></section>'


def render_html(lines: list[str], chunks: list[list[list[str]]]) -> str:
    pages: list[str] = []
    title = """
      <div class="title-lockup">
        <div class="small">శ్రీమహావిష్ణుప్రీత్యర్థం</div>
        <h1>శ్రీ విష్ణు సహస్రనామ స్తోత్రం</h1>
        <div class="rule"></div>
        <div class="small">మహాభారతాంతర్గతం</div>
      </div>
    """
    pages.append(page_html(1, title, "page title-page"))

    for i, chunk in enumerate(chunks, start=2):
        parts = []
        for block in chunk:
            block_parts = []
            for line in block:
                if line.startswith("##"):
                    block_parts.append(f"<h2>{html.escape(line[2:].strip())}</h2>")
                elif line.endswith("ఉవాచ -") or line.endswith("న్యాసః ।") or line.startswith("ఇతి "):
                    block_parts.append(f"<p class='heading'>{html.escape(line)}</p>")
                else:
                    block_parts.append(f"<p>{html.escape(line)}</p>")
            parts.append(f"<div class='vblock'>{''.join(block_parts)}</div>")
        pages.append(page_html(i, "\n".join(parts)))

    outline = """
      <div class="outline" aria-hidden="true">
        <svg viewBox="0 0 220 220" role="img">
          <path d="M110 20c20 0 33 18 33 40 0 16-8 32-20 41 28 7 48 34 48 67v18H49v-18c0-33 20-60 48-67-12-9-20-25-20-41 0-22 13-40 33-40Z"/>
          <path d="M81 67c12 10 46 10 58 0"/>
          <path d="M72 186c6-26 20-45 38-45s32 19 38 45"/>
          <path d="M55 126c-25-4-37-18-35-36 23 2 38 14 47 35"/>
          <path d="M165 126c25-4 37-18 35-36-23 2-38 14-47 35"/>
          <path d="M110 20v34"/>
          <path d="M99 52h22"/>
          <path d="M91 91c10 7 28 7 38 0"/>
        </svg>
        <div class="small">శ్రీమన్నారాయణాయ నమః</div>
      </div>
    """
    pages.append(page_html(len(chunks) + 2, outline, "page end-page"))

    css = """
      @page { size: 8in 3in; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; background: white; }
      .page {
        width: 8in; height: 3in; page-break-after: always;
        position: relative; padding: 0.24in 0.34in 0.22in;
        font-family: "Kohinoor Telugu", "Telugu MN", "Telugu Sangam MN", serif;
        overflow: hidden;
      }
      .body { height: 2.46in; display: flex; flex-direction: column; justify-content: center; }
      p { margin: 0.012in 0; font-size: 13.2pt; line-height: 1.58; text-align: center; overflow-wrap: normal; word-break: keep-all; }
      .vblock { break-inside: avoid; page-break-inside: avoid; margin: 0.012in 0; }
      h2 { margin: 0 0 0.055in; font-size: 15pt; line-height: 1.35; text-align: center; font-weight: 700; }
      .heading { font-weight: 700; margin-top: 0.035in; }
      footer { position: absolute; right: 0.18in; bottom: 0.08in; font: 7pt Georgia, serif; color: #444; }
      .title-page .body, .end-page .body { height: 2.54in; align-items: center; }
      .title-lockup, .outline { width: 100%; text-align: center; }
      .title-lockup h1 { margin: 0.12in 0 0.08in; font-size: 28pt; line-height: 1.25; font-weight: 700; }
      .small { font-size: 13pt; line-height: 1.45; }
      .rule { width: 2.1in; height: 1px; background: #222; margin: 0.02in auto 0.12in; }
      svg { width: 1.42in; height: 1.42in; margin: 0 auto 0.09in; fill: none; stroke: #111; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    """
    return f"<!doctype html><html lang='te'><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(pages)}</body></html>"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    lines = extract_lines()
    chunks = paginate(lines)
    HTML_OUT.write_text(render_html(lines, chunks), encoding="utf-8")
    print(f"lines={len(lines)} content_pages={len(chunks)} total_pages={len(chunks) + 2}")
    print(HTML_OUT)


if __name__ == "__main__":
    main()
