import type { SiteContent } from "@/i18n/dictionaries";

// English counterpart of `he.ts`: same keys, same array lengths, same hrefs,
// ids and image paths. Marketing English drafted from the Hebrew copy, pending
// owner review. Testimonials and the privacy policy are faithful translations.
export const en = {
  metadata: {
    title: "UX, Design and Development of Digital Systems | Moriz Studio",
    description:
      "Research-based UX, design and development of web systems, apps and interactive tools. From idea to a digital product that works.",
  },
  studioName: "Moriz Studio",
  theme: {
    switchToDark: "Switch to dark mode",
    switchToLight: "Switch to light mode",
  },
  fontPreview: {
    title: "Font comparison",
    introduction:
      "Five fonts set with the hero text. Edit the heading and change the size to compare.",
    back: "Back to home",
    textLabel: "Sample text",
    sizeLabel: "Heading size",
    reset: "Reset",
  },
  skipToContent: "Skip to content",
  navigation: {
    label: "Main navigation",
    openLabel: "Open menu",
    closeLabel: "Close menu",
    desktopLinks: [
      { label: "Projects", href: "#projects" },
      { label: "About me", href: "#about" },
      { label: "Services", href: "/services" },
      { label: "Getting started", href: "#getting-started" },
      { label: "Articles", href: "/articles" },
      { label: "FAQ", href: "#faq" },
      { label: "Digital audit", href: "/digital-audit" },
    ],
    contactLink: { label: "Let's talk", href: "#contact" },
    links: [
      { label: "Projects", href: "#projects" },
      { label: "About me", href: "#about" },
      { label: "Digital audit", href: "/digital-audit" },
      { label: "Contact", href: "#contact" },
    ],
    // On an English page LanguageLink reads the `he` entry: the visible text
    // is `shortLabel`, and `label` becomes the link's aria-label and title.
    languages: {
      he: {
        label: "עברית",
        shortLabel: "HE",
        unavailableLabel: "Hebrew — coming soon",
      },
      en: {
        label: "English",
        shortLabel: "EN",
        unavailableLabel: "English — coming soon",
      },
    },
  },
  hero: {
    heading: {
      start:
        "I solve business problems through UX, design and development of systems, websites and AI tools",
      end: "From problem to working product",
      // The headline's two lines: the first in outline, the second filled.
      endParts: ["From problem to", "working product"],
      label:
        "From problem to working product. I solve business problems through UX, design and development of systems, websites and AI tools",
    },
    introduction: "Nice to meet you, I'm Mor",
    // Desktop portrait: her hello, set vertically along the page edge behind
    // her.
    note: "Nice to meet you, I'm Mor",
    // structured-data.ts and llms.ts read the job title after the "—".
    portraitAlt: "Mor — studio owner",
    description: {
      emphasis: "Research wins arguments.",
      body: "I start from research, not assumptions, so you invest only in what your users actually need.",
    },
    projectsLink: "See my projects",
    scrollLabel: "Scroll to explore",
    video: {
      label: "Showreel: selected work",
      pause: "Pause video",
      resume: "Play video",
    },
  },
  diagnosticBanner: {
    headingStart: "Not sure",
    headingEnd: "what your business needs?",
    introduction: "A website, a system or an AI tool?",
    emphasis: "7 questions,",
    description: "and a written recommendation at the end.",
    action: "Start the audit",
    actionMobile: "Start the audit",
  },
  logoCarousel: {
    label: "Logos",
    placeholder: "Logo — to be added",
    pause: "Pause the logo animation",
    resume: "Play the logo animation",
  },
  advantages: {
    heading: "Three advantages",
    themes: [
      "Research-based UX and design",
      "Interactive, engaging experiences",
      "Development without limits",
    ],
    experience: {
      description:
        "A website or system should speak for itself. If it needs explaining, something isn't working. That's why I design interfaces people understand without a walkthrough.",
    },
    development: {
      description:
        "I turn the UX plan and design into a working digital product, with solutions built around your needs, down to the smallest detail. And the code stays yours.",
      infinity: {
        symbol: "Infinity symbol",
        dot: "Move the dot along the infinity symbol",
      },
    },
    party: {
      prompt: "Let’s party?",
      no: "No",
      yes: "Yes",
      normal: "NORMAL",
      party: "PARTY",
      label: "Party mode",
      off: "Back to normal mode",
      preparing: "Party mode is on",
      active: "The site is in party mode",
      unavailable: "Party mode couldn't load. Please try again.",
    },
    research: {
      description:
        "Together we research your problem, define it and weigh the possible solutions, from academic research to your competitors. That's how we build the right thing from the start.",
      termsLabel: "Terms from research and user experience design",
      terms: [
        "User research",
        "UI",
        "UX",
        "User journey",
        "Usability testing",
        "Competitor research",
        "Information architecture",
        "Design System",
      ],
    },
  },
  projects: {
    heading: "Projects",
    allHeading: "All projects",
    allLink: "View all projects",
    homeLink: "Back to home",
    visualLabel: "Screens / visuals — to be added",
    answerPlaceholder: "Answer — to be added",
    detailsHeading: "About the project",
    projectLink: "Full project",
    viewProject: "View project",
    comingSoon: "Coming soon",
    backLink: "Back to projects",
    archive: {
      heading: "Selected work",
      description:
        "Learning systems, web apps, interactive tools and custom products. UX, design and development from the studio.",
      layoutLabel: "Project layout",
      layouts: { standard: "Grid", compact: "Compact", editorial: "Magazine" },
      results: "Showing {count} projects",
      resultOne: "Showing 1 project",
      resultNone: "No projects to show",
      showAll: "Show all projects",
      cta: {
        heading: "Could your project be next?",
        body: "Tell me what you want to build, and we'll work out together how to do it right.",
        link: "Let's talk",
      },
    },
    caseStudy: {
      additionalInfo: "More info",
      gallery: "Project images",
      client: "Client",
      year: "Year",
      services: "Services",
      openImage: "Enlarge image",
      viewer: "Project image viewer",
      close: "Close image",
      previous: "Previous image",
      next: "Next image",
      imageError: "The image couldn't load.",
      openOriginal: "Open the original image",
      video: "Project video",
    },
    // Unused placeholder data (projects-section.tsx omits `items`); kept so
    // the shape matches he.ts.
    items: [
      {
        slug: "practice-ai",
        title: "practice ai learning system",
        description: "A learning system for practice ai.",
        image: null,
        details: [
          {
            id: "question-1",
            question: "Question 1 — to be added",
            answer: null,
          },
          {
            id: "question-2",
            question: "Question 2 — to be added",
            answer: null,
          },
          {
            id: "question-3",
            question: "Question 3 — to be added",
            answer: null,
          },
          {
            id: "question-4",
            question: "Question 4 — to be added",
            answer: null,
          },
        ],
      },
      {
        slug: "haaretz",
        title: "Haaretz — Wordal",
        description: "A project for the Haaretz newspaper.",
        image: null,
        details: [
          {
            id: "question-1",
            question: "Question 1 — to be added",
            answer: null,
          },
          {
            id: "question-2",
            question: "Question 2 — to be added",
            answer: null,
          },
          {
            id: "question-3",
            question: "Question 3 — to be added",
            answer: null,
          },
          {
            id: "question-4",
            question: "Question 4 — to be added",
            answer: null,
          },
        ],
      },
      {
        slug: "chabad-club",
        title: "Chabad Club",
        description: null,
        image: null,
        details: [
          {
            id: "question-1",
            question: "Question 1 — to be added",
            answer: null,
          },
          {
            id: "question-2",
            question: "Question 2 — to be added",
            answer: null,
          },
          {
            id: "question-3",
            question: "Question 3 — to be added",
            answer: null,
          },
          {
            id: "question-4",
            question: "Question 4 — to be added",
            answer: null,
          },
        ],
      },
    ],
  },
  about: {
    heading: "About me",
    // `strong` marks the bold phrases, as in he.ts.
    paragraphs: [
      [{ text: "Nice to meet you, I'm Mor Zeevi." }],
      [
        {
          text: "If you've put a lot into developing your product or service, and you know that what stands between you and success is a website or a smart system, ",
        },
        { text: "you've come to the right place.", strong: true },
      ],
      [
        { text: "I have " },
        {
          text: "a degree in learning technologies from H.I.T and years of development experience",
          strong: true,
        },
        { text: ", and from them I've built a process grounded in " },
        { text: "research.", strong: true },
        {
          text: " I create web apps, custom systems, AI solutions for business and interactive tools (like calculators and infographics). Each one comes with smart content structure, playful touches, animation and a clear customer journey.",
        },
      ],
      [
        {
          text: "By the end of the process, you'll have digital tools that help your audience do more with less effort and move you toward your business goals.",
          strong: true,
        },
      ],
    ],
    credentials: [
      {
        value: "B.A",
        label: "in Learning Technologies | H.I.T",
        detail: "UI/UX · Interactive design · Product gamification",
      },
      { value: "7+", label: "years of Front-End development experience" },
      {
        value: "400K+",
        label: "users of products I built or helped build",
      },
    ],
    portrait: {
      src: "/images/mor-laptop-mono-lime.webp",
      width: 900,
      height: 1725,
      alt: "Mor",
    },
  },
  aboutGallery: {
    label: "Gallery",
    // Same order as he.ts: AboutGallery deals the list out by position.
    images: [
      {
        src: "/images/about-gallery/11.webp",
        alt: "Bucket Cult website with bucket hats and friends in a graffiti alley",
      },
      {
        src: "/images/about-gallery/12.webp",
        alt: "E-bike website with the headline Chase the Horizon and specs in lime yellow",
      },
      {
        src: "/images/about-gallery/13.webp",
        alt: "LUCID-O digital art website with a white headline on a black background",
      },
      {
        src: "/images/about-gallery/14.webp",
        alt: "RAMANIA website with an illustration of a ramen bowl on a red circle",
      },
      {
        src: "/images/about-gallery/15.webp",
        alt: "Urban architecture website with a white building covered in greenery",
      },
      {
        src: "/images/about-gallery/engaging-page.png",
        alt: "Engaging Page with a pale flower and white typography on a black background",
      },
      {
        src: "/images/about-gallery/chozrim.jpg",
        alt: "Chozrim LaShigra (Back to Routine) website with large black-and-white typography",
      },
      {
        src: "/images/about-gallery/1.webp",
        alt: "Questionnaire screen with a dog illustration and answer options",
      },
      {
        src: "/images/about-gallery/2.webp",
        alt: "Healthy-habits app shown on a phone",
      },
      {
        src: "/images/about-gallery/3.webp",
        alt: "Sock product page on a purple background",
      },
      {
        src: "/images/about-gallery/4.webp",
        alt: "Store locator page for a sock brand with a map of Israel",
      },
      {
        src: "/images/about-gallery/5.webp",
        alt: "Hatchly website with a task board mockup over a landscape",
      },
      {
        src: "/images/about-gallery/6.webp",
        alt: "Unicar website with a unicorn and a car in the clouds",
      },
      {
        src: "/images/about-gallery/7.webp",
        alt: "DR. RAW website with black typography and a red photo",
      },
      {
        src: "/images/about-gallery/8.webp",
        alt: "Hebrew Wikipedia page redesign with entry cards",
      },
      {
        src: "/images/about-gallery/9.webp",
        alt: "Hatchly savings calculator on a purple background",
      },
      {
        src: "/images/about-gallery/10.webp",
        alt: "Feature screen for a task management system with a central diagram",
      },
    ],
  },
  testimonials: {
    heading: "What people who worked with me say",
    indexLabel: "Choose a testimonial",
    previous: "Previous testimonial",
    next: "Next testimonial",
    readMore: "Read more",
    readLess: "Show less",
    videoLabel: "Video testimonial",
    // Faithful translations of the clients' Hebrew quotes.
    items: [
      {
        id: "elementor",
        headline:
          "For anyone looking for a mix of technical skill and creative thinking.",
        body: [
          "I worked with Mor on developing complex interactive experiences in Elementor, using Angie, our AI plugin. Mor brought a mix of professionalism, creativity and initiative: she quickly understood the needs, proposed her own solutions and didn't wait for detailed instructions. The work she delivered was of a high standard and contributed directly to the quality of the final product. Warmly recommended for anyone looking for a mix of technical skill and creative thinking.",
        ],
        name: "Gabriela Lester",
        role: "Product Marketing Director, Elementor",
        project: "Interactive experience development",
        image: {
          src: "/images/testimonials/elementor-logo.webp",
          kind: "mark",
        },
      },
      {
        id: "asher-morgenstern",
        headline: null,
        body: [],
        video: {
          src: "/videos/testimonial-asher-morgenstern.mp4",
          poster: "/videos/testimonial-asher-morgenstern-poster.webp",
        },
        name: "Asher Morgenstern",
        role: "CTO, AI at Eye Level",
        project: "UX and design of a learning system · Practical AI",
        image: {
          src: "/images/testimonials/asher-morgenstern.webp",
          kind: "portrait",
        },
      },
      {
        id: "elbi-ben-shimol",
        headline: "Working with Mor was on another level!",
        body: [
          "I came to Mor to upgrade a landing page, and beyond the impressive professionalism she showed, she worked incredibly fast, and the result was simply wow! In short, highly recommended!",
        ],
        name: "Elbi Ben Shimol",
        role: "Insurance and finance",
        project: "Landing page",
        image: { src: "/images/testimonials/elbi-logo.webp", kind: "logo" },
      },
      {
        id: "rona-even",
        headline:
          "Mor redesigned the homepage of my website, and I'm really happy with it!",
        body: [
          "Mor redesigned the homepage of my website, and I'm really happy with it! Service-minded, fast and precise, she listened to what I needed and created a design that suits me and my business. Warmly recommended 💜",
        ],
        name: "Rona Even",
        role: "Mom Back in Jeans",
        project: "Homepage design",
        image: {
          src: "/images/testimonials/rona-even-logo.webp",
          kind: "logo",
        },
      },
      {
        id: "tal-lev",
        headline:
          "I'm so happy with the result. The site truly reflects me and has brought in more inquiries",
        body: [
          "I was lucky to find Mor. From the very first moment, the process with her was easy, fast and pleasant, full of real listening, curiosity and a deep understanding of who I am and what I want to convey.",
          "I'm a Chinese medicine practitioner, and when we started working together I was still a student. Mor guided me with sensitivity and professionalism, helped me sharpen my target audience and my message, and together we built a digital space that tells my story as accurately as possible.",
          "Mor is talented and super creative. She even created interactive content on the site about acupuncture points, which was exactly what I had dreamed of and drew a lot of interest from my clients and curiosity about coming in for treatment.",
          "The whole process was open, flowing and collaborative through every stage of sketching and building. She always shared, listened, and treated every detail with love and precision.",
          "I'm so happy with the result. The site truly reflects me and has increased the number of inquiries and patients at my clinic today.",
        ],
        name: "Tal Lev",
        role: "Certified Chinese medicine practitioner",
        project: "Clinic website",
        image: {
          src: "/images/testimonials/tal-lev.webp",
          kind: "portrait",
          objectPosition: "50% 35%",
        },
      },
      {
        id: "shay-goren",
        headline:
          "Thanks to her, the site came out precise, appealing and with a personal touch, exactly as I wanted.",
        body: [
          "It was a real pleasure working with Mor on building and designing my brand website! From the very first moment she grasped exactly the style I was looking for, combined professionalism with creativity, and was always available and patient with every change or question. Thanks to her, the site came out precise, appealing and with a personal touch, exactly as I wanted. Warmly recommended to anyone looking for professional, pleasant guidance through building a website!",
        ],
        name: "Shay Goren",
        role: "Workshop business owner",
        project: "Business website",
        image: {
          src: "/images/testimonials/shay-goren.webp",
          kind: "portrait",
          objectPosition: "50% 40%",
        },
      },
    ],
  },
  gettingStarted: {
    heading: "How we get started",
    steps: [
      {
        image: "/images/getting-started-phone.webp",
        title: "An intro call, 10 minutes",
        detail:
          "A few questions to understand what you need. If I'm not the right address, I'll say so and point you to someone who is.",
      },
      {
        image: "/images/getting-started-call.webp",
        title: "A discovery call",
        detail:
          "A free Zoom call where we get to know your project, goals and needs in depth.",
      },
      {
        image: "/images/getting-started-quote.webp",
        title: "You get a quote",
        detail:
          "A clear proposal based on what we defined together, valid for 14 business days.",
      },
    ],
  },
  // The quote stays in its original English.
  designQuote: {
    label: "Quote",
    text: "Design is the interface between technology and people.",
    author: "Don Norman",
  },
  faq: {
    heading: "Questions & answers",
    description: [
      "About the process and working together.",
      "Still have a question? I'm here for you.",
    ],
    // Rendered directly before the `aiName`; keep the trailing space.
    aiLabel: "Ask ",
    aiName: "moriz.ai",
    whatsappLabel: "Chat on WhatsApp?",
    // Each answer string is one paragraph.
    questions: [
      {
        question: "Do you offer UX, design and development?",
        answer: [
          "Yes. In the UX and design phase you get a fully responsive design, together with an interactive prototype that shows how the site behaves in its main scenarios, before a single line of code is written. In development I write clean code and make sure every pixel sits exactly where it should.",
        ],
      },
      {
        question: "Do you work alone?",
        answer: [
          "On every project I work with you myself, from planning to launch. On large, complex projects I bring in professionals I know and trust, such as an information security expert or a brand designer, and build a team that fits your needs exactly.",
          "I manage all of it, so you have one point of contact. And if you'd like to be more involved, the door is always open.",
        ],
      },
      {
        question: "How much does a project cost?",
        answer: [
          "It depends on scope. What sets the price: how many types of users there are, how many processes the system manages, and whether it needs to connect to existing systems.",
          "In a 10-minute call I can give you an initial estimate. And if it turns out I'm not the right fit for you, I'll gladly refer you to a colleague I trust.",
        ],
      },
      {
        question: "How long does a project take?",
        answer: [
          "The timeline depends on the project's scope and complexity. At the start we set a schedule together with clear milestones, so you always know where we stand. Part of the pace is up to you too: ready content and quick feedback shorten the way.",
        ],
      },
      {
        question: "Do you work with WordPress or Wix?",
        answer: [
          "No. I write clean code built specifically for you, which is what makes a fast site possible, without the limits of a ready-made template.",
          "For every project I set up an easy-to-use content management system, so you stay in control.",
        ],
      },
      {
        question: "Who owns the code and the rights?",
        answer: [
          "You do, in full. The code, the domain and the content are yours, and you don't depend on me. If you ever want to work with another developer, they'll get well-organized code that's easy to build on.",
        ],
      },
      {
        question: "Is there a warranty after launch?",
        answer: [
          "Yes. Every project comes with a 3-month warranty for fixing significant bugs (not including design changes or new features).",
        ],
      },
      {
        question: "Do you keep maintaining the system after launch?",
        answer: [
          "Yes. For existing clients I offer discounted monthly retainer packages for maintenance, updates and ongoing improvements. And if you only need a one-off change, you can always reach out on an hourly basis.",
        ],
      },
      {
        question:
          "Everyone's talking about AI. How do we bring it into our business?",
        answer: [
          "AI is a tool, and it's worth using exactly where it saves time. We'll go through the recurring processes in your business together and see which tools fit you, from existing ones to small tools I build just for you. Sometimes one such tool saves hours every week and frees up your time for what really matters.",
        ],
      },
      {
        question:
          "We already have a system. Can it be improved instead of rebuilt?",
        answer: [
          "Yes. Often the problem isn't the whole system but a few screens or a single process. I start by checking where users get stuck, and suggest what's worth fixing, what to redesign and what to leave as it is.",
        ],
      },
    ],
  },
  // Answers come only from the ai_knowledge table in Supabase.
  askAi: {
    title: "moriz.ai",
    greeting: "Hi, I'm moriz.ai",
    intro: "I'd rather you talk to me, but my AI really insisted on joining in",
    label: "Your question",
    // Typed out letter by letter in the empty field.
    typingHint: "Ask me anything…",
    suggestionsLabel: "Suggested questions",
    // The same four questions as he.ts; each maps to a live knowledge row:
    // prices, process, services, fit.
    suggestions: [
      "How much does a project cost?",
      "What does the work process look like?",
      "What services do you offer?",
      "Who is this for?",
    ],
    thread: "Conversation with moriz.ai",
    send: "Send",
    loading: "One moment, checking…",
    fallback:
      "That one is better answered by Mor herself.\nYou can write to her directly on WhatsApp.",
    whatsapp: "Talk to me on WhatsApp",
    error:
      "Something went wrong and I couldn't answer right now. Please try again in a moment.",
    retry: "Try again",
    reset: "New conversation",
    close: "Close",
  },
  contact: {
    heading: "Let's talk about your project",
    description: "A first 10-minute call, no commitment.",
    promise: "I'll get back to you within one business day.",
    phoneHint: "Only so I can get back to you.",
    interests: "What is it about?",
    fields: {
      name: "What's your name?",
      phone: "What's your number?",
      whatsapp: "WhatsApp preferred",
      message: "What do you want to build, or what isn't working today?",
      optional: "(optional)",
    },
    errors: {
      name: "A nickname you like works too",
      phone: "Hmm, something's off with that number.",
    },
    submit: "Mor, let's talk",
    sending: "Sending your message...",
    sent: "Got it, thank you. I'll get back to you within one business day, on WhatsApp or by phone.",
    sendError:
      "I couldn't send it just now. Try again, or reach me through one of the links below.",
    details: {
      label: "Other ways to get in touch",
      email: "morzavi1@gmail.com",
      phone: "052-293-7174",
      phoneHref: "tel:+972522937174",
      whatsapp: "WhatsApp",
    },
    noScript:
      "The form needs JavaScript to work. You can also reach me directly through the links below it.",
  },
  footer: {
    information: "Footer details and links — to be added",
    label: "Footer links",
    // Section anchors resolve on the homepage; page paths get the locale prefix.
    columns: [
      {
        heading: "Navigation",
        links: [
          { label: "Projects", href: "#projects" },
          { label: "About me", href: "#about" },
          { label: "Getting started", href: "#getting-started" },
          { label: "FAQ", href: "#faq" },
          { label: "Contact", href: "#contact" },
        ],
      },
      {
        heading: "Pages",
        links: [
          { label: "Home", href: "/" },
          { label: "All projects", href: "/projects" },
          { label: "Articles", href: "/articles" },
          { label: "Services", href: "/services" },
        ],
      },
    ],
    socialsHeading: "Follow",
    socials: [
      {
        network: "instagram" as const,
        label: "Instagram",
        href: "https://www.instagram.com/moriz_studio/",
      },
      {
        network: "linkedin" as const,
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/mor-zeevi",
      },
    ],
    legal: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms of use", href: "/terms-of-use" },
      { label: "Accessibility statement", href: "/accessibility" },
    ],
    copyright: "moriz.studio",
    wordmark: [{ text: "moriz", bold: true }],
  },
  // Faithful translation of the Hebrew privacy policy (18.07.2026).
  privacyPolicy: {
    title: "Privacy Policy",
    // ISO date for the sitemap. The sentence below is the visible line.
    updatedOn: "2026-07-18",
    intro:
      "At Moriz Studio, privacy is part of the service. This policy explains what information is collected on the website and in the digital audit, why we use it, who it may be shared with, and what choices you have.",
    lastUpdated: "Last updated: July 18, 2026",
    backToHome: "Back to home",
    contactLabel: "Privacy inquiries:",
    sections: [
      {
        title: "Who is responsible for the information",
        paragraphs: [
          "Moriz Studio is the controller of the personal information described in this policy. The policy applies to the Moriz Studio website, the contact form and the digital audit tool.",
        ],
      },
      {
        title: "What information is collected",
        paragraphs: [
          "You can browse the main parts of the website without giving us any details directly. When you choose to fill out a form or use the audit, we may collect the following information:",
        ],
        bullets: [
          "Contact details you provide, such as your full name, phone number, email address, business name and a link to a website or page.",
          "The content of your inquiry, project details and the information you asked us to review.",
          "Questionnaire answers, the audit result, and scores and recommendations generated from your answers.",
          "Session ID, questionnaire progress, usage events, page URL, referral source and UTM parameters.",
          "Technical and usage information that hosting and analytics providers may collect, such as IP address, device and browser type, pages viewed and interactions on the website.",
        ],
      },
      {
        title: "Why we use the information",
        paragraphs: [
          "We use the information only for purposes related to running the studio and the tools on the website.",
        ],
        bullets: [
          "To respond to your inquiry, contact you and schedule a call or a professional review.",
          "To run the audit, save your progress, calculate a result and show tailored recommendations.",
          "To manage inquiries and leads, improve the service, understand usage and errors, and protect the website from misuse.",
          "To comply with legal requirements, handle disputes and protect the rights of Moriz Studio and its users.",
        ],
      },
      {
        title: "Automated audit and artificial intelligence",
        paragraphs: [
          "The audit result is calculated automatically from your answers. When the personalization service is active, some of your answers, your business details and the audit result may be sent to Moonshot AI to write a tailored explanation. To prepare an internal review, your name, business name, link and professional notes added by Mor may also be sent. The result is meant as general guidance and is not a legal, financial or other decision with a significant effect on you.",
        ],
      },
      {
        title: "Providers and external services",
        paragraphs: [
          "To run the website we rely on providers that act on our behalf or provide an independent service: Vercel for hosting, Supabase for storing audit data, an SMTP provider and Resend for sending messages, Moonshot AI for personalization and analysis support, Google Analytics and Microsoft Clarity for measuring usage, and Calendly for scheduling meetings. If you choose to open a link to WhatsApp, a social network or another external service, your use of that service is also subject to its own policy.",
          "These providers may process or store information outside Israel, according to their infrastructure and terms. We share with them only the information needed to operate the service, and we do not sell personal information to third parties.",
        ],
      },
      {
        title: "Local storage, analytics and similar technologies",
        paragraphs: [
          "The audit uses localStorage in your browser to save a session ID, your answers, the current step and information about how you arrived, so you can continue after refreshing or returning to the website. Analytics and scheduling services may use cookies or similar technologies according to their own settings. You can delete local data or limit cookies through your browser, but some features may stop working properly.",
        ],
      },
      {
        title: "Disclosure, retention and security",
        paragraphs: [
          "We will not pass personal information to others except to providers needed to operate the service, at your request, in the event of a change in the business structure, or when there is a legal obligation or a need to protect rights and safety.",
          "Information is kept only as long as it is needed to respond, provide the service, manage the business, improve the audit, maintain security or comply with legal requirements. After that it will be deleted or anonymized, where possible. We use reasonable security measures, but no online system is completely immune.",
        ],
      },
      {
        title: "Your choices and rights",
        paragraphs: [
          "Providing information in forms is voluntary. Without the required details and acceptance of the privacy policy we cannot accept the form or get back to you, but you can still browse the website. The checkbox does not sign you up for a marketing mailing list.",
          "You can contact us to request access to the personal information we hold about you, to correct inaccurate information, or to delete information to the extent the law allows. We may ask for reasonable details to verify your identity before handling the request.",
        ],
      },
      {
        title: "Minors, links and updates",
        paragraphs: [
          "The website and services are intended for adults and businesses and are not designed to knowingly collect information from children. If you learn that a child has given us information, please contact us.",
          "We may update this policy when the services, providers or legal requirements change. The date at the top of the page reflects the current version.",
        ],
      },
    ],
  },
  articles: {
    heading: "Articles",
    description:
      "Moriz Studio articles on design, user research, websites and digital tools. Ideas from the work itself, for anyone building a product who wants a clear foundation.",
    // On-page intro only. `description` stays the meta / Open Graph / RSS text.
    lede: "Design, user research, websites and digital tools. Ideas from the work itself, for anyone building a product who wants a clear foundation.",
    empty:
      "No articles have been published yet. New ones will appear here; in the meantime, you can look at some work or head back home.",
    emptyProjects: "All projects",
    emptyHome: "Home",
    listLabel: "Article list",
    rss: "RSS",
    // Shown alone for one minute; `readingMinutes` follows the number.
    readingMinute: "1 min read",
    readingMinutes: "min read",
    published: "Published",
    updated: "Updated",
    byline: "Mor Zeevi",
    toc: "Contents",
    related: "More articles",
    sources: "Sources",
    faq: "FAQ",
    breadcrumbs: "Breadcrumb",
    draft: "Draft. This page isn't shown in the article list or the sitemap.",
    coverFallbackAlt: "Moriz Studio",
    tldr: "In short",
    ctaTitle: "Shall we plan your system together?",
    ctaText:
      "I'm Mor. If you have a system, website or process that needs structure, I'd love to hear what you're trying to do and plan it with you.",
    ctaLabel: "Let's talk",
    projectKicker: "Project",
    projectFallback: "View the project",
    alsoRead: "Also read",
  },
  // Faithful translation of the Hebrew terms of use (18.11.2026).
  termsOfUse: {
    title: "Terms of Use",
    intro:
      "The terms of use of the Moriz Studio website: information about the services, rights in the content, use of the AI tools and contacting the studio.",
    updatedOn: "2026-11-18",
    lastUpdated: "Last updated: November 18, 2026",
    contactLabel: "Questions about the terms of use",
    contactName: "Mor Zeevi — Moriz Studio",
    sections: [
      {
        title: "About the website and these terms",
        paragraphs: [
          "The website moriz.studio is operated by Mor Zeevi, owner of Moriz Studio. It presents the studio's work and its services: specification, user experience and interface design, and development of websites, web systems and AI tools, as well as articles and tools for initial guidance.",
          "These terms apply to use of the website, including browsing the content, sending an inquiry, and using moriz.ai and the digital audit. Please read them before using the website.",
        ],
      },
      {
        title: "Information on the website and engaging the studio",
        paragraphs: [
          "The information on the website is meant for introduction and general guidance. Project examples, testimonials and service descriptions are not a promise of the same result in another project.",
          "Sending a form, chatting with the assistant or completing an audit is not a work order and does not create an obligation to provide a service. The scope of work, price, payment terms, timelines, deliverables, usage rights and cancellation terms of a project will be set in a separate proposal or agreement agreed with the client. These terms do not replace such an agreement.",
        ],
      },
      {
        title: "Permitted use of the website",
        paragraphs: [
          "You may browse the content, consider whether the studio's services fit your needs and share links to pages of the website. When using the forms and tools, provide accurate information that you are permitted to provide.",
          "Do not use the website for unlawful activity, harassment, sending spam, or harming the privacy and rights of others. Do not try to access information that is not meant for you, bypass protection mechanisms, disrupt the website, or run automated collection that burdens it or infringes rights. This does not prevent ordinary indexing by search engines or the use of assistive technologies.",
        ],
      },
      {
        title: "Copyright and intellectual property",
        paragraphs: [
          "The rights in the website's content, design, texts, code and visual materials belong to Moriz Studio or to the relevant rights holders, as the case may be. Names, logos, screenshots and deliverables of clients and third parties may be owned by them and are shown in order to present the work.",
          "Showing material on the website does not transfer ownership or grant a license to copy, change, distribute or use it commercially. Use that requires permission needs prior written approval from the rights holder. This does not limit use permitted by law, including fair use.",
        ],
      },
      {
        title: "moriz.ai and the digital audit",
        paragraphs: [
          "The moriz.ai assistant and the digital audit are meant to provide information and initial guidance. Answers and recommendations may be generated automatically, including with the help of artificial intelligence, and may be partial, out of date or wrong. The audit result is based on the answers you gave and is not a full review of the website or the business.",
          "The outputs are not a binding quote, a commitment to a business result, legal advice, or a substitute for specification and a professional review. Before a decision or material reliance, verify the information with Mor. We recommend not entering passwords, sensitive information, or personal information of others that you are not authorized to provide.",
        ],
      },
      {
        title: "Inquiries and privacy",
        paragraphs: [
          "Details provided in the forms and tools are processed according to the website's privacy policy. Providing details in order to get a response to an inquiry is not in itself a subscription to marketing messages. More information about data collection, external providers and your rights appears in the privacy policy.",
        ],
        links: [
          {
            label: "To the privacy policy",
            href: "/privacy-policy",
          },
        ],
      },
      {
        title: "Links and external services",
        paragraphs: [
          "The website may link to client websites, WhatsApp, social networks and external services. Those services and their content are managed by their operators, and using them is also subject to their terms and policies. The studio does not control their availability or changes made to them.",
        ],
      },
      {
        title: "Website availability and liability",
        paragraphs: [
          "We work to make the information on the website useful and to keep the website running properly, but there may be errors, faults or temporary interruptions. The content and tools are offered as they are and as available, with no promise that they will suit every need or be available at all times.",
          "Subject to law, the studio will not be liable for indirect damage arising from reliance on general information or on automated output on the website. Nothing in these terms exempts from liability that cannot be limited by law, or takes away rights you have under mandatory provisions of law.",
        ],
      },
      {
        title: "Updates and governing law",
        paragraphs: [
          "The website's content, tools and terms of use may be updated from time to time. The current version and the date it was updated will be published on this page. An update does not change in retrospect a separate agreement already made with a client.",
          "The laws of the State of Israel apply to use of the website. Any dispute will be heard in the court with jurisdiction under the law. If a provision of these terms is not valid, the remaining provisions will continue to apply as far as possible.",
        ],
      },
    ],
  },
  // Faithful translation of the Hebrew accessibility statement (18.11.2026).
  accessibility: {
    title: "Accessibility Statement",
    intro:
      "It matters to me that every person can get to know Moriz Studio, browse the content and contact me. This page describes the accessibility efforts on the website and the ways to reach me when you run into a difficulty.",
    updatedOn: "2026-11-18",
    lastUpdated: "Last updated: November 18, 2026",
    contactLabel: "Accessibility inquiries",
    contactName: "Mor Zeevi — Moriz Studio",
    sections: [
      {
        title: "The commitment to accessibility",
        paragraphs: [
          "The website moriz.studio presents the studio's services, work, articles and digital tools. We work to improve accessibility so that people with disabilities can also use it comfortably, with reference to the principles of Israeli Standard SI 5568 and to the WCAG guidelines at level AA as a target for improvement.",
          "The website has not yet had a full professional accessibility audit. This statement describes the existing efforts and adjustments. It is not a confirmation of full compliance with the standard, or a commitment that every component has been tested with every assistive technology.",
        ],
      },
      {
        title: "Adjustments on the website",
        paragraphs: [
          "The website was built with measures that help with orientation, reading and operation:",
        ],
        bullets: [
          "A skip link to the main content on the public pages, and a content structure based on headings and defined regions.",
          "Links and buttons that can be operated with the keyboard, and a visible focus indicator.",
          "A navigation menu on mobile devices with focus management and the option to close it with the keyboard.",
          "A display adapted to screens of different sizes, and support for zooming the display with the browser.",
          "Support for the reduced motion preference set in the operating system, in the animated components that support it.",
          "The option to get in touch directly by email or phone, in addition to the contact form.",
        ],
      },
      {
        title: "Limitations and ongoing improvement",
        paragraphs: [
          "Alongside the adjustments, there may be difficulties in some of the content, in project views, in media and in interactive components. A comprehensive check of the whole website and of the audit tool with screen readers has not been carried out. External websites and services linked from the website are managed separately and their accessibility may vary.",
          "If content or an action is not accessible to you, you can contact me and I will try to help, provide the information in an accessible way and look into the fix needed. You do not need to use the website's form to ask for help.",
        ],
      },
      {
        title: "How the service is provided",
        paragraphs: [
          "The studio's services are provided online and by prior arrangement. The studio has no premises open to the public. If you need an adjustment in the way we communicate, or to receive information in another format, you can contact Mor using the details below.",
        ],
      },
      {
        title: "How to report a difficulty",
        paragraphs: [
          "Mor Zeevi handles accessibility inquiries. So that I can understand the difficulty and help, it is useful to include as many of the following details as you can. You can also get in touch without all of them:",
        ],
        bullets: [
          "A link to the page where you ran into the difficulty.",
          "What you tried to do and what went wrong.",
          "The type of device, operating system and browser, including the version if known.",
          "The name of the assistive technology you used, if relevant.",
          "Your preferred way to be contacted for follow-up.",
        ],
      },
    ],
  },
  floatingActions: {
    label: "Quick actions",
    whatsapp: "Chat on WhatsApp?",
    ai: "moriz.ai",
    // Starts with the visible label so voice control can match it.
    aiLabel: "moriz.ai – ask me anything",
  },
} satisfies SiteContent;
