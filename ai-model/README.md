# AI Model - Self-hosted Content Generation

Fine-tune model tiếng Việt để tạo nội dung marketing mà không cần API bên thứ 3.

## Yêu cầu phần cứng

| Nhiệm vụ | Tối thiểu | Khuyến nghị |
|----------|-----------|-------------|
| Inference (Q4) | RTX 4060 8GB | RTX 4060 Ti 16GB |
| Fine-tuning QLoRA 7-8B | T4 16GB (Colab) | RTX 4090 24GB |

## Cách nhanh nhất: Ollama (chưa cần train)

```bash
# 1. Cài Ollama: https://ollama.com
# 2. Chạy model có sẵn (chưa fine-tune):
ollama run qwen2.5:7b

# Test ngay:
python inference.py rewrite "Sản phẩm này rất tốt, nhiều người mua và họ đều hài lòng."
```

## Pipeline train model

### Bước 1: Chuẩn bị dataset
```bash
cd ai-model
pip install -r requirements.txt
python merge_dataset.py
# → training_data.jsonl (50 samples)
```

### Bước 2: Train (QLoRA, ~15 phút trên RTX 4090)
```bash
python train.py
# → output/lora_adapter/
```

### Bước 3: Export sang GGUF
```bash
python export_gguf.py
# → output/gguf/
```

### Bước 4: Tạo model Ollama
```bash
# Tạo Modelfile
cat > Modelfile << 'EOF'
FROM output/gguf/unsloth.Q4_K_M.gguf
SYSTEM "Bạn là biên tập viên AI chuyên nghiệp, tạo nội dung tiếng Việt."
PARAMETER temperature 0.7
EOF

# Tạo model
ollama create ai-content -f Modelfile

# Chạy
ollama run ai-content
```

### Bước 5: Test
```bash
python inference.py rewrite "Sản phẩm này rất tốt, nhiều người mua và họ đều hài lòng."
python inference.py translate "Marketing content helps businesses grow."
python inference.py tone "Ê mọi người, sản phẩm mới ra mắt nha, mua liền đi!"
```

## Kết nối với Server

Sau khi train xong, sửa `llm-provider` trong server để gọi Ollama thay vì OpenAI:

```typescript
// server/src/ai/llm/ollama.provider.ts
const OLLAMA_URL = 'http://localhost:11434';
```

## Dataset

Dataset gồm 50 samples cho 5 chế độ:
- **rewrite** (10): Viết lại rõ ràng hơn
- **expand** (10): Mở rộng chi tiết
- **summarize** (10): Tóm tắt 2-3 câu
- **translate** (15): Dịch Việt-Anh/Việt
- **tone** (10): Đổi giọng chuyên nghiệp

Thêm samples vào `dataset/*.json` để improve chất lượng.

## Tham khảo

- [Unsloth QLoRA Guide](https://unsloth.com)
- [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B)
- [Ollama](https://ollama.com)
- [Vistral-7B](https://huggingface.co/Viet-Mistral/Vistral-7B-Chat)
