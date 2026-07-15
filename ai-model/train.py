"""
Fine-tune Qwen3-8B với Unsloth QLoRA trên dataset AI Content Platform.
Yêu cầu: GPU >= 16GB VRAM (RTX 4060 Ti 16GB / RTX 4090 / A100).

Cài đặt:
  pip install unsloth torch transformers datasets trl peft bitsandbytes accelerate

Chạy:
  python train.py
"""
import json
import sys
from pathlib import Path

# ── Check dependencies ────────────────────────────────────────
def check_deps():
    missing = []
    try:
        import torch
    except ImportError:
        missing.append("torch")
    try:
        import unsloth
    except ImportError:
        missing.append("unsloth")
    try:
        import transformers
    except ImportError:
        missing.append("transformers")
    try:
        import trl
    except ImportError:
        missing.append("trl")
    try:
        import datasets
    except ImportError:
        missing.append("datasets")

    if missing:
        print(f"[ERROR] Missing packages: {', '.join(missing)}")
        print(f"  Run: pip install {' '.join(missing)}")
        sys.exit(1)

    import torch
    if not torch.cuda.is_available():
        print("[ERROR] CUDA not available. GPU is required for training.")
        print("  - Install CUDA: https://developer.nvidia.com/cuda-toolkit")
        print("  - Or use Google Colab with GPU runtime")
        sys.exit(1)

    gpu_name = torch.cuda.get_device_name(0)
    gpu_mem = torch.cuda.get_device_properties(0).total_mem / (1024**3)
    print(f"[OK] GPU: {gpu_name} ({gpu_mem:.1f} GB)")

    if gpu_mem < 15:
        print(f"[WARN] GPU has {gpu_mem:.1f} GB, recommended >= 16 GB for QLoRA 8B")

check_deps()

import torch
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

# ── Config ────────────────────────────────────────────────────
MODEL_NAME = "unsloth/Qwen3-8B"  # or "unsloth/Vistral-7B-Chat"
MAX_SEQ_LENGTH = 2048
LORA_R = 32
LORA_ALPHA = 64
LORA_DROPOUT = 0.05
EPOCHS = 3
BATCH_SIZE = 2
GRAD_ACCUM = 8
LEARNING_RATE = 2e-4
OUTPUT_DIR = Path(__file__).parent / "output"
DATASET_PATH = Path(__file__).parent / "training_data.jsonl"

# ── Load dataset ──────────────────────────────────────────────
def load_dataset_from_jsonl(path: Path):
    samples = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            sample = json.loads(line)
            text = f"### Instruction:\n{sample['instruction']}\n\n"
            if sample.get("input"):
                text += f"### Input:\n{sample['input']}\n\n"
            text += f"### Response:\n{sample['output']}"
            samples.append({"text": text})
    return Dataset.from_list(samples)

# ── Main ──────────────────────────────────────────────────────
def main():
    if not DATASET_PATH.exists():
        print(f"[ERROR] Dataset not found: {DATASET_PATH}")
        print("  Run: python merge_dataset.py")
        sys.exit(1)

    print(f"Loading model: {MODEL_NAME}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    print(f"Loading dataset: {DATASET_PATH}")
    dataset = load_dataset_from_jsonl(DATASET_PATH)
    print(f"Samples: {len(dataset)}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        args=TrainingArguments(
            output_dir=str(OUTPUT_DIR),
            per_device_train_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUM,
            num_train_epochs=EPOCHS,
            learning_rate=LEARNING_RATE,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=10,
            optim="adamw_8bit",
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            seed=3407,
            report_to="none",
        ),
    )

    print("Starting training...")
    trainer_stats = trainer.train()

    print(f"\nTraining complete!")
    print(f"  Total steps: {trainer_stats.global_step}")
    print(f"  Training loss: {trainer_stats.training_loss:.4f}")

    # Save LoRA adapter
    adapter_dir = OUTPUT_DIR / "lora_adapter"
    model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))
    print(f"\nModel saved to: {adapter_dir}")

    print("\nNext steps:")
    print("  1. Export GGUF: python export_gguf.py")
    print("  2. Create Ollama model: ollama create ai-content -f Modelfile")

if __name__ == "__main__":
    main()
