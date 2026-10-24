import { NextResponse } from 'next/server';
import type { Feedback } from '@/lib/types';

export const runtime = 'nodejs';

const demoFeedback = (essay: string): Feedback => ({
  overallBand: null,
  disclaimer: 'Đây là chế độ xem thử vì chưa cấu hình AI API. Nhận xét dưới đây là ví dụ minh họa, không phải đánh giá thật cho toàn bộ bài viết.',
  criteria: [
    { name: 'Task Response / Task Achievement', band: 5, comment: 'A real review will assess how fully the response addresses the prompt.', vietnamese: 'Khi bật AI, mục này sẽ đánh giá mức độ trả lời đúng trọng tâm đề, phát triển luận điểm và dùng ví dụ.' },
    { name: 'Coherence & Cohesion', band: 5, comment: 'A real review will examine paragraphing and logical progression.', vietnamese: 'Kiểm tra cách chia đoạn, trình tự ý và từ nối; tránh dùng từ nối máy móc hoặc lặp lại.' },
    { name: 'Lexical Resource', band: 5, comment: 'A real review will check range, precision, collocations and repetition.', vietnamese: 'Kiểm tra độ đa dạng, độ chính xác của từ vựng, kết hợp từ và lỗi lặp từ.' },
    { name: 'Grammatical Range & Accuracy', band: 5, comment: 'A real review will examine sentence variety and grammar accuracy.', vietnamese: 'Kiểm tra thì, hòa hợp chủ-vị, mạo từ, giới từ và khả năng dùng câu đơn/câu phức.' }
  ],
  corrections: [{ original: 'Ví dụ: People is happy.', corrected: 'People are happy.', category: 'Subject–verb agreement', explanationVi: '“People” là danh từ số nhiều nên dùng “are”, không dùng “is”. Đây chỉ là ví dụ minh họa; khi có AI, lỗi sẽ được trích từ chính bài của bạn.', tip: 'Hãy xác định chủ ngữ trước khi chọn động từ.' }],
  vocabulary: [{ original: 'very good', suggestion: 'beneficial / effective / valuable', meaningVi: 'Tùy ngữ cảnh: có lợi / hiệu quả / có giá trị.', example: 'Regular reading can be beneficial for language learners.' }],
  structure: [{ title: 'Topic sentence', adviceVi: 'Mở đoạn bằng một câu nêu rõ luận điểm chính.', example: 'One major benefit of learning English is that it expands access to education.' }, { title: 'Explanation + example', adviceVi: 'Giải thích vì sao luận điểm đúng, sau đó đưa ví dụ cụ thể thay vì chỉ khẳng định.', example: 'For example, students can access international courses and research.' }, { title: 'Link to the question', adviceVi: 'Kết nối ví dụ trở lại luận điểm hoặc câu hỏi đề bài.' }],
  modelAnswer: 'A model answer will be generated after you configure an AI API key. It should answer the exact prompt and match the selected IELTS task.',
  modelAnswerNoteVi: 'Không nên học thuộc bài mẫu. Hãy dùng bài mẫu để quan sát cách phát triển ý, tổ chức đoạn và lựa chọn từ vựng.',
  practice: [{ question: 'Choose the correct sentence.', options: ['People is interested in education.', 'People are interested in education.', 'People be interested in education.'], answer: 1, explanationVi: '“People” là chủ ngữ số nhiều nên động từ “to be” ở hiện tại là “are”.' }],
  strengths: essay.trim().length > 0 ? ['Bạn đã bắt đầu viết và có nội dung để cải thiện.'] : ['Nhập bài viết để bắt đầu luyện tập.'],
  nextSteps: ['Đọc đề và gạch chân từ khóa.', 'Mỗi đoạn thân bài tập trung vào một luận điểm chính.', 'Dành thời gian kiểm tra lỗi ngữ pháp và từ vựng sau khi viết.']
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const essay = typeof body.essay === 'string' ? body.essay.trim() : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const task = body.task === 'task1' ? 'IELTS Academic Writing Task 1' : 'IELTS Writing Task 2';
    if (essay.length < 30) return NextResponse.json({ error: 'Hãy nhập bài viết dài ít nhất 30 ký tự để nhận phản hồi có ý nghĩa.' }, { status: 400 });
    if (essay.length > 12000) return NextResponse.json({ error: 'Bài viết quá dài. Vui lòng giới hạn dưới 12.000 ký tự.' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ feedback: demoFeedback(essay), demo: true });

    const system = `You are a careful IELTS Writing tutor. Return ONLY valid JSON matching this schema: {
"overallBand": number,
"disclaimer": string,
"criteria": [{"name": string,"band": number,"comment": string,"vietnamese": string}],
"corrections": [{"original": string,"corrected": string,"category": string,"explanationVi": string,"tip": string}],
"vocabulary": [{"original": string,"suggestion": string,"meaningVi": string,"example": string}],
"structure": [{"title": string,"adviceVi": string,"example": string}],
"modelAnswer": string,"modelAnswerNoteVi": string,
"practice": [{"question": string,"options": [string,string,string],"answer": number,"explanationVi": string}],
"strengths": [string],"nextSteps": [string]
}. All teaching explanations must be in Vietnamese. Examples and corrected English must be in English. Score all four official IELTS criteria with band values from 0 to 9 in 0.5 increments. Be honest and conservative; say that AI estimates are not official IELTS scores. For Task 1, use Task Achievement; for Task 2, use Task Response. Quote short exact excerpts from the student's text in corrections; do not invent errors. If there are few errors, say so and focus on higher-level improvements. Provide 3-8 corrections where warranted, 3-5 vocabulary improvements, 3-5 structure tips, and 3 practice questions targeting actual recurring errors. Model answer must answer the given prompt and be an original illustrative answer, not claim to be an official model answer. Do not rewrite the student's position without explanation.`;
    const user = `Task type: ${task}\nPrompt: ${prompt || '(No prompt provided)'}\nStudent essay:\n${essay}\n\nGive specific, actionable feedback for this exact submission. Output JSON only.`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('AI provider error:', response.status, detail.slice(0, 500));
      return NextResponse.json({ error: 'Không gọi được dịch vụ AI. Hãy kiểm tra API key, hạn mức và tên model trong phần Environment Variables.' }, { status: 502 });
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'AI chưa trả về nội dung. Vui lòng thử lại.' }, { status: 502 });
    const feedback = JSON.parse(content) as Feedback;
    return NextResponse.json({ feedback, demo: false });
  } catch (error) {
    console.error('Feedback route error:', error);
    return NextResponse.json({ error: 'Có lỗi khi xử lý bài viết. Vui lòng thử lại.' }, { status: 500 });
  }
}
