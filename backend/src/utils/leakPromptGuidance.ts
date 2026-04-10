import { detectLeakKeywords, leakKeywordGroups } from './leakKeywordRules';

type LeakKeywordGroup = keyof typeof leakKeywordGroups;

export interface UploadedLeakImage {
  description?: string;
  url?: string;
}

interface LeakPromptMeta {
  foundKeywords: string[];
  missingKeywords: string[];
  completedGroups: LeakKeywordGroup[];
}

function getCurrentIsraelDateIso(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

export function collectLeakPromptMeta(prompt: string): LeakPromptMeta {
  const detection = detectLeakKeywords(prompt);
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const completedGroups: LeakKeywordGroup[] = [];

  (Object.entries(leakKeywordGroups) as [LeakKeywordGroup, readonly string[]][])
    .forEach(([group, keywords]) => {
      let groupComplete = true;

      keywords.forEach((keyword) => {
        if (detection.matched.has(keyword as Parameters<typeof detection.matched.has>[0])) {
          foundKeywords.push(keyword);
          return;
        }

        missingKeywords.push(keyword);
        groupComplete = false;
      });

      if (groupComplete) {
        completedGroups.push(group);
      }
    });

  return { foundKeywords, missingKeywords, completedGroups };
}

export function buildLeakDetectionPrompt(
  prompt: string,
  images: UploadedLeakImage[] = []
): string {
  const meta = collectLeakPromptMeta(prompt);
  const currentDateIso = getCurrentIsraelDateIso();

  const imageInstructions = images.length
    ? images
        .map((image, index) => {
          const description = image.description?.trim();
          return `${index + 1}. ${description || 'ללא תיאור תמונה'}`;
        })
        .join('\n')
    : 'לא הועלו תמונות.';

  const completedGroups = meta.completedGroups.length
    ? meta.completedGroups.join(', ')
    : 'אין קבוצות שהושלמו במלואן.';

  const foundKeywords = meta.foundKeywords.length
    ? meta.foundKeywords.join(', ')
    : 'לא זוהו רמזים ברורים מתוך רשימת ההכוונה.';

  const missingKeywords = meta.missingKeywords.length
    ? meta.missingKeywords.join(', ')
    : 'לא חסרות מילות מפתח מתוך רשימת ההכוונה.';

  return [
    'הטקסט הבא נכתב על ידי המשתמש עבור דוח איתור נזילות.',
    'העדף את הפרטים שהמשתמש כתב בפועל. השתמש במילות המפתח שזוהו כרמז למידע שצריך לחלץ ולסדר בשדות הנכונים.',
    'כאשר חסרים פרטים, השאר את השדות ריקים במקום להמציא מידע.',
    `התאריך הנוכחי לצורך פירוש ביטויים יחסיים כמו "היום", "אתמול" ו"מחר" הוא ${currentDateIso} לפי אזור הזמן Asia/Jerusalem.`,
    '',
    'טקסט המשתמש:',
    prompt.trim(),
    '',
    'מילות מפתח שזוהו:',
    foundKeywords,
    '',
    'מילות מפתח שלא זוהו:',
    missingKeywords,
    '',
    'קבוצות מידע שהושלמו:',
    completedGroups,
    '',
    'תיאורי תמונות שהועלו לפי סדר התמונות:',
    imageInstructions,
  ].join('\n');
}
