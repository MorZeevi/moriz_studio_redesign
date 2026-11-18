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
      rotating: ["Complex websites", "Web apps", "UX & UI design", "AI tools"],
      end: "built on research",
      // Accessible name: the rotation is visual only.
      label:
        "Complex websites, web apps, UX and UI design, and AI tools built on research",
    },
    introduction: "Nice to meet you, I'm Mor",
    // structured-data.ts and llms.ts read the job title after the "—".
    portraitAlt: "Mor — studio owner",
    description: {
      emphasis: "Research wins arguments.",
      firstLine: "That's how I approach every project, however complex.",
      secondLine:
        "With a degree in learning technologies from HIT and years of development experience,",
      thirdLine:
        "I'll build your digital tool from the first idea to a product that works brilliantly.",
    },
    projectsLink: "View projects",
    scrollLabel: "Scroll to explore",
    video: {
      label: "Showreel: selected work",
      pause: "Pause video",
      resume: "Play video",
    },
  },
  diagnosticBanner: {
    headingStart: "Which digital tool",
    headingEnd: "does your business need?",
    introduction: "A website, an app, or maybe an AI tool?",
    emphasis: "Answer 7 questions",
    description: "and we'll find the right direction for you together.",
    action: "Find your tool with a smart AI questionnaire",
    actionMobile: "Find your tool",
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
        "A website or system should speak for itself. If it needs explaining, something isn't working. Besides, nobody reads text anymore.",
    },
    development: {
      description:
        "I turn the UX plan and design into a working digital product, with solutions built around your needs. Down to the smallest detail.",
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
        "Together we research your problem, define it and weigh the possible solutions. From academic research to your competitors.",
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
    heading: "What clients say",
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
        title: "A 5–10 minute phone call",
        detail:
          "A few simple questions to see whether we're a good first fit for your needs.",
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
        question: "How much does a website cost?",
        answer: [
          "It depends on what you need: some websites and tools are relatively simple, others are more complex. In a short 5–10 minute call I can give you an initial estimate.",
          "And if it turns out I'm not the right fit for you, I'll gladly refer you to a colleague I trust.",
        ],
      },
      {
        question: "How long does it take to build a website?",
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
        question: "Who owns the website and its rights?",
        answer: [
          "You do, in full. The code, the domain and the content are yours, and you don't depend on me. If you ever want to work with another developer, they'll get well-organized code that's easy to build on.",
        ],
      },
      {
        question: "Is there a warranty on the website?",
        answer: [
          "Yes. Every site comes with a 3-month warranty for fixing significant bugs (not including design changes or new features).",
        ],
      },
      {
        question: "Do you keep maintaining the site after launch?",
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
      "How much does a website cost?",
      "What does the work process look like?",
      "What services do you offer?",
      "Who is this for?",
    ],
    thread: "Conversation with moriz.ai",
    send: "Send",
    loading: "One moment, checking…",
    fallback:
      "I don't have that information yet 🙂\nYou can talk to me directly on WhatsApp.",
    whatsapp: "Talk to me on WhatsApp",
    error:
      "Something went wrong and I couldn't answer right now. Please try again in a moment.",
    retry: "Try again",
    reset: "New conversation",
    close: "Close",
  },
  contact: {
    heading: "Let's talk",
    description: "Tell me a little about your project.",
    promise: "I'll get back to you within one business day.",
    phoneHint: "Only so I can get back to you.",
    interests: "What are you interested in?",
    fields: {
      name: "What's your name?",
      phone: "What's your number?",
      whatsapp: "WhatsApp preferred",
      message: "A few words",
      optional: "(optional)",
    },
    errors: {
      name: "A nickname you like works too",
      phone: "Hmm, something's off with that number.",
    },
    submit: "Send message",
    sending: "Sending your message...",
    sent: "Message sent. I'll get back to you soon.",
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
    // An empty href renders as a placeholder, not a link.
    legal: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms of use", href: "" },
      { label: "Accessibility statement", href: "" },
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
  floatingActions: {
    label: "Quick actions",
    whatsapp: "Chat on WhatsApp?",
    ai: "moriz.ai",
    // Starts with the visible label so voice control can match it.
    aiLabel: "moriz.ai – ask me anything",
  },
} satisfies SiteContent;
