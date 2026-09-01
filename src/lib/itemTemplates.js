// Starter checklists per event type, used by the creation wizard (idea #3).
// Purely client-side data — no schema involved. Users can edit/delete freely after adding.
export const ITEM_TEMPLATES = {
  קמפינג: {
    equipment_items: ['אוהל', 'שקי שינה', 'מזרנים', 'פנס ראש', 'כיסאות מתקפלים', 'שולחן מתקפל', 'גפרורים/מצית', 'ערכת עזרה ראשונה', 'קרם הגנה', 'תרסיס יתושים'],
    shopping_items: ['מים', 'קרח', 'פחם לגריל', 'חטיפים', 'קפה/תה', 'נייר טואלט', 'שקיות אשפה'],
    menu_items: ['ארוחת בוקר', 'ארוחת צהריים', 'ארוחת ערב על האש'],
  },
  'יום הולדת': {
    equipment_items: ['קישוטים', 'בלונים', 'מפות שולחן', 'כלים חד פעמיים', 'רמקול'],
    shopping_items: ['עוגה', 'נרות', 'משקאות', 'חטיפים'],
    menu_items: ['עוגה', 'כיבוד קל', 'ממתקים'],
  },
  טיול: {
    equipment_items: ['תיק גב', 'נעלי הליכה', 'מקלות הליכה', 'ערכת עזרה ראשונה', 'מפה/ניווט'],
    shopping_items: ['מים', 'חטיפי אנרגיה', 'כריכים'],
    menu_items: ['ארוחת צהריים', 'נשנושים לדרך'],
  },
  חתונה: {
    equipment_items: ['קישוטים', 'תאורה', 'רמקולים'],
    shopping_items: ['פרחים', 'יין ומשקאות'],
    menu_items: ['ארוחה חגיגית', 'עוגת חתונה'],
  },
  'מפגש משפחתי': {
    equipment_items: ['כיסאות נוספים', 'משחקים'],
    shopping_items: ['משקאות', 'חטיפים'],
    menu_items: ['ארוחה משותפת'],
  },
}

export function getTemplateFor(eventType) {
  if (!eventType) return null
  return ITEM_TEMPLATES[eventType.trim()] || null
}
