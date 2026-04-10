import OpenAI from 'openai';

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateDocFromPrompt(userPrompt: string, systemPrompt: string): Promise<string> {
  if (!openai) {
    throw new Error('generateDocFromPrompt() should be mocked in tests or run with a valid OPENAI_API_KEY');
  }

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3
  });

  const content = chat.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI response was empty or malformed');

  return content;
}
