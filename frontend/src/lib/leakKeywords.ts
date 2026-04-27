export const keywordGroups = {
  'פרטי הביקור': ['תאריך', 'שם הלקוח', 'כתובת הבדיקה', 'סוג הנכס'],
  'פרטי הבודק': ['שם הבודק', 'טלפון ליצירת קשר', 'ניסיון מקצועי'],
  'אופן הבדיקה': ['מצלמה', 'בדיקה'],
  'ממצאים בשטח': ['מוקד הנזילה', 'תיאור הנזילה'],
  'סיכום והמשך טיפול': ['מקור התקלה', 'המלצות', 'הערות'],
} as const;

type KeywordLabel = (typeof keywordGroups)[keyof typeof keywordGroups][number];

interface KeywordRule {
  label: KeywordLabel;
  hints: string[];
  patterns: RegExp[];
}

const leakWords = /(נזיל|דליפ|רטיבות|רטוב|טפטו|חדירת מים|הצפה|כתם רטיבות)/i;
const locationWords = /(מרפסת|מקלחת|אמבטיה|שירותים|מטבח|גג|תקרה|קיר|רצפה|חלון|סלון|חדר|צנרת|ממ"ד|מסתור כביסה)/i;

const keywordRules: KeywordRule[] = [
  { label: 'תאריך', hints: ['בתאריך', 'אתמול'], patterns: [/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/, /היום|אתמול|בתאריך|ביום/i] },
  { label: 'שם הלקוח', hints: ['הלקוח', 'הלקוחה'], patterns: [/שם הלקוח/i, /לקוח|לקוחה|דייר|דיירת|עבור\s+\S+/i] },
  { label: 'כתובת הבדיקה', hints: ['רחוב', 'כתובת'], patterns: [/כתובת/i, /רחוב|רח׳|שד׳|שדרות|בניין|עיר|הרצליה|חיפה|תל אביב|ירושלים/i] },
  { label: 'סוג הנכס', hints: ['דירת מגורים'], patterns: [/סוג הנכס/i, /דירה|בית פרטי|פנטהאוז|משרד|חנות|מחסן|וילה|מבנה|נכס/i] },
  {
    label: 'שם הבודק',
    hints: ['בוצע על ידי', 'הבדיקה בוצעה על ידי'],
    patterns: [
      /שם הבודק/i,
      /מבצע הבדיקה|בוצע על ידי|נבדק על ידי|טכנאי|בודק/i,
      /את הבדיקה ביצע/i,
      /הבדיקה בוצעה על ידי/i,
      /בוצעה בדיקה על ידי/i,
    ],
  },
  { label: 'טלפון ליצירת קשר', hints: ['050-1234567'], patterns: [/0\d{1,2}-?\d{7}/, /טלפון|נייד|יצירת קשר/i] },
  { label: 'ניסיון מקצועי', hints: ['שנות ניסיון'], patterns: [/ניסיון מקצועי/i, /ניסיו(?:ן|ן)|ותק|שנים בתחום|שנות ניסיון|הכשרה/i] },
  { label: 'מצלמה', hints: ['מצלמה תרמית'], patterns: [/מצלמה/i, /תרמית|אינפרא|אינפרה|thermal/i] },
  { label: 'בדיקה', hints: ['מד לחות'], patterns: [/בדיקה/i, /איתור|סריקה|מדידה|לחות|הצפה|לחץ/i] },
  { label: 'מוקד הנזילה', hints: ['מוקד הנזילה'], patterns: [/מוקד הנזילה/i] },
  { label: 'תיאור הנזילה', hints: ['רטיבות'], patterns: [/תיאור הנזילה/i, /רטיבות|עובש|טפטוף|כתם|קילוף|התנפחות|סדק|מים/i] },
  { label: 'מקור התקלה', hints: ['מקור הבעיה'], patterns: [/מקור התקלה/i, /מקור הבעיה|מקור הנזילה|להערכתי מקור|נובע מ|קשור ל/i] },
  { label: 'המלצות', hints: ['מומלץ לבצע'], patterns: [/המלצות/i, /הומלץ|המלצ|מומלץ|יש לבצע|יש להחליף|נדרש|לתקן/i] },
  { label: 'הערות', hints: ['הערה נוספת'], patterns: [/הערות/i, /חשוב לציין|בנוסף|לסיכום|הערה|יצוין/i] },
];

export function detectLeakKeywords(prompt: string) {
  const matched = new Set<KeywordLabel>();
  const matchedBy: Partial<Record<KeywordLabel, string>> = {};

  keywordRules.forEach((rule) => {
    const hit = rule.patterns.find((pattern) => pattern.test(prompt));
    if (hit) {
      matched.add(rule.label);
      matchedBy[rule.label] = rule.hints[0];
    }
  });

  if (!matched.has('מוקד הנזילה') && leakWords.test(prompt) && locationWords.test(prompt)) {
    matched.add('מוקד הנזילה');
    matchedBy['מוקד הנזילה'] = 'זוהה תיאור מיקום של נזילה';
  }

  if (!matched.has('תיאור הנזילה') && leakWords.test(prompt)) {
    matched.add('תיאור הנזילה');
    matchedBy['תיאור הנזילה'] = 'זוהה תיאור של רטיבות או דליפה';
  }

  return { matched, matchedBy };
}
