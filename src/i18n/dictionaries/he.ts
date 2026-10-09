import type { Project } from "@/content/projects";

// Owner-supplied wording and explicitly marked wireframe placeholders only.
// Final website content remains planned separately in docs/03-content.md.
export const he = {
  metadata: {
    title: "Moriz Studio — וויירפריים",
    description: "שלד עמוד בית בשחור־לבן לבחינת המבנה.",
  },
  studioName: "Moriz Studio",
  theme: {
    switchToDark: "מעבר למצב כהה",
    switchToLight: "מעבר למצב בהיר",
  },
  fontPreview: {
    title: "השוואת פונטים",
    introduction:
      "חמישה פונטים עם טקסט ההירו. אפשר לערוך את הכותרת ולשנות את הגודל כדי להשוות.",
    back: "חזרה לעמוד הבית",
    textLabel: "טקסט לבדיקה",
    sizeLabel: "גודל הכותרת",
    reset: "איפוס",
  },
  skipToContent: "דלג לתוכן",
  navigation: {
    label: "ניווט ראשי",
    openLabel: "פתיחת תפריט",
    closeLabel: "סגירת תפריט",
    desktopLinks: [
      { label: "פרויקטים", href: "#projects" },
      { label: "קצת עלי", href: "#about" },
      { label: "איך מתחילים", href: "#getting-started" },
      { label: "שאלות תשובות", href: "#faq" },
    ],
    contactLink: { label: "בואו נדבר", href: "#contact" },
    links: [
      { label: "פרויקטים", href: "#projects" },
      { label: "קצת עליי", href: "#about" },
      { label: "יצירת קשר", href: "#contact" },
    ],
    languages: {
      he: {
        label: "עברית",
        shortLabel: "HE",
        unavailableLabel: "עברית — בהמשך",
      },
      en: {
        label: "אנגלית",
        shortLabel: "EN",
        unavailableLabel: "אנגלית — בהמשך",
      },
    },
  },
  hero: {
    heading: "יוצרת פתרונות דיגיטליים מבוססי מחקר",
    introduction: "נעים להכיר, אני מור",
    portraitAlt: "מור — בעלת הסטודיו",
    description: {
      emphasis: "מחקר מנצח טיעונים",
      firstLine: ". מתוך התפיסה הזו אני ניגשת לכל פרויקט – מורכב ככל שיהיה.",
      secondLine: "עם תואר בטכנולוגיות למידה מ-HIT וניסיון עשיר בפיתוח",
      thirdLine: "אצור עבורכם כלי דיגיטלי שבאמת יודע לעצור את הגולש,",
      fourthLine: "ללכוד את תשומת לבו ולהביא לפעולה.",
    },
    projectsLink: "לצפיה בפרויקטים",
    slideshow: {
      pause: "עצירת מצגת העבודות",
      resume: "הפעלת מצגת העבודות",
      images: [
        "פרקטיקל AI — אירוע קרוב ועוזר אישי בוואטסאפ במובייל",
        "פרקטיקל AI — המשך למידה במובייל",
        "פרקטיקל AI — יכולות העוזר האישי במובייל",
        "פרקטיקל AI — קורסים ואירוע קרוב במחשב נייד",
        "פרקטיקל AI — עמוד הבית במחשב נייד",
        "פרקטיקל AI — מסלול למידה ותכנים במובייל",
        "Awescience — סימולציית מטריצות בשני מסכי מובייל",
        "Awescience — שיעור על מטריצות במחשב נייד",
        "פרקטיקל AI — העוזר האישי והקהילה במחשב נייד",
      ],
    },
  },
  logoCarousel: {
    label: "לוגואים",
    placeholder: "לוגו — להוספה",
    pause: "עצירת תנועת הלוגואים",
    resume: "הפעלת תנועת הלוגואים",
  },
  advantages: {
    heading: "שלושת היתרונות",
    themes: [
      "איפיון ועיצוב מבוססי מחקר",
      "חוויה אינטראקטיבית ואטרקטיבית",
      "פיתוח ללא גבולות",
    ],
    supportingInformation: "מידע תומך — להשלמה",
    party: {
      prompt: "let’s party?",
      no: "No",
      yes: "Yes",
      normal: "NORMAL",
      party: "PARTY",
      label: "מצב מסיבה",
      off: "חזרה למצב רגיל",
      preparing: "מצב מסיבה מופעל",
      active: "האתר במצב מסיבה",
      unavailable: "לא ניתן לטעון את מצב המסיבה. אפשר לנסות שוב.",
    },
    research: {
      description:
        "כל כפתור, כל אנימציה וכל בחירה היא מושכלת. אני מתעדכנת כל הזמן במחקרים ומתודולוגיות חדשות.",
      termsLabel: "מונחים מעולם המחקר ועיצוב חוויית המשתמש",
      terms: [
        "מחקר משתמשים",
        "UI",
        "UX",
        "מסע משתמש",
        "בדיקות שמישות",
        "מחקר מתחרים",
        "ארכיטקטורת מידע",
        "Design System",
      ],
    },
  },
  projects: {
    heading: "פרויקטים",
    allHeading: "כל הפרויקטים",
    allLink: "לצפייה בכל הפרויקטים",
    homeLink: "חזרה לעמוד הבית",
    visualLabel: "מסכים / ויזואל — להוספה",
    descriptionPlaceholder: "תיאור הפרויקט — להשלמה",
    contributionPlaceholder: "התפקיד שלי בפרויקט — להשלמה",
    answerPlaceholder: "תשובה — להשלמה",
    detailsHeading: "על הפרויקט",
    projectLink: "לפרויקט המלא",
    backLink: "חזרה לפרויקטים",
    items: [
      {
        slug: "practice-ai",
        title: "practice ai learning system",
        description: "מערכת למידה עבור practice ai.",
        contribution: null,
        image: null,
        details: [
          { id: "question-1", question: "שאלה 1 — להשלמה", answer: null },
          { id: "question-2", question: "שאלה 2 — להשלמה", answer: null },
          { id: "question-3", question: "שאלה 3 — להשלמה", answer: null },
          { id: "question-4", question: "שאלה 4 — להשלמה", answer: null },
        ],
      },
      {
        slug: "haaretz",
        title: "הארץ — וורדעל",
        description: "פרויקט עבור עיתון הארץ.",
        contribution: null,
        image: null,
        details: [
          { id: "question-1", question: "שאלה 1 — להשלמה", answer: null },
          { id: "question-2", question: "שאלה 2 — להשלמה", answer: null },
          { id: "question-3", question: "שאלה 3 — להשלמה", answer: null },
          { id: "question-4", question: "שאלה 4 — להשלמה", answer: null },
        ],
      },
      {
        slug: "chabad-club",
        title: "חב״ד קלאב",
        description: null,
        contribution: null,
        image: null,
        details: [
          { id: "question-1", question: "שאלה 1 — להשלמה", answer: null },
          { id: "question-2", question: "שאלה 2 — להשלמה", answer: null },
          { id: "question-3", question: "שאלה 3 — להשלמה", answer: null },
          { id: "question-4", question: "שאלה 4 — להשלמה", answer: null },
        ],
      },
    ] satisfies Project[],
  },
  about: {
    heading: "קצת עליי",
    information: "מידע עליי — להשלמה",
    linkPlaceholder: "קישור לעמוד אודות — להחלטה",
    visualLabel: "תמונה / ויזואל — להחלטה",
  },
  testimonials: {
    heading: "המלצות מלקוחות",
    quotePlaceholder: "המלצה — לבחירה",
    attribution: "שם, תפקיד וארגון — להשלמה",
  },
  gettingStarted: {
    heading: "איך מתחילים לעבוד יחד",
    steps: [
      { title: "שיחת טלפון קצרה", detail: "5–10 דקות" },
      { title: "שיחת אפיון מעמיקה", detail: "מידע נוסף — להשלמה" },
      { title: "קבלת הצעת מחיר", detail: "מידע נוסף — להשלמה" },
    ],
  },
  faq: {
    heading: "שאלות ותשובות",
    questions: ["שאלה 1 — להשלמה", "שאלה 2 — להשלמה", "שאלה 3 — להשלמה"],
    answerPlaceholder: "תשובה — להשלמה",
  },
  contact: {
    heading: "יצירת קשר",
    information: "מידע ופעולות בסקשן — להחלטה",
  },
  footer: { information: "פרטי הפוטר והקישורים — להשלמה" },
  whatsapp: {
    label: "פנייה בוואטסאפ",
    unconfiguredLabel: "וואטסאפ — מספר יצירת הקשר טרם הוזן",
  },
};
