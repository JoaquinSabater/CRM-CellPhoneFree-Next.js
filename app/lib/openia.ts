
const API_KEY = process.env.OPENAI_API_KEY!;

export async function chatWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un asistente útil.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await response.json();
  return data.choices[0]?.message?.content ?? "Sin respuesta de OpenAI";
}