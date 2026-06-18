// services/openrouter.js — работа с OpenRouter API

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-lite-preview-02-05',
  'mistralai/mistral-7b-instruct:free',
];

async function callOpenRouter(messages, retries = 3) {
  if (!APP_CONFIG || !APP_CONFIG.openrouter || !APP_CONFIG.openrouter.apiKey) {
    throw new Error('OpenRouter API ключ не настроен. Скопируйте config.example.js в config.js и укажите ключ.');
  }

  const models = [
    APP_CONFIG.openrouter.model || 'google/gemini-2.0-flash-lite-preview-02-05',
    ...FALLBACK_MODELS,
  ];

  const delays = [3000, 5000, 8000, 12000];

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
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
            model: models[modelIdx],
            messages,
          }),
        });

        if (!response.ok) {
          let err = 'Unknown error';
          try { err = await response.text(); } catch(e) {}

          // 429 rate limit — повтор с увеличением задержки
          if (response.status === 429 && attempt < retries) {
            const delay = delays[Math.min(attempt, delays.length - 1)];
            await new Promise(r => setTimeout(r, delay));
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
          const delay = delays[Math.min(attempt, delays.length - 1)];
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        // Если 429 и это была последняя попытка для этой модели — пробуем следующую
        if (err.message.includes('429') && modelIdx < models.length - 1) {
          break;
        }
        throw err;
      }
    }
  }

  throw new Error('Все модели OpenRouter временно недоступны. Попробуйте позже.');
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch(e) {}
  }
  try { return JSON.parse(text); } catch(e) {}
  return null;
}

const VARIATIONS = [
  'Сделай уравнение с дробными коэффициентами.',
  'Сделай уравнение, где ответ — отрицательное число.',
  'Сделай уравнение с корнями в ответе.',
  'Сделай уравнение с десятичными дробями.',
  'Сделай уравнение, которое решается в 2-3 шага.',
  'Сделай уравнение с большими числами.',
  'Сделай нестандартное уравнение, но решаемое.',
  'Сделай лёгкое уравнение для разминки.',
  'Сделай уравнение, которое проверяет понимание метода, а не вычисления.',
  'Сделай уравнение, где нужно привести подобные слагаемые.',
];

async function generateEquation(eqType) {
  const variation = VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)];
  const seed = Math.floor(Math.random() * 10000);

  const prompt = [
    {
      role: 'system',
      content: `Ты — преподаватель алгебры для 7-9 классов. Каждый раз генерируй РАЗНЫЕ уравнения, не повторяйся. Сгенерируй одно уравнение типа "${eqType.name}" для практики. Уравнение должно соответствовать ${eqType.class} классу и быть решаемым. ${variation} Обращайся к ученику на "ты".

Верни ответ строго в формате JSON БЕЗ лишнего текста:
{
  "equation": "уравнение",
  "answer": "правильный ответ",
  "difficulty": "легко/средне/сложно"
}`
    },
    { role: 'user', content: `Сгенерируй уравнение типа "${eqType.name}". Вариация #${seed}.` }
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
      content: 'Ты — преподаватель алгебры. Дай короткую подсказку к решению уравнения (1-3 предложения). Укажи только метод решения или первый шаг. КАТЕГОРИЧЕСКИ НЕЛЬЗЯ давать полное решение, пошаговое решение или правильный ответ. Если дашь полное решение — пользователь расстроится, он хочет дойти сам. Обращайся к ученику на "ты". Ответь на русском.'
    },
    { role: 'user', content: `Какой метод решения у уравнения ${equation}? Дай только подсказку, не решай его.` }
  ];
  return callOpenRouter(prompt);
}
