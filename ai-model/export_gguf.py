"""
Export model da fine-tune sang GGUF de chay voi Ollama.
Yeu cau: model da train xong trong output/lora_adapter

Cai dat:
  pip install unsloth

Chay:
  python export_gguf.py
"""
import sys
from pathlib import Path

LORA_PATH = Path(__file__).parent / "output" / "lora_adapter"
GGUF_PATH = Path(__file__).parent / "output" / "gguf"
QUANT = "q4_k_m"  # q4_k_m: can bang chat luong/kich thuoc

def main():
    if not LORA_PATH.exists():
        print(f"[ERROR] LoRA adapter not found: {LORA_PATH}")
        print("  Run: python train.py")
        sys.exit(1)

    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print("[ERROR] unsloth not installed. Run: pip install unsloth")
        sys.exit(1)

    print(f"Loading LoRA adapter: {LORA_PATH}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=str(LORA_PATH),
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )

    print(f"Exporting GGUF ({QUANT})...")
    GGUF_PATH.mkdir(parents=True, exist_ok=True)

    # Unsloth export to GGUF
    # Note: save_pretrained_gguf is the correct method name
    try:
        model.save_pretrained_gguf(
            str(GGUF_PATH),
            tokenizer,
            quantization_method=QUANT,
        )
    except AttributeError:
        # Fallback: try the method with different signature
        print("[INFO] Trying alternative export method...")
        model.save_pretrained_gguf(
            str(GGUF_PATH),
            quantization_method=QUANT,
        )

    print(f"\nGGUF exported to: {GGUF_PATH}")
    print("\nNext steps:")
    print("  1. Create Modelfile:")
    print(f"     FROM {GGUF_PATH}/unsloth.Q4_K_M.gguf")
    print('     SYSTEM "Ban la bien tap vien AI chuyen nghiep, tao noi dung tieng Viet."')
    print("     PARAMETER temperature 0.7")
    print("  2. Create Ollama model:")
    print("     ollama create ai-content -f Modelfile")
    print("  3. Run:")
    print("     ollama run ai-content")

if __name__ == "__main__":
    main()
