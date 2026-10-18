import type { AboutCredential, AboutSegment } from "@/content/about";
import type { GettingStartedStep } from "@/content/getting-started";
import type { Project } from "@/content/projects";
import type { Testimonial } from "@/content/testimonials";

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
      { label: "אבחון דיגיטלי", href: "/digital-audit" },
    ],
    contactLink: { label: "בואו נדבר", href: "#contact" },
    links: [
      { label: "פרויקטים", href: "#projects" },
      { label: "קצת עליי", href: "#about" },
      { label: "אבחון דיגיטלי", href: "/digital-audit" },
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
    heading: {
      start: "יוצרת",
      rotating: ["אתרים מורכבים", "אפליקציות Web", "איפיון ועיצוב", "כלי AI"],
      end: "מבוססי מחקר",
      // Accessible name: the rotation is visual only.
      label:
        "יוצרת אתרים מורכבים, אפליקציות Web, איפיון ועיצוב וכלי AI מבוססי מחקר",
    },
    introduction: "נעים להכיר, אני מור",
    portraitAlt: "מור — בעלת הסטודיו",
    description: {
      emphasis: "מחקר מנצח טיעונים.",
      firstLine: "מתוך התפיסה הזו אני ניגשת לכל פרויקט, מורכב ככל שיהיה.",
      secondLine: "עם תואר בטכנולוגיות למידה מ-HIT וניסיון עשיר בפיתוח,",
      thirdLine: "אצור עבורכם כלי דיגיטלי מהרעיון ועד למוצר מדהים שעובד.",
    },
    projectsLink: "לצפיה בפרויקטים",
    scrollLabel: "גללו לגלות",
    video: {
      label: "שואוריל — עבודות נבחרות",
      pause: "עצירת הסרטון",
      resume: "הפעלת הסרטון",
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
    experience: {
      description: "פחות טקסט, יותר ויז׳ואל ומעורבות של המשתמשים.",
    },
    development: {
      description:
        "אני הופכת את האפיון והעיצוב למוצר דיגיטלי עובד, עם פתרונות שמותאמים לצרכים שלכם. עד לפרטים הקטנים.",
      infinity: {
        symbol: "סמל אינסוף",
        dot: "הזזת הנקודה על סמל האינסוף",
      },
    },
    party: {
      prompt: "Let’s party?",
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
    answerPlaceholder: "תשובה — להשלמה",
    detailsHeading: "על הפרויקט",
    projectLink: "לפרויקט המלא",
    viewProject: "לצפיה בפרויקט",
    backLink: "חזרה לפרויקטים",
    archive: {
      eyebrow: "תיק עבודות",
      heading: "עבודות נבחרות",
      countLabel: "פרויקטים",
      lede: "אתרים, מוצרים דיגיטליים ואוטומציות שעיצבתי ופיתחתי — מהסקיצה הראשונה ועד השורה האחרונה של הקוד.",
      layoutLabel: "תצוגת הפרויקטים",
      layouts: { standard: "רשת", compact: "צפוף", editorial: "מגזין" },
      results: "מוצגים {count} פרויקטים",
      resultOne: "מוצג פרויקט אחד",
      resultNone: "אין פרויקטים להצגה",
      showAll: "הצגת כל הפרויקטים",
      cta: {
        heading: "אולי הפרויקט הבא הוא שלך?",
        body: "ספרו לי מה אתם רוצים לבנות, ונחשוב יחד איך לעשות את זה נכון.",
        link: "בואו נדבר",
      },
    },
    caseStudy: {
      additionalInfo: "מידע נוסף",
      gallery: "תמונות הפרויקט",
      client: "לקוח",
      year: "שנה",
      services: "שירותים",
      openImage: "הגדלת תמונה",
      viewer: "צפייה בתמונות הפרויקט",
      close: "סגירת תמונה",
      previous: "התמונה הקודמת",
      next: "התמונה הבאה",
      imageError: "לא ניתן לטעון את התמונה.",
      openOriginal: "פתיחת התמונה המקורית",
      video: "סרטון הפרויקט",
    },
    items: [
      {
        slug: "practice-ai",
        title: "practice ai learning system",
        description: "מערכת למידה עבור practice ai.",
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
    // Verbatim from the owner (2026-10-10); `strong` marks her bold phrases.
    paragraphs: [
      [
        {
          text: "אני עוזרת ליזמים, מנהלי מוצר ובעלי עסקים שמתמודדים עם קושי להעביר את הערך שלהם במרחב הדיגיטלי. הם השקיעו משאבים רבים בפיתוח המוצר או השירות שלהם, אבל ",
        },
        {
          text: "חווית המשתמש הנוכחית עושה להם עוול וההשקעה יורדת לטמיון.",
          strong: true,
        },
      ],
      [
        { text: "עם " },
        {
          text: "תואר אקדמי בטכנולוגיות למידה מ-H.I.T וניסיון של שנים בפיתוח",
          strong: true,
        },
        { text: ", יצרתי תהליך לבניית מעטפת דיגיטלית " },
        {
          text: "מבוססת פרקטיקות מחקריות ומתודולוגיות מעולם שימור הקשב.",
          strong: true,
        },
        {
          text: " הכלים שאני יוצרת שונים בסוגם: אתרי תדמית, אפליקציות Web, מערכות מותאמות אישית וכלים אינטראקטיביים (כמו מחשבונים ואינפוגרפיקות). כולם כוללים חלוקת תוכן חכמה, משחקיות, אנימציות ומסע לקוח הדרגתי וברור.",
        },
      ],
      [
        {
          text: "בסוף התהליך, הלקוחות שלי מצוידים בכלים דיגיטליים שעוזרים לקהל שלהם לעשות יותר עם פחות מאמץ, ומשיגים את המטרות העסקיות שלהם.",
          strong: true,
        },
      ],
    ] satisfies AboutSegment[][],
    credentials: [
      {
        value: "B.A",
        label: "בטכנולוגיות למידה | H.I.T",
        detail: "UI/UX · עיצוב אינטראקטיבי · גיימיפיקציה של מוצרים",
      },
      { value: "7+", label: "שנות ניסיון בפיתוח Front-End" },
      {
        value: "400K+",
        label: "משתמשים במוצרים שבניתי או לקחתי בהם חלק",
      },
    ] satisfies AboutCredential[],
    portrait: {
      src: "/images/mor-laptop-mono-lime.webp",
      width: 900,
      height: 1725,
      alt: "מור",
    },
  },
  aboutGallery: {
    label: "גלריה",
    images: [
      {
        src: "/images/about-gallery/1.webp",
        alt: "מסך שאלון עם איור כלב ואפשרויות לבחירה",
      },
      {
        src: "/images/about-gallery/2.webp",
        alt: "הדמיית אפליקציה לניהול הרגלים בריאים בטלפון",
      },
      {
        src: "/images/about-gallery/3.webp",
        alt: "עמוד מוצר גרביים על רקע סגול",
      },
      {
        src: "/images/about-gallery/4.webp",
        alt: "עמוד חנויות למותג גרביים עם מפת ישראל",
      },
      {
        src: "/images/about-gallery/5.webp",
        alt: "אתר Hatchly עם הדמיית לוח משימות על רקע נוף",
      },
      {
        src: "/images/about-gallery/6.webp",
        alt: "אתר Unicar עם חד קרן ומכונית בעננים",
      },
      {
        src: "/images/about-gallery/7.webp",
        alt: "אתר DR. RAW עם טיפוגרפיה שחורה ותמונה אדומה",
      },
      {
        src: "/images/about-gallery/8.webp",
        alt: "עיצוב עמוד ויקיפדיה בעברית עם כרטיסי ערכים",
      },
      {
        src: "/images/about-gallery/9.webp",
        alt: "מחשבון חיסכון של Hatchly על רקע סגול",
      },
      {
        src: "/images/about-gallery/10.webp",
        alt: "מסך תכונות למערכת ניהול משימות עם תרשים מרכזי",
      },
    ],
  },
  testimonials: {
    heading: "המלצות מלקוחות",
    indexLabel: "בחירת המלצה",
    previous: "ההמלצה הקודמת",
    next: "ההמלצה הבאה",
    readMore: "להמשך קריאה",
    readLess: "סגירה",
    // Quotes are verbatim from the owner; unknown attribution stays marked.
    items: [
      {
        id: "elementor",
        headline: "לכל אחד שמחפש שילוב של יכולת טכנית וחשיבה יצירתית.",
        body: [
          "עבדתי עם מור על פיתוח חוויות אינטראקטיביות ומורכבות באלמנטור, באמצעות אנג'י, פלאגין ה-AI שלנו. מור הביאה שילוב של מקצועיות, יצירתיות ויוזמה: היא הבינה במהירות את הצרכים, הציעה פתרונות משלה ולא חיכתה להנחיות מפורטות. העבודה שהפיקה הייתה ברמה גבוהה ותרמה ישירות לאיכות התוצר הסופי. מומלצת בחום לכל אחד שמחפש שילוב של יכולת טכנית וחשיבה יצירתית.",
        ],
        name: "גבריאלה לסטר",
        role: "Product Marketing Director באלמנטור",
        image: {
          src: "/images/testimonials/elementor-logo.webp",
          kind: "mark",
        },
      },
      {
        id: "tal-lev",
        headline:
          "אני כל כך שמחה בתוצאה, האתר משקף אותי באמת והרחיב את כמות הפניות",
        body: [
          "זכיתי במור מהרגע הראשון התהליך איתה היה קליל, מהיר ונעים, מלא בהקשבה אמיתית, סקרנות והבנה עמוקה של מי אני ומה אני רוצה לשדר.",
          "אני רופאה סינית, וכשהתחלנו לעבוד יחד עוד הייתי סטודנטית. מור ליוותה אותי ברגישות ובמקצועיות, עזרה לי לחדד את קהל היעד והמסר שלי, ויחד בנינו מרחב דיגיטלי שמספר את הסיפור שלי בצורה הכי מדויקת.",
          "מור מוכשרת ועם ראש סופר יצירתי, אפילו יצרה באתר תוכן אינטראקטיבי על נקודות דיקור, שהיה בדיוק כמו שחלמתי והביא הרבה התעניינות של לקוחותי וסקרנות להגיע לטיפול.",
          "התהליך כולו היה פתוח, זורם ושיתופי בכל שלבי הסקיצה והבניה, היא תמיד שיתפה, הקשיבה, והתייחסה לכל פרט באהבה ובדיוק.",
          "אני כל כך שמחה בתוצאה, האתר משקף אותי באמת והרחיב את כמות הפניות והמטופלים שלי כיום בקליניקה.",
        ],
        name: "טל לב",
        role: "מטפלת סינית מוסמכת",
        image: {
          src: "/images/testimonials/tal-lev.webp",
          kind: "portrait",
          objectPosition: "50% 35%",
        },
      },
      {
        id: "elbi-ben-shimol",
        headline: "העבודה עם מור הייתה ברמה אחרת!",
        body: [
          "פניתי למור לשדרוג של דף נחיתה ומעבר למקצועיות המרשימה שהיא הפגינה, היא עבדה במהירות שיא, והתוצאה פשוט וואוו! בקיצור, ממליץ מאוד!",
        ],
        name: "אלבי בן שימול",
        role: "ביטוחים ופיננסים",
        image: { src: "/images/testimonials/elbi-logo.webp", kind: "logo" },
      },
      {
        id: "shay-goren",
        headline:
          "בזכותה האתר יצא מדויק, מושך ועם טאץ' אישי – בדיוק כמו שרציתי.",
        body: [
          "היה לי תענוג אמיתי לעבוד עם מור על בניית ועיצוב אתר התדמית שלי! מהרגע הראשון היא קלטה בדיוק את הסגנון שחיפשתי, ידעה לשלב מקצועיות עם יצירתיות, ותמיד הייתה זמינה וסבלנית לכל שינוי או שאלה. בזכותה האתר יצא מדויק, מושך ועם טאץ' אישי – בדיוק כמו שרציתי. ממליצה בחום לכל מי שמחפש ליווי מקצועי ונעים בתהליך הקמת אתר!",
        ],
        name: "שי גורן",
        role: "בעלת עסק לסדנאות",
        image: {
          src: "/images/testimonials/shay-goren.webp",
          kind: "portrait",
          objectPosition: "50% 40%",
        },
      },
      {
        id: "rona-even",
        headline: "מור עיצבה מחדש את דף הבית באתר שלי, ואני ממש מרוצה!",
        body: [
          "מור עיצבה מחדש את דף הבית באתר שלי, ואני ממש מרוצה! שירותית, מהירה ומדויקת, עם הקשבה למה שאני צריכה ועיצוב שמתאים לי ולעסק שלי. ממליצה בחום 💜",
        ],
        name: "רונה אבן",
        role: "אמא חוזרת לג׳ינס",
        image: {
          src: "/images/testimonials/rona-even-logo.webp",
          kind: "logo",
        },
      },
    ] satisfies Testimonial[],
  },
  gettingStarted: {
    heading: "איך מתחילים לעבוד יחד",
    // Facts are owner-supplied (2026-10-10). The step 2 and 3 lines and the
    // shortened step 2 title are drafts awaiting owner approval.
    steps: [
      {
        icon: "phone",
        title: "שיחת טלפון קצרה",
        detail: "כמה שאלות פשוטות, כדי לראות אם יש התאמה ראשונית לצרכים שלכם.",
      },
      {
        icon: "video",
        title: "שיחת אפיון",
        detail:
          "שיחה בזום, ללא עלות, שבה נכיר לעומק את הפרויקט, המטרות והצרכים שלכם.",
      },
      {
        icon: "quote",
        title: "קבלת הצעת מחיר",
        detail: "הצעה מסודרת שמבוססת על מה שאפיינו יחד, בתוקף ל־14 ימי עבודה.",
      },
    ] satisfies GettingStartedStep[],
  },
  // Transition between Getting started and the FAQ. The quote stays in its
  // original English.
  designQuote: {
    label: "ציטוט",
    text: "Design is the interface between technology and people.",
    author: "Don Norman",
  },
  faq: {
    heading: "שאלות ותשובות",
    description: [
      "על התהליך ועל העבודה יחד.",
      "נשארה שאלה? אני כאן בשבילכם.",
    ],
    aiLabel: "לשאול את ",
    aiName: "moriz.ai",
    whatsappLabel: "שנדבר בוואטסאפ?",
    questions: [
      "שאלה 1 — להשלמה",
      "שאלה 2 — להשלמה",
      "שאלה 3 — להשלמה",
      "שאלה 4 — להשלמה",
      "שאלה 5 — להשלמה",
      "שאלה 6 — להשלמה",
      "שאלה 7 — להשלמה",
      "שאלה 8 — להשלמה",
    ],
    answerPlaceholder: "תשובה — להשלמה",
  },
  // Answers come only from the ai_knowledge table in Supabase.
  askAi: {
    title: "moriz.ai",
    greeting: "היי, אני moriz.ai",
    intro: "אני מעדיפה שתדברו איתי, אבל ה-AI שלי ממש התעקש להשתתף",
    label: "השאלה שלך",
    // Typed out letter by letter in the empty field.
    typingHint: "אפשר לשאול כל שאלה…",
    suggestionsLabel: "שאלות מוצעות",
    // Each one maps to a live knowledge row: prices, process, services, fit.
    suggestions: [
      "כמה עולה אתר?",
      "איך נראה תהליך העבודה?",
      "אילו שירותים את מציעה?",
      "למי זה מתאים?",
    ],
    thread: "השיחה עם moriz.ai",
    send: "שליחה",
    loading: "רגע, בודקת…",
    fallback:
      "המידע הזה עדיין לא נמצא אצלי 🙂\nאפשר לדבר איתי ישירות בוואטסאפ.",
    whatsapp: "דברו איתי בוואטסאפ",
    error: "משהו השתבש ולא הצלחתי לענות כרגע. אפשר לנסות שוב בעוד רגע.",
    retry: "לנסות שוב",
    reset: "שיחה חדשה",
    close: "סגירה",
  },
  contact: {
    heading: "בואו נדבר",
    description: "ספרו לי בקצרה על הפרויקט שלכם.",
    fields: {
      name: "מה השם שלך?",
      phone: "מה המספר שלך?",
      whatsapp: "עדיף בוואטסאפ",
      message: "כמה מילים",
      optional: "(לא חובה)",
    },
    errors: {
      name: "אפשר גם כינוי שאוהבים",
      phone: "רגע, משהו לא בסדר במספר.",
    },
    submit: "שליחת הודעה",
    sending: "שולחים את ההודעה...",
    sent: "ההודעה נשלחה. אחזור אליכם בהקדם.",
    sendError:
      "לא הצלחתי לשלוח כרגע. נסו שוב או פנו אליי באחד הקישורים למטה.",
    details: {
      label: "דרכים נוספות ליצור קשר",
      email: "morzavi1@gmail.com",
      phone: "052-293-7174",
      phoneHref: "tel:+972522937174",
      whatsapp: "WhatsApp",
    },
    noScript:
      "כדי להשתמש בטופס יש להפעיל JavaScript. אפשר לפנות ישירות בקישורים שמתחתיו.",
  },
  footer: {
    information: "פרטי הפוטר והקישורים — להשלמה",
    label: "קישורי פוטר",
    // Section anchors resolve on the homepage; page paths get the locale prefix.
    columns: [
      {
        heading: "ניווט",
        links: [
          { label: "פרויקטים", href: "#projects" },
          { label: "קצת עליי", href: "#about" },
          { label: "איך מתחילים", href: "#getting-started" },
          { label: "שאלות ותשובות", href: "#faq" },
          { label: "יצירת קשר", href: "#contact" },
        ],
      },
      {
        heading: "עמודים",
        links: [
          { label: "עמוד הבית", href: "/" },
          { label: "כל הפרויקטים", href: "/projects" },
        ],
      },
    ],
    socialsHeading: "עקבו",
    socials: [
      {
        network: "instagram" as const,
        label: "אינסטגרם",
        href: "https://www.instagram.com/moriz_studio/",
      },
      {
        network: "linkedin" as const,
        label: "לינקדאין",
        href: "https://www.linkedin.com/in/mor-zeevi",
      },
    ],
    // TODO: owner to supply legal pages. An empty href renders as a placeholder, not a link.
    legal: [
      { label: "פרטיות", href: "" },
      { label: "תנאי שימוש", href: "" },
      { label: "הצהרת נגישות", href: "" },
    ],
    copyright: "moriz.studio",
    wordmark: [{ text: "moriz", bold: true }],
  },
  floatingActions: {
    label: "פעולות מהירות",
    whatsapp: "שנדבר בוואטסאפ?",
    ai: "Ask moriz.ai",
    // Starts with the visible label so voice control can match it.
    aiLabel: "Ask moriz.ai – שאלו אותי כל שאלה",
  },
};
