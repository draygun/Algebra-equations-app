// services/openrouter.js — работа с OpenRouter API

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages) {
  if (!APP_CONFIG || !APP_CONFIG.openrouter || !APP_CONFIG.openrouter.apiKey) {
    throw new Error('OpenRouter API ключ не настроен. Скопируйте config.example.js в config.js и укажите ключ.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APP_CONFIG.openrouter.apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: APP_CONFIG.openrouter.model || 'google/gemini-2.0-flash-lite-preview-02-05',
      messages,
    }),
  });

  if (!response.ok) {
    let err = 'Unknown error';
    try { err = await response.text(); } catch(e) {}
    throw new Error(`Ошибка OpenRouter (${response.status}): ${err}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices.length) {
    throw new Error('OpenRouter вернул пустой ответ');
  }
  return data.choices[0].message.content;
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch(e) {}
  }
  try { return JSON.parse(text); } catch(e) {}
  return null;
}

async function generateEquation(eqType) {
  const prompt = [
    {
      role: 'system',
      content: `Ты — преподаватель алгебры для 7-9 классов. Сгенерируй одно уравнение типа "${eqType.name}" для практики. Уравнение должно соответствовать ${eqType.class} классу и быть решаемым.

Верни ответ строго в формате JSON БЕЗ лишнего текста:
{
  "equation": "уравнение",
  "answer": "правильный ответ",
  "difficulty": "легко/средне/сложно"
}`
    },
    { role: 'user', content: `Сгенерируй уравнение типа "${eqType.name}".` }
  ];

  const result = await callOpenRouter(prompt);
  const parsed = extractJSON(result);
  if (!parsed || !parsed.equation) {
    throw new Error('AI вернул некорректный ответ. Попробуйте снова.');
  }
  return parsed;
}

async function checkAnswer(equation, userAnswer, correctAnswer) {
  const prompt = [
    {
      role: 'system',
      content: 'Ты — учитель алгебры. Проверь ответ ученика. Верни ТОЛЬКО JSON: { "correct": true/false, "explanation": "почему" }'
    },
    {
      role: 'user',
      content: `Уравнение: ${equation}\nПравильный ответ: ${correctAnswer}\nОтвет ученика: ${userAnswer}\n\nВерно?`
    }
  ];

  const result = await callOpenRouter(prompt);
  const parsed = extractJSON(result);
  if (!parsed || parsed.correct === undefined) {
    return { correct: false, explanation: 'Не удалось проверить ответ. Попробуйте снова.' };
  }
  return parsed;
}

async function getHint(equation) {
  const prompt = [
    {
      role: 'system',
      content: 'Ты — преподаватель алгебры. Дай короткую подсказку к решению уравнения (1-3 предложения). Не давай полное решение. Ответь на русском.'
    },
    { role: 'user', content: `Дай подсказку к уравнению: ${equation}` }
  ];
  return callOpenRouter(prompt);
}
