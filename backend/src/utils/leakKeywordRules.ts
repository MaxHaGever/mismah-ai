export const leakKeywordGroups = {
  reportDetails: ['סוג הנכס', 'כתובת הבדיקה', 'שם הלקוח', 'תאריך'],
  inspectorDetails: ['שם הבודק', 'טלפון ליצירת קשר', 'השכלת הבודק', 'נסיון הבודק'],
  methods: ['מצלמה', 'בדיקה'],
  leakLocations: ['מוקד הנזילה', 'תיאור הנזילה'],
  recommendations: ['המלצות', 'הערות'],
} as const;

type KeywordLabel = (typeof leakKeywordGroups)[keyof typeof leakKeywordGroups][number];

interface KeywordRule {
  label: KeywordLabel;
  hints: string[];
  patterns: RegExp[];
}

const leakWords = /(נזיל|דליפ|רטיבות|רטוב|טפטו|חדירת מים|הצפה|כתם רטיבות)/i;
const locationWords = /(מרפסת|מקלחת|אמבטיה|שירותים|מטבח|גג|תקרה|קיר|רצפה|חלון|סלון|חדר|צנרת|ממ"ד|מסתור כביסה)/i;

const keywordRules: KeywordRule[] = [
  { label: 'סוג הנכס', hints: ['דירה', 'בית פרטי', 'משרד'], patterns: [/סוג הנכס/i, /דירה|בית פרטי|פנטהאוז|משרד|חנות|מחסן|וילה|מבנה|נכס/i] },
  { label: 'כתובת הבדיקה', hints: ['רחוב', 'שדרות', 'בניין'], patterns: [/כתובת/i, /רחוב|רח׳|שד׳|שדרות|שכונה|בניין|קומה|דירה מספר/i] },
  { label: 'שם הלקוח', hints: ['לקוח', 'דייר', 'בעל הנכס'], patterns: [/שם הלקוח/i, /לקוח|לקוחה|דייר|דיירת|בעל(?:ת)? הנכס|עבור\s+\S+/i] },
  { label: 'תאריך', hints: ['היום', 'בתאריך'], patterns: [/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/, /תאריך|היום|אתמול|ביום/i] },
  {
    label: 'שם הבודק',
    hints: ['מבצע הבדיקה', 'טכנאי'],
    patterns: [
      /שם הבודק/i,
      /מבצע הבדיקה|בוצע על ידי|נבדק על ידי|טכנאי|בודק/i,
      /את הבדיקה ביצע/i,
      /הבדיקה בוצעה על ידי/i,
      /הבודק (?:היה|הינו|היא)\s+\S+/i,
      /בוצעה בדיקה על ידי/i,
    ],
  },
  { label: 'טלפון ליצירת קשר', hints: ['טלפון', 'נייד'], patterns: [/טלפון ליצירת קשר/i, /0\d{1,2}-?\d{7}/, /טלפון|נייד|יצירת קשר/i] },
  { label: 'השכלת הבודק', hints: ['הסמכה', 'קורס'], patterns: [/השכלת הבודק/i, /הכשרה|השכלה|הסמכה|קורס|תעודה/i] },
  { label: 'נסיון הבודק', hints: ['ותק', 'שנות ניסיון'], patterns: [/נסיון הבודק|ניסיון הבודק/i, /ניסיו(?:ן|ן)|ותק|שנים בתחום|שנות ניסיון/i] },
  { label: 'מצלמה', hints: ['מצלמה תרמית', 'אינפרא'], patterns: [/מצלמה/i, /תרמית|אינפרא|אינפרה|thermal/i] },
  { label: 'בדיקה', hints: ['סריקה', 'מדידת לחות'], patterns: [/בדיקה/i, /איתור|סריקה|מדידה|לחות|הצפה|לחץ/i] },
  { label: 'מוקד הנזילה', hints: ['מרפסת', 'קיר חדר רחצה'], patterns: [/מוקד הנזילה/i] },
  { label: 'תיאור הנזילה', hints: ['רטיבות', 'טפטוף'], patterns: [/תיאור הנזילה/i, /רטיבות|עובש|טפטוף|כתם|קילוף|התנפחות|סדק|מים/i] },
  { label: 'המלצות', hints: ['מומלץ לבצע', 'יש להחליף'], patterns: [/המלצות/i, /הומלץ|המלצ|מומלץ|יש לבצע|יש להחליף|נדרש|לתקן/i] },
  { label: 'הערות', hints: ['חשוב לציין', 'לסיכום'], patterns: [/הערות/i, /חשוב לציין|בנוסף|לסיכום|הערה|יצוין/i] },
];

export function detectLeakKeywords(prompt: string) {
  const matched = new Set<KeywordLabel>();
  const matchedBy = new Map<KeywordLabel, string>();

  keywordRules.forEach((rule) => {
    const hit = rule.patterns.find((pattern) => pattern.test(prompt));
    if (hit) {
      matched.add(rule.label);
      matchedBy.set(rule.label, rule.hints[0]);
    }
  });

  if (!matched.has('מוקד הנזילה') && leakWords.test(prompt) && locationWords.test(prompt)) {
    matched.add('מוקד הנזילה');
    matchedBy.set('מוקד הנזילה', 'זוהה תיאור מיקום של נזילה');
  }

  if (!matched.has('תיאור הנזילה') && leakWords.test(prompt)) {
    matched.add('תיאור הנזילה');
    matchedBy.set('תיאור הנזילה', 'זוהה תיאור של רטיבות או דליפה');
  }

  return { matched, matchedBy };
}
