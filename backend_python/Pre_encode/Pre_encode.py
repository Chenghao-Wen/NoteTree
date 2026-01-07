#!/usr/bin/env python
# generate_domain_vectors.py
# ---------------------------------------------
#  Encode second-level domain names into vectors and save to disk
#  - Supports TXT (one per line) or JSON (array of strings)
#  - Default output: domain_vectors.json
# ---------------------------------------------
import argparse, json, os, sys, pathlib
from sentence_transformers import SentenceTransformer

def load_domains(file_path: str) -> list[str]:
    ext = pathlib.Path(file_path).suffix.lower()
    if ext in {".txt", ".csv"}:
        with open(file_path, "r", encoding="utf8") as f:
            lines = [ln.strip() for ln in f if ln.strip()]
        if not lines:
            sys.exit("❌  Input file is empty")
        return lines
    elif ext == ".json":
        with open(file_path, "r", encoding="utf8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            sys.exit("❌  JSON should be an array of strings")
        return [str(d).strip() for d in data if str(d).strip()]
    else:
        sys.exit("❌  Only .txt / .json inputs are supported")

def main():
    ap = argparse.ArgumentParser(description="Pre-encode domain vectors")
    ap.add_argument("--in",  "-i", default="domains.txt",
                    dest="in_file", help="Domain list file (.txt/.json)")
    ap.add_argument("--out", "-o", default="domain_vectors.json",
                    dest="out_file", help="Output file name (JSON)")
    args = ap.parse_args()

    domains = load_domains(args.in_file)
    print(f"Loaded {len(domains)} domain names ✔")

    model = SentenceTransformer("all-mpnet-base-v2")
    vectors = model.encode(domains, convert_to_tensor=False)

    payload = {dom: vec.tolist() for dom, vec in zip(domains, vectors)}

    with open(args.out_file, "w", encoding="utf8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"✅  Vectors written to {args.out_file}")

if __name__ == "__main__":
    main()