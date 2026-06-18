// services/openrouter.js — работа с OpenRouter API

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, retries = 2) {
  if (!APP_CONFIG || !APP_CONFIG.openrouter || !APP_CONFIG.openrouter.apiKey) {
    throw new Error('OpenRouter API ключ не настроен. Скопируйте config.example.js в config.js и укажите ключ.');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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

        // 429 rate limit — автоматический повтор
        if (response.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        throw new Error(`Ошибка OpenRouter (${response.status}): ${err}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices.length) {
        throw new Error('OpenRouter вернул пустой ответ');
      }
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt < retries && err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      throw err;
    }
  }
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
      content: `Ты — преподаватель алгебры для 7-9 классов. Сгенерируй одно уравнение типа "${eqType.name}" для практики. Уравнение должно соответствовать ${eqType.class} классу и быть решаемым. Обращайся к ученику на "ты".

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
      content: 'Ты — учитель алгебры. Проверь ответ ученика. Пиши объяснение, обращаясь к ученику на "ты" (например "ты верно нашёл корень", "ты ошибся в знаке"). Верни ТОЛЬКО JSON: { "correct": true/false, "explanation": "почему" }'
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
      content: 'Ты — преподаватель алгебры. Дай короткую подсказку к решению уравнения (1-3 предложения). Укажи только метод решения или первый шаг. НЕ давай полное решение, НЕ пиши правильный ответ. Обращайся к ученику на "ты". Ответь на русском.'
    },
    { role: 'user', content: `Какой метод решения у уравнения ${equation}? Дай только подсказку, не решай его.` }
  ];
  return callOpenRouter(prompt);
}
