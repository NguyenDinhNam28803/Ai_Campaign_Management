"""
Test inference voi model da fine-tune.
Ho tro 2 che do: Ollama (GGUF) hoac transformers (LoRA adapter).
"""
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] requests not installed. Run: pip install requests")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "ai-content"  # ten model trong Ollama

# ── System prompts ────────────────────────────────────────────
SYSTEM_PROMPTS = {
    "rewrite": "Ban la bien tap vien. Viet lai doan van cho ro rang, mai lac hon. Giu nguyen y nghia va giong van. Chi tra ve doan da viet lai, khong giai thich.",
    "expand": "Ban la bien tap vien. Mo rong doan van voi chi tiet va vi du bo sung. Dung dung giong van thuong hieu. Chi tra ve noi dung mo rong.",
    "summarize": "Ban la bien tap vien. Tom tat doan van thanh 2-3 cau ngan gon, giu y chinh. Chi tra ve tom tat.",
    "translate": "Ban la dich gia chuyen nghiep. Dich doan van sang tieng Anh (neu dang la tieng Viet) hoac tieng Viet (neu dang la tieng Anh). Chi tra ve ban dich.",
    "tone": "Ban la chuyen gia giong van. Viet lai doan van voi giong chuyen nghiep hon, trang trong hon nhung van than thien. Chi tra ve noi dung da doi giong.",
}

# ── Inference via Ollama ─────────────────────────────────────
def infer_ollama(mode: str, text: str) -> str:
    system = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["rewrite"])
    prompt = f"### Instruction:\n{system}\n\n### Input:\n{text}\n\n### Response:\n"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 2048},
    }

    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
        return resp.json()["response"]
    except requests.ConnectionError:
        print(f"[ERROR] Cannot connect to Ollama at {OLLAMA_URL}")
        print("  Make sure Ollama is running: ollama serve")
        sys.exit(1)
    except requests.Timeout:
        print("[ERROR] Request timed out (120s). Model might be loading...")
        sys.exit(1)
    except requests.HTTPError as e:
        print(f"[ERROR] Ollama error: {e}")
        print(f"  Make sure model '{OLLAMA_MODEL}' exists: ollama list")
        sys.exit(1)
    except KeyError:
        print("[ERROR] Invalid response from Ollama")
        sys.exit(1)

# ── CLI ───────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 3:
        print("Usage: python inference.py <mode> <text>")
        print(f"Modes: {', '.join(SYSTEM_PROMPTS.keys())}")
        print(f"\nExample:")
        print(f'  python inference.py rewrite "San pham nay rat tot."')
        sys.exit(1)

    mode = sys.argv[1]
    text = sys.argv[2]

    if mode not in SYSTEM_PROMPTS:
        print(f"Invalid mode: {mode}")
        print(f"Valid modes: {', '.join(SYSTEM_PROMPTS.keys())}")
        sys.exit(1)

    print(f"Mode: {mode}")
    print(f"Input: {text[:100]}{'...' if len(text) > 100 else ''}")
    print(f"\n{'='*50}\n")

    result = infer_ollama(mode, text)
    print(result)

if __name__ == "__main__":
    main()
