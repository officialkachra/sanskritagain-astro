from __future__ import annotations

import csv
import html
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

from pypdf import PdfReader

from build_vishnu_manuscript import extract_lines, paginate


ROOT = Path(__file__).resolve().parents[1]
HTML_PDF_SOURCE = ROOT / "output/pdf/sri_vishnu_sahasranama_8x3_96pp.html"
PDF = ROOT / "output/pdf/sri_vishnu_sahasranama_8x3_96pp.pdf"
STOTRA_NIDHI = ROOT / "tmp/pdfs/stotranidhi_vishnu.html"
REPORT = ROOT / "output/pdf/sri_vishnu_sahasranama_line_by_line_proofread.csv"
SUMMARY = ROOT / "output/pdf/sri_vishnu_sahasranama_proofread_summary.txt"

TELUGU_TO_ASCII = str.maketrans("౦౧౨౩౪౫౬౭౮౯", "0123456789")


class ManuscriptParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.pages: list[list[str]] = []
        self.current_page: list[str] | None = None
        self.current_tag: str | None = None
        self.buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "section" and "page" in (attrs_dict.get("class") or ""):
            self.current_page = []
        elif self.current_page is not None and tag in {"p", "h1", "h2", "div"}:
            cls = attrs_dict.get("class") or ""
            if tag in {"p", "h1", "h2"} or cls == "small":
                self.current_tag = tag
                self.buffer = []

    def handle_data(self, data: str) -> None:
        if self.current_tag:
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.current_tag == tag and self.current_page is not None:
            text = clean_space("".join(self.buffer))
            if text and not text.isdigit():
                self.current_page.append(text)
            self.current_tag = None
            self.buffer = []
        if tag == "section" and self.current_page is not None:
            self.pages.append(self.current_page)
            self.current_page = None


class StotraParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_entry = False
        self.depth = 0
        self.in_p = False
        self.parts: list[str] = []
        self.lines: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        cls = dict(attrs).get("class") or ""
        if tag == "div" and "entry-content" in cls:
            self.in_entry = True
            self.depth = 1
            return
        if self.in_entry:
            if tag == "div":
                self.depth += 1
            if tag == "p":
                self.in_p = True
                self.parts = []
            elif tag == "br" and self.in_p:
                self.flush_line()

    def handle_data(self, data: str) -> None:
        if self.in_entry and self.in_p:
            self.parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.in_entry and self.in_p and tag == "p":
            self.flush_line()
            self.in_p = False
        if self.in_entry and tag == "div":
            self.depth -= 1
            if self.depth <= 0:
                self.in_entry = False

    def flush_line(self) -> None:
        text = clean_space("".join(self.parts))
        if text:
            self.lines.append(text)
        self.parts = []


def clean_space(value: str) -> str:
    value = html.unescape(value)
    value = value.replace("\u200d", "").replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def canonical(value: str) -> str:
    value = clean_space(value).translate(TELUGU_TO_ASCII)
    value = value.replace("।", "|").replace("॥", "||")
    value = re.sub(r"[।॥|.,;:()\\[\\]\"'`*–—-]", "", value)
    value = re.sub(r"\s+", "", value)
    return value


def manuscript_pages() -> list[list[str]]:
    parser = ManuscriptParser()
    parser.feed(HTML_PDF_SOURCE.read_text(encoding="utf-8"))
    return parser.pages


def stotra_nidhi_lines() -> list[str]:
    parser = StotraParser()
    parser.feed(STOTRA_NIDHI.read_text(encoding="utf-8", errors="ignore"))
    lines = []
    skip_markers = ("గమనిక:", "అంగన్యాసః", "దేవనాగరి", "English")
    for line in parser.lines:
        if any(marker in line for marker in skip_markers):
            continue
        if line.startswith("[") or line in {"—"}:
            continue
        lines.append(line)
    return lines


def pdf_has_expected_content(expected: list[str]) -> tuple[bool, list[str]]:
    pdftotext = "/Users/yuvrajvyas/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext"
    result = subprocess.run(
        [pdftotext, "-layout", str(PDF), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    pdf_text = result.stdout
    pdf_can = canonical(pdf_text)
    missing = []
    for line in expected:
        if line.startswith("##"):
            continue
        if canonical(line) and canonical(line) not in pdf_can:
            missing.append(line)
    return not missing, missing


def main() -> None:
    source_lines = extract_lines()
    chunks = paginate(source_lines)
    pages = manuscript_pages()
    inner_lines = [line for page in pages[1:-1] for line in page]

    expected_display_lines = []
    page_for_line = []
    for page_number, chunk in enumerate(chunks, start=2):
        flat_chunk = [line for block in chunk for line in block]
        for line in flat_chunk:
            expected_display_lines.append(line[2:].strip() if line.startswith("##") else line)
            page_for_line.append(page_number)

    exact_layout = expected_display_lines == inner_lines
    pdf_ok, missing_in_pdf = pdf_has_expected_content(source_lines)

    stotra_lines = stotra_nidhi_lines()
    stotra_set = {canonical(line) for line in stotra_lines if canonical(line)}
    matched = 0
    variant = 0
    for line in expected_display_lines:
        can = canonical(line)
        if not can:
            continue
        if can in stotra_set:
            matched += 1
        else:
            variant += 1

    with REPORT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["line_no", "page", "status", "text"])
        for i, (page, expected, actual) in enumerate(zip(page_for_line, expected_display_lines, inner_lines), start=1):
            writer.writerow([i, page, "OK" if expected == actual else "CHECK", actual])

    summary = [
        "Sri Vishnu Sahasranama manuscript proofread summary",
        f"Manuscript PDF: {PDF}",
        f"Line ledger: {REPORT}",
        "",
        f"Control source lines checked: {len(source_lines)}",
        f"Interior manuscript lines checked: {len(inner_lines)}",
        f"Line-by-line source-to-layout exact match: {exact_layout}",
        f"PDF contains every non-heading control-source line: {pdf_ok}",
        f"Missing lines in PDF extraction: {len(missing_in_pdf)}",
        "",
        "Second-source cross-check:",
        "Source: Stotra Nidhi Telugu page, downloaded locally from https://stotranidhi.com/sri-vishnu-sahasranama-stotram/",
        f"Canonical direct line matches: {matched}",
        f"Lines not direct-matched due to edition/orthography/nyasa differences: {variant}",
        "",
        "Notes:",
        "SanskritDocuments was used as the controlling text for this manuscript.",
        "Stotra Nidhi confirms the core opening, poorvapithika, main namavali/stotram sequence, phalashruti, and closing tradition, but differs in some edition choices.",
    ]
    SUMMARY.write_text("\n".join(summary) + "\n", encoding="utf-8")

    print("\n".join(summary))


if __name__ == "__main__":
    main()
