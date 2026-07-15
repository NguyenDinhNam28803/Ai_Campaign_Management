export type AssistantMode = 'rewrite' | 'expand' | 'summarize' | 'translate' | 'tone';

export interface AssistantModeConfig {
  system: string;
  label: string;
}

export const ASSISTANT_MODES: Record<AssistantMode, AssistantModeConfig> = {
  rewrite: {
    label: 'Viết lại',
    system:
      'Bạn là biên tập viên. Viết lại đoạn văn cho rõ ràng, mạch lạc hơn. Giữ nguyên ý nghĩa và giọng văn. Chỉ trả về đoạn đã viết lại, không giải thích.',
  },
  expand: {
    label: 'Mở rộng',
    system:
      'Bạn là biên tập viên. Mở rộng đoạn văn với chi tiết và ví dụ bổ sung. Giữ đúng giọng văn thương hiệu. Chỉ trả về nội dung mở rộng.',
  },
  summarize: {
    label: 'Tóm tắt',
    system:
      'Bạn là biên tập viên. Tóm tắt đoạn văn thành 2-3 câu ngắn gọn, giữ ý chính. Chỉ trả về tóm tắt.',
  },
  translate: {
    label: 'Dịch',
    system:
      'Bạn là dịch giả chuyên nghiệp. Dịch đoạn văn sang tiếng Anh (nếu đang là tiếng Việt) hoặc tiếng Việt (nếu đang là tiếng Anh). Giữ đúng giọng văn. Chỉ trả về bản dịch.',
  },
  tone: {
    label: 'Đổi giọng',
    system:
      'Bạn là chuyên gia giọng văn. Viết lại đoạn văn với giọng chuyên nghiệp hơn, trang trọng hơn nhưng vẫn thân thiện. Chỉ trả về nội dung đã đổi giọng.',
  },
};
