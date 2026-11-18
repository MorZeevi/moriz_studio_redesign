// English service pages. Same structure as the Hebrew in `services.ts`: same
// slugs, paths, section ids and types, project and related slugs. Voice: first
// person (Mor), "you" for the client. Facts (call length, quote validity,
// warranty, ownership, location) match the Hebrew exactly.
//
// The English site has no articles and no diagnostic, so these documents
// have no `articleSlugs` and no inline links to `/articles` or
// `/digital-audit`. Only type imports from `services.ts`, so there is no
// runtime import cycle.

import type {
  Paragraph,
  ServiceDocument,
  ServicesChrome,
  ServicesContent,
} from "./services";

const chrome: ServicesChrome = {
  breadcrumbs: "Breadcrumb",
  label: "Services",
  catalog: "Services",
  projects: "Related work",
  projectsAll: "All projects",
  articles: "Further reading",
  related: "More services",
  faq: "Frequently asked questions",
  toc: "On this page",
};

/** English versions of the Hebrew `ownerReviewClaims`, same keys. */
export const ownerReviewClaimsEn = {
  notTemplate:
    "If what you need is a free website, a ready-made template, or a single page with no process and nothing to manage, I'm not the right fit.",
  crm: "When a business needs a CRM, I specify and build it like any other custom management system.",
  agent:
    "When an existing tool doesn't cover the process, I build a small tool or an AI agent that fits it.",
  mvp: "In MVP specification we decide together who the first user is, what the core journey is, and what stays out of version one.",
  ux: "When I design a complex system, I start from the tasks people need to get done, not from a screen that looks good on its own.",
  ctaHub:
    "Tell me about the product you want to build, and we'll work out together where to start.",
  ctaWeb:
    "Tell me about the website or the management system, and we'll work out together what really needs to be built.",
  ctaMvp:
    "Tell me about the product and its first version, and we'll work out together what goes into the specification.",
  ctaAi:
    "Tell me about the process that keeps repeating in your business, and we'll work out together whether an AI agent fits.",
  ctaUx:
    "Tell me about the system and the people who use it, and we'll work out together how to simplify it.",
  learningUsers:
    "On a learning platform I start from two users: the person learning, and the person running the learning.",
  learningScope:
    "I specify, design and build learning platforms, LMS systems and digital learning products. I don't develop e-learning modules in Storyline or Articulate.",
  ctaLearning:
    "Tell me about the learning platform or LMS, and we'll work out together what the learner needs to complete.",
  studio:
    "I'm Mor Zeevi, owner of Moriz Studio. You work with me directly, not with an anonymous department.",
} as const;

const claims = ownerReviewClaimsEn;

const referral =
  "And if it turns out I'm not the right fit for you, I'll gladly refer you to a colleague I trust.";

const estimate =
  "It depends on what you need: some websites and tools are fairly simple, others are more complex. In a short 5-10 minute call I can give you an initial estimate.";

const timing =
  "Project length depends on its scope and complexity. At the start we set a schedule together with clear milestones, so you always know where things stand. Part of the pace is up to you too: ready content and quick feedback shorten the road.";

const ownership =
  "Yours, entirely. The code, the domain and the content are yours, and you don't depend on me. If you ever want to work with another developer, they'll get clean, organized code that's easy to pick up.";

const warranty =
  "Yes. Every website comes with a 3-month warranty for fixing significant bugs (not including design changes or new features).";

const alone = [
  "On every project I work with you myself, from UX to launch. On large, complex projects I bring in professionals I know and trust, such as an information security expert or a brand designer, and put together a team that fits exactly what you need.",
  "I manage all of it, so you have one point of contact.",
];

const startSteps = [
  {
    title: "A 5-10 minute phone call",
    detail:
      "A few simple questions, to see whether there's an initial fit with what you need.",
  },
  {
    title: "A discovery call",
    detail:
      "A free Zoom call where we get to know your project, goals and needs in depth.",
  },
  {
    title: "You get a quote",
    detail:
      "A detailed quote based on what we specified together, valid for 14 business days.",
  },
];

const designStep = {
  title: "UX and design, before code",
  detail:
    "In the UX and design stage you get a complete responsive design, along with an interactive prototype that walks through the main scenarios, before a single line of code is written.",
};

const buildStep = {
  title: "Development in clean code",
  detail:
    "I write clean code built specifically for you, and make sure every pixel sits exactly where it should.",
};

const links = {
  websites: {
    text: "Websites and management systems",
    href: "/services/business-websites",
  },
  mvp: { text: "MVP specification and development", href: "/services/mvp" },
  ux: { text: "UX/UI design for complex systems", href: "/services/ux-design" },
  ai: { text: "AI agents for business", href: "/services/ai-agents" },
  learning: { text: "Learning platforms", href: "/services/elearning" },
};

function p(text: string): Paragraph {
  return [text];
}

const servicesHub: ServiceDocument = {
  slug: null,
  path: "/services",
  title: "Digital product design and development",
  description:
    "Digital product design and development for businesses: websites, management systems, MVPs and AI tools. Mor Zeevi's studio, for complex products, not templates.",
  keyword: "Digital product design and development",
  heading: "Digital product design and development for businesses",
  answer: [
    p(
      "For me, UX, design and development are the path from an idea to a digital product that works.",
    ),
    p(
      "I'm Mor Zeevi, and I create web applications, custom systems, AI solutions for business and interactive tools.",
    ),
    p(
      "The work fits anyone whose gap to a business goal is a website or a smart system, and the code, the domain and the content stay yours.",
    ),
  ],
  showCatalog: true,
  sections: [
    {
      type: "prose",
      id: "choose",
      heading: "How to know where to start",
      paragraphs: [
        [
          "A website with a process, or a management system, starts with ",
          links.websites,
          ". A product where it isn't clear yet what goes into version one starts with ",
          links.mvp,
          ". The interface of a crowded system starts with ",
          links.ux,
          ". A repeating process that eats up hours starts with ",
          links.ai,
          ". A digital course or a learning system starts with ",
          links.learning,
          ".",
        ],
        p(
          "Not sure whether you need a website, an app or maybe an AI tool? Tell me what you're trying to achieve, and we'll find the direction that fits you together.",
        ),
      ],
    },
    {
      type: "split",
      id: "fit",
      heading: "Who the studio is for, and who it isn't",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "Founders, companies and organizations building a complex digital product.",
            "Anyone whose gap to the goal is a website or a smart system, not another generic page.",
            "Learning systems, web applications, interactive tools and custom products.",
            "Anyone who wants one point of contact from UX to launch.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(claims.notTemplate), p(referral)],
          items: [
            "Anyone looking for a free website or a WordPress or Wix template.",
            "Anyone who needs a number before understanding what's being built.",
          ],
        },
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "How we start working together",
      steps: startSteps,
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p(
          "A website, a management system, an MVP and an AI tool aren't the same scope. The quote is written after the specification.",
        ),
      ],
      items: [
        "How many user types and processes the product has.",
        "What goes into version one and what stays out.",
        "Whether it needs to connect to systems you already have.",
        "How much of the content and design is already done.",
        "Whether the quote covers specification, design, development, or a combination.",
      ],
    },
  ],
  faq: [
    {
      question: "What services do you offer?",
      answer: [
        "UX, design and development. In practice that means websites and management systems, MVP specification and development, UX/UI design for complex systems, and AI solutions for business.",
        "I create web applications, custom systems, AI solutions for business and interactive tools (such as calculators and infographics).",
      ],
    },
    {
      question: "Who is it for?",
      answer: [
        "Anyone who has invested in a product or a service and knows the gap to success is a website or a smart system.",
        claims.notTemplate,
        referral,
      ],
    },
    {
      question: "How do we start?",
      answer: [
        "We talk for 5-10 minutes on the phone, to see whether there's a fit. Then a free discovery call on Zoom, and then a quote based on what we specified, valid for 14 business days.",
      ],
    },
    {
      question: "How much does a project cost?",
      answer: [estimate],
    },
    {
      question: "Do you work alone?",
      answer: alone,
    },
    {
      question: "Where are you based?",
      answer: [
        "The studio is in Tel Aviv, and I work with clients anywhere. The first call is by phone or video and the discovery call is on Zoom.",
      ],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["guesto", "practicalai", "chabad-club", "awscience"],
  relatedSlugs: [],
  cta: claims.ctaHub,
};

const businessWebsites: ServiceDocument = {
  slug: "business-websites",
  path: "/services/business-websites",
  title: "Business websites and management systems",
  description:
    "Business websites, management systems and CRMs, in code written for you. For a site or system with real processes, not a template. Built by Mor Zeevi.",
  keyword: "Business websites",
  heading: "Business websites and management systems",
  answer: [
    p(
      "When I build a business website, I specify, design and develop a website or a management system in clean code written for you, not from a WordPress or Wix template.",
    ),
    p(
      "It fits a business that needs processes, permissions or data management: a business management system, and sometimes a CRM.",
    ),
    p(
      "You get a product that belongs to you, with a content management system and responsive design.",
    ),
  ],
  showCatalog: false,
  sections: [
    {
      type: "split",
      id: "fit",
      heading: "Who business website development is for",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "A business that needs a website that runs a process, not just a page describing a service.",
            "An organization that needs a management system: leads, appointments, inventory, orders or permissions.",
            "Anyone already held back by Wix or WordPress.",
            "Founders and companies investing in a digital product, not a template.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(claims.notTemplate), p(referral)],
          items: [
            "Anyone looking for a free website.",
            "Anyone who needs a single page with no process and nothing to manage.",
          ],
        },
      ],
    },
    {
      type: "prose",
      id: "systems",
      heading: "Business management systems and CRM",
      paragraphs: [
        p(
          "A business management system runs a process: statuses, permissions, and records people update every day. A brochure website presents the business. They're not the same product, even when both live in a browser.",
        ),
        p(claims.crm),
        [
          "Before building, it's worth deciding what goes into version one. You can read about that in ",
          links.mvp,
          ", and about the interface itself in ",
          links.ux,
          ".",
        ],
      ],
    },
    {
      type: "prose",
      id: "custom",
      heading: "Custom software development",
      paragraphs: [
        p(
          "Custom software development here means code written for the project, not a theme. That's what makes a fast website possible, without the limits of a ready-made template.",
        ),
        p(
          "For every project I set up an easy-to-use content management system, so you stay in control. I don't work with WordPress or Wix.",
        ),
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "What the process looks like",
      steps: [
        ...startSteps,
        designStep,
        buildStep,
        {
          title: "Launch and warranty",
          detail:
            "Every website comes with a 3-month warranty for fixing significant bugs, not including design changes or new features.",
        },
      ],
    },
    {
      type: "prose",
      id: "included",
      heading: "What's included",
      paragraphs: [
        p(
          "The quote sets out the scope. When I build a website or a system, these parts are always included:",
        ),
      ],
      items: [
        "Specification and a complete responsive design.",
        "An interactive prototype of the main scenarios, before code.",
        "Development in clean code, with no ready-made template.",
        "A content management system, so you stay in control.",
        "I work with you myself from UX to launch. On a large project I manage a team put together for what's needed.",
        "A 3-month warranty for fixing significant bugs on the website.",
        "The code, the domain and the content are yours.",
      ],
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p(
          "The quote is written after the discovery call and is valid for 14 business days. These are the factors that move the scope, with no price list:",
        ),
      ],
      items: [
        "A website that presents the business, versus a system that runs a process.",
        "How many user types and permission levels there are.",
        "The processes: leads, appointments, inventory, orders or CRM.",
        "Connections to systems you already use.",
        "How much of the content and design already exists.",
        "Ready content and quick feedback shorten the road.",
      ],
    },
  ],
  faq: [
    {
      question: "How much does a business website cost?",
      answer: [
        estimate,
        "A management system and a brochure page aren't the same scope, so there's no single number that's right for everyone.",
      ],
    },
    {
      question: "Are you a web development company?",
      answer: [claims.studio, alone[0]],
    },
    {
      question: "Do you build in WordPress or Wix?",
      answer: [
        "No. I write clean code built specifically for you, and that's what makes a fast website possible, without the limits of a ready-made template.",
        "For every project I set up an easy-to-use content management system, so you stay in control.",
      ],
    },
    {
      question:
        "What's the difference between a brochure website and a business management system?",
      answer: [
        "A brochure website explains who you are. A business management system runs daily work: records, statuses and permissions. If people need to update information every day, it's no longer a brochure website.",
      ],
    },
    {
      question: "Do you also build CRM systems?",
      answer: [claims.crm],
    },
    {
      question: "Who owns the website and the code?",
      answer: [ownership],
    },
    {
      question: "Is there a warranty after launch?",
      answer: [warranty],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["guesto", "chabad-club", "וורדעל"],
  relatedSlugs: ["mvp", "ux-design", "ai-agents"],
  cta: claims.ctaWeb,
};

const mvp: ServiceDocument = {
  slug: "mvp",
  path: "/services/mvp",
  title: "System specification and MVP development",
  description:
    "System specification and MVP development for businesses and founders: what goes into version one, what stays out, and how it becomes a design and a product.",
  keyword: "System specification",
  heading: "System specification and MVP development",
  answer: [
    p(
      "System specification and MVP development are how you decide what goes into the first version of a product, website or system, before writing all the code.",
    ),
    p(
      "It fits founders and businesses that need a website or system specification that can actually be priced.",
    ),
    p(claims.mvp),
  ],
  showCatalog: false,
  sections: [
    {
      type: "prose",
      id: "spec",
      heading: "What system and website specifications are",
      paragraphs: [
        p(
          "A system specification describes who the users are, what each of them needs to accomplish, and what happens when something goes wrong. A website specification is the same kind of decision when the product is a website: which tasks happen on each page, and what doesn't belong there.",
        ),
        p(
          "Without that decision, two quotes for the same idea describe two different products. The specification is what makes a quote based on an agreed scope possible.",
        ),
      ],
    },
    {
      type: "prose",
      id: "mvp-meaning",
      heading: "What MVP development means",
      paragraphs: [
        p(
          "MVP development means building the first version that tests the core journey, not every idea. Whatever doesn't make it in stays written down outside the scope, so it doesn't sneak back in halfway through development.",
        ),
        [
          "When the question is how the screens look, that's ",
          links.ux,
          ". When the first version is a website or a management system, that's ",
          links.websites,
          ".",
        ],
      ],
    },
    {
      type: "split",
      id: "fit",
      heading: "Who MVP specification and development is for",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "Founders before a first version, with several directions and no single journey yet.",
            "A business building a system or website with more than one type of user.",
            "Anyone who wants a quote on a defined scope, not an open idea.",
            "A team that needs to know what's out of scope, not just what's in.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(referral)],
          items: [
            "Anyone who wants to build every idea into version one.",
            "Anyone looking for a brochure website with no product and no process.",
            "Anyone who only needs a small change to a screen that's already specified.",
          ],
        },
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "What the process looks like",
      steps: [
        ...startSteps,
        {
          title: "Defining version one",
          detail: claims.mvp,
        },
        designStep,
        {
          title: "Development, if it's part of the quote",
          detail:
            "If the quote includes development, I write clean code built specifically for you.",
        },
      ],
    },
    {
      type: "prose",
      id: "included",
      heading: "What's included",
      paragraphs: [
        p(
          "The specification and the quote cover the decisions you can build from:",
        ),
      ],
      items: [
        "A first user and one core journey.",
        "What goes into version one and what stays out.",
        "Responsive design and a prototype, when the stage includes design.",
        "A quote based on the specification, valid for 14 business days.",
        "Development in clean code, if the quote includes it.",
        "A schedule with milestones, set at the start of the project.",
      ],
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p("What moves the scope of specification and MVP development:"),
      ],
      items: [
        "How many user types there are, and how many journeys version one really needs.",
        "How many exceptions the process has: cancellation, permissions, payment, approval.",
        "Whether there's an existing system to connect to.",
        "Whether the work includes design, development, or both.",
        "How much of the content is already written.",
      ],
    },
  ],
  faq: [
    {
      question: "What is a system specification?",
      answer: [
        "A system specification decides who uses the system, what the core journey is, what goes into version one and what stays out. Design and development follow from it, and so does the quote.",
      ],
    },
    {
      question: "What is a website specification?",
      answer: [
        "A website specification is the same work when the product is a website: which tasks visitors come to complete, what has to appear, and what only gets in the way. Design without that decision produces screens that need fixing later.",
      ],
    },
    {
      question:
        "What's the difference between a specification and MVP development?",
      answer: [
        "The specification decides what to build. MVP development builds it in code. You can specify first and then price the development. Development goes into the quote only once the scope is clear.",
      ],
    },
    {
      question: "What do I get before any code is written?",
      answer: [
        "When the work includes design: a complete responsive design, and an interactive prototype that walks through the main scenarios, before a single line of code is written.",
      ],
    },
    {
      question: "How much does a specification or an MVP cost?",
      answer: [
        estimate,
        "Two specifications for the same idea can describe different scopes. That's why the price is set after defining version one, not before.",
      ],
    },
    {
      question: "How long do specification and development take?",
      answer: [timing],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["guesto", "practicalai", "awscience", "chabad-club"],
  relatedSlugs: ["ux-design", "business-websites", "ai-agents"],
  cta: claims.ctaMvp,
};

const aiAgents: ServiceDocument = {
  slug: "ai-agents",
  path: "/services/ai-agents",
  title: "AI agents for business and automation",
  description:
    "AI agents for business and AI tools for processes that repeat. We check existing tools first, or I build a small one for you, from specification to code.",
  keyword: "AI agents for business",
  heading: "AI agents for business and automation",
  answer: [
    p(
      "An AI agent for business is a tool that runs on a repeating process: it reads information, chooses a step and takes an action.",
    ),
    p(
      "It fits a business that wants to save time on repetitive work, not one that wants to add technology without a clear process.",
    ),
    p(claims.agent),
  ],
  showCatalog: false,
  sections: [
    {
      type: "prose",
      id: "what",
      heading: "What an AI agent for business is",
      paragraphs: [
        p(
          "An AI agent for business isn't a general chat that answers questions. A chatbot answers. An agent carries out a step in a process: it updates a record, sorts an inquiry, or prepares a draft that waits for approval.",
        ),
        p(
          "AI is a tool, and it's worth using exactly where it saves time. Together we'll go through the processes that repeat in your business and check which tools can fit you, from existing tools to small tools I build specifically for you.",
        ),
      ],
    },
    {
      type: "prose",
      id: "automation",
      heading: "When to use business automation, and when an AI agent",
      paragraphs: [
        p(
          "Business automation fits when the next step is always the same: an inquiry comes in, a message goes out, a status changes. An AI agent fits when the step requires reading text or choosing between a few options, and there's still a clear rule.",
        ),
        p(
          "If there's no written process, there's nothing to turn into a tool. First we define the process, then we decide whether an existing tool is enough.",
        ),
        [
          "Specifying the tool is the same kind of decision as in ",
          links.mvp,
          ": what goes into the first version.",
        ],
      ],
    },
    {
      type: "split",
      id: "fit",
      heading: "Who an AI agent for business is for",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "A business with a repeating process that eats up hours every week.",
            "Anyone willing to try an existing tool before building a new one.",
            "Anyone who needs a small tool for one process, not a system for the whole business at once.",
            "Anyone who wants a person to stay in the loop where judgment is needed.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(referral)],
          items: [
            "Anyone who wants AI because everyone's talking about it, without a defined process.",
            "Anyone looking for a general chat that doesn't act on any work in the business.",
            "Anyone who expects the tool to replace judgment with no person in the process.",
          ],
        },
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "What the process looks like",
      steps: [
        ...startSteps,
        {
          title: "Picking one process",
          detail:
            "Together we'll go through the repeating processes and pick one that can be described: input, step and outcome.",
        },
        {
          title: "Checking existing tools",
          detail:
            "Existing tools first. A new tool comes in only if they don't cover the process.",
        },
        {
          title: "A short specification, then development if needed",
          detail: claims.agent,
        },
      ],
    },
    {
      type: "prose",
      id: "included",
      heading: "What's included",
      paragraphs: [
        p(
          "When I build an AI tool or an agent for a business, the quote can include:",
        ),
      ],
      items: [
        "Choosing one repeating process.",
        "Checking whether an existing tool is enough.",
        "Specification: what the tool does, what it doesn't do, and where a person approves.",
        "Development of a small tool, if that's the decision.",
        "Code that belongs to you, when there's development.",
      ],
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p(
          "With an AI agent for business, the scope moves with the work, not with the name of the tool:",
        ),
      ],
      items: [
        "How many steps the process has, and how many exceptions.",
        "Whether an existing tool is enough or a tool needs to be written.",
        "Which systems the tool needs to access.",
        "Where a person has to approve before an action.",
        "How much of the process is already written down and can be relied on.",
      ],
    },
  ],
  faq: [
    {
      question: "What is an AI agent for business?",
      answer: [
        "An AI agent for business is a tool that follows a repeating process: it reads information, chooses a step and takes an action. It doesn't replace the decision about what the business should do. That's set in the specification.",
      ],
    },
    {
      question: "What's the difference between an AI agent and a chatbot?",
      answer: [
        "A chatbot answers questions. An AI agent goes on to act in a process, for example sorting an inquiry or updating a record. If there's no such action, a chat is enough, and sometimes even that is unnecessary.",
      ],
    },
    {
      question: "Should I use an existing tool or build an AI tool?",
      answer: [
        "Existing tools first. Building an AI tool makes sense when your process doesn't fit a ready-made tool, or when it needs to connect to a system you already use.",
        claims.agent,
      ],
    },
    {
      question: "Will an AI agent replace employees?",
      answer: [
        "AI is a tool, and it's worth using exactly where it saves time. It doesn't replace judgment. In the specification we decide what it does, what it doesn't do, and where a person approves before an action.",
      ],
    },
    {
      question: "How much does an AI agent for business cost?",
      answer: [
        estimate,
        "A short process on an existing tool and a process with exceptions, permissions and a system connection aren't the same scope.",
      ],
    },
    {
      question: "How do you make sure the agent doesn't act without oversight?",
      answer: [
        "In the specification we decide what the agent acts on, what it isn't allowed to do, and where a person approves before an action. Without that decision, the tool doesn't get built.",
      ],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["hatchly", "awscience", "practicalai"],
  relatedSlugs: ["mvp", "business-websites", "ux-design"],
  cta: claims.ctaAi,
};

const uxDesign: ServiceDocument = {
  slug: "ux-design",
  path: "/services/ux-design",
  title: "UX/UI design for complex systems",
  description:
    "UX/UI design for complex systems: clear interfaces for management tools, learning platforms and multi-user products. Research-led, with a prototype before code.",
  keyword: "UX/UI design for complex systems",
  heading: "UX/UI design for complex systems",
  answer: [
    p(
      "UX/UI design for complex systems is the specification and design of an interface for a system with several users and processes.",
    ),
    p(
      "It fits a management system, a learning platform or a web product, when there's more than one screen and one task.",
    ),
    p(
      "In specification and design you get a complete responsive design and an interactive prototype of the main scenarios, before a single line of code is written.",
    ),
  ],
  showCatalog: false,
  sections: [
    {
      type: "prose",
      id: "complex",
      heading: "What complex system design means",
      paragraphs: [
        p(claims.ux),
        p(
          "Every button, every animation and every choice is deliberate. I keep up with new research and methods all the time. Research wins arguments.",
        ),
        p(
          "Complex system design simplifies what's on the screen without removing capabilities the work needs. A dashboard, a learning system and a system with several roles all break when everything is crammed onto one screen, and also when you hide what the user needs to finish a task.",
        ),
      ],
    },
    {
      type: "prose",
      id: "versus",
      heading: "How it differs from designing a brochure website",
      paragraphs: [
        p(
          "On a brochure website the main task is to understand what it's about and get in touch. In a system the task is to finish work: update, approve, learn, manage. The design is measured by whether the task gets done, not by whether the screen looks good in a screenshot.",
        ),
        [
          "If you haven't decided yet what goes into version one, start with ",
          links.mvp,
          ". If the system also needs to be built, continue to ",
          links.websites,
          ".",
        ],
      ],
    },
    {
      type: "split",
      id: "fit",
      heading: "Who UX/UI design for a system is for",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "A system with several roles, screens and processes.",
            "A learning platform, a dashboard, or a web product whose interface has become overloaded.",
            "Anyone who wants responsive design and a prototype before code is written.",
            "A development team that needs an interface it can build from.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(referral)],
          items: [
            "A single page with no process and no different user types.",
            "Anyone who only wants new colors, without touching the tasks.",
            "Full branding when there's no digital product to specify. On a complex project I bring in a brand designer when needed.",
          ],
        },
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "What the process looks like",
      steps: [
        ...startSteps,
        {
          title: "Starting from the tasks",
          detail: claims.ux,
        },
        designStep,
        {
          title: "Development, if the quote includes it",
          detail:
            "I turn the specification and design into a working digital product, with solutions tailored to your needs.",
        },
      ],
    },
    {
      type: "prose",
      id: "included",
      heading: "What's included",
      paragraphs: [
        p("When I design a complex system, the quote is built on these:"),
      ],
      items: [
        "Specification of the users' tasks and journey.",
        "A complete responsive design.",
        "An interactive prototype of the main scenarios, before code.",
        "A quote based on the specification, valid for 14 business days.",
        "Development, if the quote includes it.",
      ],
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p(
          "With UX/UI design for a complex system, the scope moves with the product:",
        ),
      ],
      items: [
        "How many roles there are, and what each role needs to complete.",
        "How many processes and screens really go into this stage.",
        "How much is already known about the users, and how much still needs finding out.",
        "Whether the work continues into development.",
        "Ready content and quick feedback shorten the road.",
      ],
    },
  ],
  faq: [
    {
      question: "What does UX/UI design for complex systems include?",
      answer: [
        "Specification of the tasks and the journey, a complete responsive design, and an interactive prototype of the main scenarios, before a single line of code is written.",
        claims.ux,
      ],
    },
    {
      question: "What is complex system design?",
      answer: [
        "Complex system design is designing a product with several users and processes so that people can complete a task without losing capabilities the work needs. It isn't designing a brochure page.",
      ],
    },
    {
      question: "How is it different from website design?",
      answer: [
        "A brochure website leads to understanding and getting in touch. A system leads to finishing work: updating, approving, learning, managing. The tools are different because the task is different.",
      ],
    },
    {
      question: "Is there user research?",
      answer: [
        "The work is grounded in research. Every button, every animation and every choice is deliberate. I keep up with research and methods, and research wins arguments.",
        "How much research the product needs is decided in the discovery call.",
      ],
    },
    {
      question: "What do I get before development?",
      answer: [
        "A complete responsive design, and an interactive prototype that walks through the main scenarios, before a single line of code is written.",
      ],
    },
    {
      question: "How much does system design cost?",
      answer: [
        estimate,
        "A system with one role and a system with several processes and permission levels aren't the same scope.",
      ],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["practicalai", "awscience", "guesto", "chabad-club"],
  relatedSlugs: ["elearning", "mvp", "business-websites", "ai-agents"],
  cta: claims.ctaUx,
};

const elearning: ServiceDocument = {
  slug: "elearning",
  path: "/services/elearning",
  title: "Learning platforms and LMS development",
  description:
    "Learning platform and LMS development: specification, learning experience design and code, for learners and for the people who run the learning. By Mor Zeevi.",
  keyword: "Learning platform",
  heading: "Learning platforms and LMS development",
  answer: [
    p(
      "When I build a learning platform, I specify, design the learning experience and develop both the place where people learn and the side where the learning is managed. It can be an LMS or a digital course.",
    ),
    p(claims.learningUsers),
    p(
      "I have a degree in learning technologies from H.I.T (Holon Institute of Technology) and years of development experience, and the process is research-based.",
    ),
  ],
  showCatalog: false,
  sections: [
    {
      type: "prose",
      id: "kinds",
      heading: "Learning platforms and LMS systems",
      paragraphs: [
        p(
          "An LMS holds courses, enrolls learners and shows progress. A learning platform includes that, and also the learning experience design: the screens where people learn and practice.",
        ),
        [
          "When the system is crowded, the design work is ",
          links.ux,
          ". When it isn't clear yet what goes into version one, start with ",
          links.mvp,
          ".",
        ],
      ],
    },
    {
      type: "split",
      id: "fit",
      heading: "Who a learning platform is for",
      columns: [
        {
          heading: "Who it's for",
          items: [
            "An organization or founder building a learning platform, an LMS or a digital course.",
            "A product with learners, and also someone who manages content, enrollment and progress.",
            "Anyone who needs learning experience design, not just a nice screen.",
            "Anyone who wants specification, design, and sometimes development too, from one point of contact.",
          ],
        },
        {
          heading: "Who it isn't for",
          paragraphs: [p(referral)],
          items: [
            "Anyone who only wants a subscription to an off-the-shelf tool, with no specification and no development.",
            "A marketing site for a course, with no learning journey and no learner management.",
            "Training that is just a file to hand over, with no system and no learning journey.",
          ],
        },
      ],
    },
    {
      type: "steps",
      id: "process",
      heading: "What the process looks like",
      steps: [
        ...startSteps,
        {
          title: "Mapping both sides",
          detail: claims.learningUsers,
        },
        designStep,
        buildStep,
      ],
    },
    {
      type: "prose",
      id: "included",
      heading: "What's included",
      paragraphs: [
        p("For a learning platform or an LMS, the quote is built on these:"),
      ],
      items: [
        "Specification of the journey for the learner and for whoever manages the learning.",
        "Learning experience design: the course, practice and progress screens.",
        "A complete responsive design.",
        "An interactive prototype of the main scenarios, before code.",
        "A quote based on the specification, valid for 14 business days.",
        "Development in clean code, when the quote includes it.",
      ],
    },
    {
      type: "prose",
      id: "cost",
      heading: "How the cost is set",
      paragraphs: [
        p(estimate),
        p(
          "For a learning platform or an LMS, the scope moves with the product:",
        ),
      ],
      items: [
        "One course, or a platform with several courses and tracks.",
        "How many user types there are, and what each one needs to complete.",
        "Whether the content is already written, or you still need to decide what the learner does.",
        "Whether an existing system needs to be connected.",
        "Whether the work stays at specification and design, or continues into development.",
        "Ready content and quick feedback shorten the road.",
      ],
    },
  ],
  faq: [
    {
      question: "What is a learning platform?",
      answer: [
        "A learning platform is a system for the learner and for whoever manages the learning: content, practice, progress, and sometimes enrolling learners in a course.",
        claims.learningUsers,
      ],
    },
    {
      question: "What is an LMS?",
      answer: [
        "An LMS (learning management system) holds courses, enrolls learners and shows progress. A learning platform includes the system, and also the learning experience design of the screens where people learn.",
      ],
    },
    {
      question:
        "How is learning experience design different from website design?",
      answer: [
        "A website leads to understanding and getting in touch. Learning experience design is measured by whether the learner completes a track, and whether the person managing the learning can update content and see what's happening.",
      ],
    },
    {
      question: "Do you develop e-learning modules in Storyline or Articulate?",
      answer: [claims.learningScope],
    },
    {
      question: "How much does a learning platform cost?",
      answer: [
        estimate,
        "A single course and a learning system with several user types, tracks and integrations aren't the same scope.",
      ],
    },
    {
      question: "Is development included?",
      answer: [
        "Specification and design come before code. Development in clean code is included when the quote covers it, and the code stays yours.",
        ownership,
      ],
    },
  ],
  articleSlugs: [],
  projectSlugs: ["practicalai", "awscience"],
  relatedSlugs: ["ux-design", "mvp", "business-websites"],
  cta: claims.ctaLearning,
};

export const servicesEn: ServicesContent = {
  hub: servicesHub,
  services: [businessWebsites, mvp, aiAgents, uxDesign, elearning],
  chrome,
  ownerReviewClaims: ownerReviewClaimsEn,
};
