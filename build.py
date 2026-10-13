#!/usr/bin/env python3
"""src/ 조각을 하나의 단일 HTML로 합칩니다.

사용법
  python build.py
      → dist/tuition-simulator.html  (내장 데이터 없음 · 저장소 공개/공유용)
  python build.py --data local-data/embedded.js
      → build-local/tuition-simulator.html  (내장 데이터 포함 · 내부용, .gitignore 대상)

- SheetJS를 HTML 안에 내장하므로 결과 파일은 인터넷 없이 동작합니다.
- 스크립트 순서: data → app → st → export (순서를 바꾸면 동작하지 않음)
"""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
JS_ORDER = ["app.js", "st.js", "export.js"]


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def build(data_file: Path) -> str:
    head = read(SRC / "head.html")
    body = read(SRC / "body.html")
    lib = read(SRC / "vendor" / "xlsx.full.min.js")
    js = read(data_file) + "".join(read(SRC / f) for f in JS_ORDER)
    return (
        '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + head + "\n<script>\n" + lib + "\n</script>\n</head>\n<body>\n"
        + body + "\n<script>\n" + js + "\nrender();\n</script>\n</body>\n</html>\n"
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="등록금·정원 재정 시뮬레이터 빌드")
    ap.add_argument("--data", type=Path, help="내장 데이터 JS 파일(로컬 전용)")
    ap.add_argument("--out", type=Path, help="출력 경로")
    a = ap.parse_args()
    data = a.data or (SRC / "data" / "empty.js")
    out = a.out or (ROOT / ("build-local" if a.data else "dist") / "tuition-simulator.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    html = build(data)
    out.write_text(html, encoding="utf-8", newline="\n")
    print(f"built {out}  ({len(html.encode('utf-8')):,} bytes, data={data.name})")
