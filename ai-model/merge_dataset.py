"""
Merge tất cả dataset (rewrite, expand, summarize, translate, tone) thành file JSON duy nhất
ở định dạng Alpaca chuẩn cho fine-tuning.
"""
import json
import random
from pathlib import Path

DATASET_DIR = Path(__file__).parent / "dataset"
OUTPUT = Path(__file__).parent / "training_data.jsonl"

MODES = ["rewrite", "expand", "summarize", "translate", "tone"]

def main():
    all_samples = []

    for mode in MODES:
        filepath = DATASET_DIR / f"{mode}.json"
        if not filepath.exists():
            print(f"[WARN] Missing: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            samples = json.load(f)

        for s in samples:
            all_samples.append({
                "instruction": s["instruction"],
                "input": s.get("input", ""),
                "output": s["output"],
                "metadata": {"mode": mode}
            })

        print(f"[OK] {mode}: {len(samples)} samples")

    # Shuffle
    random.seed(42)
    random.shuffle(all_samples)

    # Write JSONL
    with open(OUTPUT, "w", encoding="utf-8") as f:
        for sample in all_samples:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    print(f"\n[DONE] Total: {len(all_samples)} samples -> {OUTPUT}")

    # Stats
    print("\n--- Stats ---")
    for mode in MODES:
        count = sum(1 for s in all_samples if s["metadata"]["mode"] == mode)
        print(f"  {mode}: {count}")

if __name__ == "__main__":
    main()
