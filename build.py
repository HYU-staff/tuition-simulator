#!/usr/bin/env python3
"""src/ 조각을 하나의 단일 HTML(dist/tuition-simulator.html)로 합칩니다.

사용법:  python build.py
- 외부 라이브러리(SheetJS)를 HTML 안에 내장하므로 결과 파일은 인터넷 없이 동작합니다.
- 스크립트 순서가 중요합니다: seg → sp → app → st → export.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "tuition-simulator.html"
JS_ORDER = ["seg.js", "sp.js", "app.js", "st.js", "export.js"]


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def build() -> str:
    head = read(SRC / "head.html")
    body = read(SRC / "body.html")
    lib = read(SRC / "vendor" / "xlsx.full.min.js")
    js = "".join(read(SRC / f) for f in JS_ORDER)
    return (
        '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + head + "\n<script>\n" + lib + "\n</script>\n</head>\n<body>\n"
        + body + "\n<script>\n" + js + "\nrender();\n</script>\n</body>\n</html>\n"
    )


if __name__ == "__main__":
    OUT.parent.mkdir(exist_ok=True)
    html = build()
    OUT.write_text(html, encoding="utf-8", newline="\n")
    print(f"built {OUT.relative_to(ROOT)}  ({len(html.encode('utf-8')):,} bytes)")
