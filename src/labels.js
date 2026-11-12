// Uzbek labels for enum values returned by the API (enums stay in English on the server).
// Unknown values fall back to a readable form of the raw value.

export const SENTIMENT = {
    positive: 'Ijobiy',
    neutral: 'Neytral',
    negative: 'Salbiy',
    mixed: 'Aralash',
}

export const LEVEL = {
    very_low: 'Juda past',
    low: 'Past',
    medium: 'Oʻrtacha',
    high: 'Yuqori',
    very_high: 'Juda yuqori',
}

export const SPEAKER = {
    operator: 'Operator',
    client: 'Mijoz',
}

export const INTENT_CATEGORY = {
    purchase: 'Xarid',
    product_inquiry: 'Mahsulot haqida soʻrov',
    price_inquiry: 'Narx soʻrovi',
    price_negotiation: 'Narx boʻyicha kelishuv',
    support: 'Yordam',
    complaint: 'Shikoyat',
    cancellation: 'Bekor qilish',
    follow_up: 'Qayta aloqa',
    information_request: 'Maʼlumot soʻrovi',
    other: 'Boshqa',
}

export const CALL_STATUS = {
    created: 'Navbatda',
    analyzing: 'Tahlil qilinmoqda',
    done: 'Tayyor',
    failed: 'Xatolik',
}

export const STAGE_TYPE = {
    open: 'Jarayonda',
    won: 'Muvaffaqiyatli',
    lost: 'Muvaffaqiyatsiz',
}

// Form field types. The first three fill the contact's name, `phone`/`email` its lists; the rest go into the
// submission note.
export const FORM_FIELD_TYPE = {
    firstName: 'Ism',
    lastName: 'Familiya',
    middleName: 'Otasining ismi',
    phone: 'Telefon',
    email: 'Email',
    text: 'Matn',
    textarea: 'Uzun matn',
    select: 'Tanlov',
}

// Role permissions: a read and a write flag per resource. Write implies read.
export const PERMISSION_RESOURCES = [
    { key: 'User', label: 'Foydalanuvchilar', read: 'Roʻyxatni koʻrish', write: 'Yaratish, tahrirlash, rol berish' },
    { key: 'Role', label: 'Rollar', read: 'Rollarni koʻrish', write: 'Rollarni yaratish va tahrirlash' },
    { key: 'Contact', label: 'Boshqalarning kontaktlari', read: 'Kontakt va qoʻngʻiroqlarni koʻrish', write: 'Tahrirlash, oʻchirish, qoʻngʻiroq yuklash' },
    { key: 'Comment', label: 'Boshqalarning izohlari', read: 'Izohlarni koʻrish', write: 'Izohlarni tahrirlash va oʻchirish' },
]

// `language` is the ISO 639-1 code of the language spoken in the call.
export const LANGUAGE = {
    uz: 'Oʻzbek',
    ru: 'Rus',
    en: 'Ingliz',
    kk: 'Qozoq',
    tg: 'Tojik',
    ky: 'Qirgʻiz',
    tr: 'Turk',
}

export function label(map, value) {
    if (value == null) return '—'
    return map[value] ?? String(value).replaceAll('_', ' ')
}
