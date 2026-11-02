import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";

export type LlmsLink = {
  title: string;
  slug: string;
  description?: string;
};

function absolute(siteUrl: string, locale: EnabledLocale, path = "") {
  return `${siteUrl}/${locale}${path}`;
}

function oneLine(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function faq(content: SiteContent, includes: string) {
  return content.faq.questions.find((item) => item.question.includes(includes));
}

function answer(content: SiteContent, includes: string) {
  return faq(content, includes)?.answer.join("\n\n");
}

function creationSentence(content: SiteContent) {
  const about = content.about.paragraphs
    .flat()
    .map((segment) => segment.text)
    .join("");
  const marker = "אני יוצרת ";
  const start = about.indexOf(marker);
  if (start < 0) return "";
  const end = about.indexOf(".", start);
  return about.slice(start, end >= 0 ? end + 1 : undefined).trim();
}

function linkLine(label: string, url: string, description?: string) {
  const text = oneLine(description);
  return text ? `- [${label}](${url}): ${text}` : `- [${label}](${url})`;
}

/**
 * Plain-text summary for AI engines. Every sentence is copied from the site
 * dictionary or from a published page's stored description. No prices.
 */
export function renderLlmsTxt({
  content,
  siteUrl,
  locale,
  whatsappUrl,
  projects,
  articles,
}: {
  content: SiteContent;
  siteUrl: string;
  locale: EnabledLocale;
  whatsappUrl: string | null;
  projects: LlmsLink[];
  articles: LlmsLink[];
}): string {
  const home = absolute(siteUrl, locale);
  const lines: string[] = [
    `# ${content.studioName}`,
    "",
    `> ${content.metadata.description}`,
    "",
    "## מי אני",
    "",
  ];

  const intro =
    content.about.paragraphs[0]?.map((segment) => segment.text).join("") ?? "";
  const role = content.hero.portraitAlt.split("—")[1]?.trim();
  lines.push(role ? `${intro} ${role}.` : intro, "");
  for (const paragraph of content.about.paragraphs.slice(1)) {
    lines.push(
      paragraph
        .map((segment) => segment.text)
        .join("")
        .trim(),
      "",
    );
  }
  for (const credential of content.about.credentials) {
    const detail = credential.detail ? `. ${credential.detail}` : "";
    lines.push(`- ${credential.value} — ${credential.label}${detail}`);
  }
  const alone = answer(content, "עובדת לבד");
  if (alone) lines.push("", alone);

  lines.push("", `## ${content.projects.caseStudy.services}`, "");
  const offered = answer(content, "אפיון, עיצוב ופיתוח");
  if (offered) lines.push(offered, "");
  const themeCopy = [
    content.advantages.research.description,
    content.advantages.experience.description,
    content.advantages.development.description,
  ];
  content.advantages.themes.forEach((theme, index) => {
    const description = themeCopy[index];
    if (description) lines.push(`- ${theme}: ${description}`);
  });
  const creation = creationSentence(content);
  if (creation) lines.push("", creation);
  const platform = faq(content, "וורדפרס");
  if (platform) {
    lines.push("", platform.question, "", platform.answer.join("\n\n"));
  }
  const ai = answer(content, "AI");
  if (ai) lines.push("", ai);

  lines.push("", `## ${content.gettingStarted.heading}`, "");
  content.gettingStarted.steps.forEach((step, index) => {
    lines.push(`${index + 1}. ${step.title}. ${step.detail}`);
  });
  const duration = answer(content, "כמה זמן");
  if (duration) lines.push("", duration);

  lines.push("", "## בעלות ואחריות", "");
  for (const topic of ["למי שייכים", "אחריות", "לתחזק"]) {
    const item = faq(content, topic);
    if (!item) continue;
    lines.push(item.question, "", item.answer.join("\n\n"), "");
  }

  lines.push("## יצירת קשר", "");
  lines.push(`- ${content.contact.details.email}`);
  lines.push(`- ${content.contact.details.phone}`);
  if (whatsappUrl)
    lines.push(`- ${content.contact.details.whatsapp}: ${whatsappUrl}`);
  lines.push(
    linkLine(
      content.contact.heading,
      `${home}#contact`,
      content.contact.description,
    ),
  );

  lines.push("", "## עמודים", "");
  lines.push(linkLine("עמוד הבית", home, content.metadata.description));
  lines.push(
    linkLine(
      content.projects.archive.heading,
      `${home}/projects`,
      content.projects.archive.description,
    ),
  );
  for (const project of projects) {
    lines.push(
      linkLine(
        project.title,
        `${home}/projects/${encodeURIComponent(project.slug)}`,
        project.description,
      ),
    );
  }
  lines.push(
    linkLine(
      content.articles.heading,
      `${home}/articles`,
      content.articles.description,
    ),
  );
  for (const article of articles) {
    lines.push(
      linkLine(
        article.title,
        `${home}/articles/${encodeURIComponent(article.slug)}`,
        article.description,
      ),
    );
  }
  lines.push(
    linkLine(
      content.privacyPolicy.title,
      `${home}/privacy-policy`,
      content.privacyPolicy.lastUpdated,
    ),
  );

  lines.push("", `## ${content.footer.socialsHeading}`, "");
  for (const social of content.footer.socials) {
    lines.push(`- [${social.label}](${social.href})`);
  }

  lines.push(
    "",
    `האתר בעברית בלבד. כתובת ${siteUrl}/en מופנית באופן קבוע אל ${home}.`,
    "",
  );
  return lines.join("\n");
}
