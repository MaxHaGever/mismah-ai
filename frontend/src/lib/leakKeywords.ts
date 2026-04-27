export interface LeakStructuredDetails {
  reportNumber?: string;
  reportDate?: string;
  clientName?: string;
  propertyAddress?: string;
  apartmentNumber?: string;
  floor?: string;
  propertyType?: string;
  performedBy?: string;
  licenseNumber?: string;
  contactNumber?: string;
  contactExperience?: string;
}

export const keywordGroups = {
  'פרטי הדוח': ['מספר דו"ח', 'תאריך', 'שם הלקוח', 'כתובת הבדיקה', 'מספר דירה', 'קומה', 'סוג הנכס'],
  'פרטי הבודק': ['שם הבודק', 'מספר רישיון', 'טלפון ליצירת קשר', 'ניסיון מקצועי'],
  'שיטות וכלים ששומשו בבדיקה': ['מצלמה', 'בדיקה'],
  'מוקדי נזילה': ['מוקד הנזילה', 'תיאור הנזילה'],
  'סיכום מקצועי': ['מקור התקלה', 'המלצות', 'הערות'],
} as const;

export type KeywordLabel = (typeof keywordGroups)[keyof typeof keywordGroups][number];

interface KeywordRule {
  label: KeywordLabel;
  hints: string[];
  patterns: RegExp[];
}

const leakWords = /(נזיל|דליפ|רטיבות|רטוב|טפטו|חדירת מים|הצפה|כתם רטיבות)/i;
const locationWords = /(מרפסת|מקלחת|אמבטיה|שירותים|מטבח|גג|תקרה|קיר|רצפה|חלון|סלון|חדר|צנרת|ממ"ד|מסתור כביסה)/i;

const keywordRules: KeywordRule[] = [
  { label: 'מספר דו"ח', hints: ['2026-0413-01', 'דוח 1542'], patterns: [/מספר דו["״]ח/i, /דוח מספר/i, /מס['"]?\s*דוח/i] },
  { label: 'סוג הנכס', hints: ['דירה', 'בית פרטי', 'משרד'], patterns: [/סוג הנכס/i, /דירה|בית פרטי|פנטהאוז|משרד|חנות|מחסן|וילה|מבנה|נכס/i] },
  { label: 'כתובת הבדיקה', hints: ['רחוב', 'שדרות', 'בניין'], patterns: [/כתובת/i, /רחוב|רח׳|שד׳|שדרות|שכונה|בניין|קומה|דירה מספר/i] },
  { label: 'שם הלקוח', hints: ['לקוח', 'דייר', 'בעל הנכס'], patterns: [/שם הלקוח/i, /לקוח|לקוחה|דייר|דיירת|בעל(?:ת)? הנכס|עבור\s+\S+/i] },
  { label: 'תאריך', hints: ['היום', 'בתאריך'], patterns: [/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/, /תאריך|היום|אתמול|ביום/i] },
  { label: 'מספר דירה', hints: ['דירה 4', 'יחידה 2'], patterns: [/מספר דירה/i, /דירה\s+\d+/i, /יחידה\s+\d+/i] },
  { label: 'קומה', hints: ['קומה 2', 'קומת קרקע'], patterns: [/קומה/i, /קומת קרקע|קומה\s+\d+/i] },
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
  { label: 'מספר רישיון', hints: ['12345', 'מס׳ רישיון'], patterns: [/מספר רישיון/i, /מס['"]?\s*רישיון/i, /רישיון\s+\d+/i] },
  { label: 'טלפון ליצירת קשר', hints: ['050-1234567', 'נייד'], patterns: [/טלפון ליצירת קשר/i, /0\d{1,2}-?\d{7}/, /טלפון|נייד|יצירת קשר/i] },
  { label: 'ניסיון מקצועי', hints: ['10 שנות ניסיון', 'ותק'], patterns: [/ניסיון מקצועי/i, /נסיון הבודק|ניסיון הבודק/i, /ניסיו(?:ן|ן)|ותק|שנים בתחום|שנות ניסיון/i] },
  { label: 'מצלמה', hints: ['מצלמה תרמית', 'אינפרא'], patterns: [/מצלמה/i, /תרמית|אינפרא|אינפרה|thermal/i] },
  { label: 'בדיקה', hints: ['סריקה', 'מדידת לחות'], patterns: [/בדיקה/i, /איתור|סריקה|מדידה|לחות|הצפה|לחץ/i] },
  { label: 'מוקד הנזילה', hints: ['מרפסת', 'קיר חדר רחצה'], patterns: [/מוקד הנזילה/i] },
  { label: 'תיאור הנזילה', hints: ['רטיבות', 'טפטוף'], patterns: [/תיאור הנזילה/i, /רטיבות|עובש|טפטוף|כתם|קילוף|התנפחות|סדק|מים/i] },
  { label: 'מקור התקלה', hints: ['מקור הבעיה', 'נובע מ'], patterns: [/מקור התקלה/i, /מקור הבעיה|מקור הנזילה|להערכתי מקור|נובע מ|קשור ל/i] },
  { label: 'המלצות', hints: ['מומלץ לבצע', 'יש להחליף'], patterns: [/המלצות/i, /הומלץ|המלצ|מומלץ|יש לבצע|יש להחליף|נדרש|לתקן/i] },
  { label: 'הערות', hints: ['חשוב לציין', 'לסיכום'], patterns: [/הערות/i, /חשוב לציין|בנוסף|לסיכום|הערה|יצוין/i] },
];

export interface KeywordDetection {
  matched: Set<KeywordLabel>;
  matchedBy: Partial<Record<KeywordLabel, string>>;
}

const detailLabelMap: Partial<Record<KeywordLabel, keyof LeakStructuredDetails>> = {
  'מספר דו"ח': 'reportNumber',
  תאריך: 'reportDate',
  'שם הלקוח': 'clientName',
  'כתובת הבדיקה': 'propertyAddress',
  'מספר דירה': 'apartmentNumber',
  קומה: 'floor',
  'סוג הנכס': 'propertyType',
  'שם הבודק': 'performedBy',
  'מספר רישיון': 'licenseNumber',
  'טלפון ליצירת קשר': 'contactNumber',
  'ניסיון מקצועי': 'contactExperience',
};

export function detectLeakKeywords(prompt: string, details: LeakStructuredDetails = {}): KeywordDetection {
  const matched = new Set<KeywordLabel>();
  const matchedBy: Partial<Record<KeywordLabel, string>> = {};
  const text = prompt.trim();

  (Object.entries(detailLabelMap) as [KeywordLabel, keyof LeakStructuredDetails][])
    .forEach(([label, field]) => {
      if (details[field]?.trim()) {
        matched.add(label);
        matchedBy[label] = 'מולא בשדות המסמך';
      }
    });

  keywordRules.forEach((rule) => {
    const hit = rule.patterns.find((pattern) => pattern.test(text));
    if (hit) {
      matched.add(rule.label);
      matchedBy[rule.label] = rule.hints[0];
    }
  });

  if (!matched.has('מוקד הנזילה') && leakWords.test(text) && locationWords.test(text)) {
    matched.add('מוקד הנזילה');
    matchedBy['מוקד הנזילה'] = 'זוהה תיאור מיקום של נזילה';
  }

  if (!matched.has('תיאור הנזילה') && leakWords.test(text)) {
    matched.add('תיאור הנזילה');
    matchedBy['תיאור הנזילה'] = 'זוהה תיאור של רטיבות או דליפה';
  }

  return { matched, matchedBy };
}
