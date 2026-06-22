// services/openrouter.js — работа с OpenRouter API

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FALLBACK_MODELS = [
  'cohere/north-mini-code:free',
  'openrouter/owl-alpha',
  'poolside/laguna-m.1:free',
];

async function callOpenRouter(messages) {
  if (!APP_CONFIG || !APP_CONFIG.openrouter || !APP_CONFIG.openrouter.apiKey) {
    throw new Error('OpenRouter API ключ не настроен. Скопируйте config.example.js в config.js и укажите ключ.');
  }

  const models = [
    APP_CONFIG.openrouter.model || 'qwen/qwen3-next-80b-a3b-instruct:free',
    ...FALLBACK_MODELS,
  ];

  async function tryModel(model) {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_CONFIG.openrouter.apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({ model, messages }),
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

  // Фаза 1: пробуем каждую модель по одному разу без задержки
  for (const model of models) {
    try {
      return await tryModel(model);
    } catch (err) {
      const isRetryable = err.message.includes('429') || err.message.includes('400');
      const isModelDead = err.message.includes('404') || err.message.includes('unavailable') || err.message.includes('not available');
      if (!isRetryable && !isModelDead) throw err;
    }
  }

  // Фаза 2: все модели отказали — циклический перебор с задержкой 3с
  for (let round = 0; round < 10; round++) {
    for (const model of models) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        return await tryModel(model);
      } catch (err) {
        const isRetryable = err.message.includes('429') || err.message.includes('400');
        if (!isRetryable) throw err;
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

async function generateEquation(eqType, difficulty) {
  // Get examples for this eq type and difficulty
  const examples = EQUATION_EXAMPLES[eqType.id];
  if (!examples || !examples[difficulty]) {
    throw new Error(`Нет примеров для типа "${eqType.id}" уровня ${difficulty}`);
  }
  const levelExamples = examples[difficulty];
  const template = levelExamples[Math.floor(Math.random() * levelExamples.length)];

  const prompt = [
    {
      role: 'system',
      content: `Ты — преподаватель алгебры для 7-9 классов. Сгенерируй ОДНО уравнение типа "${eqType.name}" (${eqType.class} класс) для практики. Уравнение должно быть решаемым.

Вот пример уравнения этого типа и уровня сложности (уровень ${difficulty}):
Уравнение: ${template.equation}
Ответ: ${template.answer}
Шаги решения:
${template.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}

Сгенерируй ПОХОЖЕЕ уравнение — ДРУГИЕ ЧИСЛА, но та же структура. Обращайся к ученику на "ты".

Верни ответ строго в формате JSON БЕЗ лишнего текста:
{
  "equation": "уравнение",
  "answer": "правильный ответ",
  "steps": ["шаг 1", "шаг 2", ...],
  "difficulty": ${difficulty}
}`
    },
    {
      role: 'user',
      content: `Сгенерируй уравнение типа "${eqType.name}", уровень сложности ${difficulty}. Используй пример как шаблон, но с другими числами.`
    }
  ];

  const result = await callOpenRouter(prompt);
  const parsed = extractJSON(result);
  if (!parsed || !parsed.equation || !parsed.answer || !parsed.steps) {
    throw new Error('AI вернул некорректный ответ. Попробуйте снова.');
  }
  return parsed;
}

async function checkAnswer(equation, userAnswer, correctAnswer, steps) {
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
  if (parsed.correct && steps && steps.length) {
    parsed.steps = steps;
  }
  return parsed;
}

async function getHint(steps) {
  if (steps && steps.length > 0) {
    return steps[0];
  }
  throw new Error('Шаги решения недоступны.');
}
