import { notFound } from "next/navigation";
import { HeroDescription } from "@/components/hero-description";
import { LanguageLink } from "@/components/language-link";
import { LogoCarousel } from "@/components/logo-carousel";
import { Navigation } from "@/components/navigation";
import { PartyHeadingLight } from "@/components/party-mode/party-heading-light";
import partyStyles from "@/components/party-mode/party-mode.module.css";
import { PartyModeProvider } from "@/components/party-mode/party-mode-provider";
import { PartyModeToggle } from "@/components/party-mode/party-mode-toggle";
import FallingText from "@/components/react-bits/FallingText";
import {
  FloatingWhatsApp,
  MediaPlaceholder,
  Section,
  TextLines,
} from "@/components/wireframe";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Unassigned review slots. Website project selection is recorded in docs/04;
// neither the Home selection nor its project order has been decided.
const projectSlots = [1, 2, 3];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const stepNumbers = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
  });
  return (
    <PartyModeProvider labels={content.advantages.party}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>

      <header className="hero-shell site-header">
        <bdi className="studio-wordmark">{content.studioName}</bdi>
        <Navigation locale={locale} content={content.navigation} />
        <div className="header-actions">
          <LanguageLink
            locale={locale}
            content={content.navigation.languages}
          />
          <a className="header-cta" href={content.navigation.cta.href}>
            {content.navigation.cta.label}
          </a>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section
          id="hero"
          data-wireframe-section="hero"
          aria-labelledby="hero-heading"
          className="hero-shell hero"
        >
          <h1
            id="hero-heading"
            className={`hero-heading ${partyStyles.lightHeading}`}
            data-party-react="heading"
          >
            {content.hero.heading}
            <PartyHeadingLight text={content.hero.heading} />
          </h1>
          <div className="hero-video-placeholder" aria-hidden="true" />
          <div className="hero-copy">
            <HeroDescription
              className="hero-description"
              content={content.hero.description}
            />
            <a
              className="hero-projects-link"
              href="#projects"
              data-party-react="cta"
            >
              {content.hero.projectsLink}
            </a>
          </div>
        </section>

        <LogoCarousel labels={content.logoCarousel} />

        <Section
          id="advantages"
          title={content.advantages.heading}
          partyReaction
        >
          <div className="grid gap-9 md:grid-cols-3 md:gap-12">
            {content.advantages.themes.map((theme, index) => (
              <div key={theme} className="min-w-0">
                <h3 className="max-w-[18ch] text-xl leading-relaxed font-medium lg:text-2xl">
                  {theme}
                </h3>
                <p className="mt-5 text-sm text-muted">
                  {index === 0
                    ? content.advantages.research.description
                    : content.advantages.supportingInformation}
                </p>
                {index === 0 ? (
                  <FallingText
                    items={content.advantages.research.terms}
                    label={content.advantages.research.termsLabel}
                    partyReactive
                  />
                ) : index === 1 ? (
                  <PartyModeToggle />
                ) : (
                  <TextLines className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section id="projects" title={content.projects.heading} partyReaction>
          <div className="space-y-12 md:space-y-16">
            {projectSlots.map((slot) => (
              <article
                key={slot}
                className="grid items-center gap-7 md:grid-cols-[1fr_1.7fr] md:gap-14"
                aria-labelledby={`project-slot-${slot}`}
              >
                <div className="min-w-0">
                  <h3
                    id={`project-slot-${slot}`}
                    className="text-2xl font-medium"
                  >
                    {content.projects.projectName}
                  </h3>
                  <p className="mt-5 text-sm text-muted">
                    {content.projects.description}
                  </p>
                  <TextLines className="mt-4" />
                  <p className="mt-7 text-sm text-muted">
                    {content.projects.linkPlaceholder}
                  </p>
                </div>
                <MediaPlaceholder
                  label={content.projects.visualLabel}
                  className="aspect-[16/10]"
                />
              </article>
            ))}
          </div>
        </Section>

        <Section id="about" title={content.about.heading}>
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr] md:gap-24">
            <div className="max-w-lg">
              <p className="text-xl leading-relaxed">
                {content.about.information}
              </p>
              <TextLines className="mt-6" />
              <p className="mt-7 text-sm text-muted">
                {content.about.linkPlaceholder}
              </p>
            </div>
            <MediaPlaceholder
              label={content.about.visualLabel}
              className="aspect-[4/3]"
            />
          </div>
        </Section>

        <Section
          id="testimonials"
          title={content.testimonials.heading}
          className="bg-surface"
        >
          <div className="grid gap-10 md:grid-cols-2 md:gap-20">
            {[1, 2].map((slot) => (
              <div key={slot} className="min-w-0">
                <p className="text-xl">
                  {content.testimonials.quotePlaceholder}
                </p>
                <TextLines className="mt-6" />
                <p className="mt-7 text-sm text-muted">
                  {content.testimonials.attribution}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="getting-started" title={content.gettingStarted.heading}>
          <ol className="grid gap-9 md:grid-cols-3 md:gap-12">
            {content.gettingStarted.steps.map((step, index) => (
              <li key={step.title} className="min-w-0">
                <span
                  aria-hidden="true"
                  className="mb-5 block text-sm text-muted"
                >
                  <bdi>{stepNumbers.format(index + 1)}</bdi>
                </span>
                <h3 className="text-xl font-medium">{step.title}</h3>
                <p className="mt-3 text-sm text-muted">
                  <bdi>{step.detail}</bdi>
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="faq" title={content.faq.heading}>
          <div className="max-w-4xl border-t border-line">
            {content.faq.questions.map((question) => (
              <details key={question} className="faq-item border-b border-line">
                <summary>
                  <span className="text-lg">{question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-2xl font-light"
                  >
                    <span className="faq-plus">+</span>
                    <span className="faq-minus">−</span>
                  </span>
                </summary>
                <div className="max-w-2xl pb-7">
                  <p className="text-sm text-muted">
                    {content.faq.answerPlaceholder}
                  </p>
                  <TextLines className="mt-4" />
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section
          id="contact"
          title={content.contact.heading}
          className="bg-surface"
        >
          <p className="text-lg text-muted">{content.contact.information}</p>
          <TextLines className="mt-6 max-w-lg" />
        </Section>
      </main>

      <footer
        data-wireframe-section="footer"
        className="border-t border-line pt-8 pb-28"
      >
        <div className="page-shell flex flex-wrap items-center justify-between gap-6 text-sm">
          <bdi className="font-semibold">{content.studioName}</bdi>
          <span className="text-muted">{content.footer.information}</span>
        </div>
      </footer>

      <FloatingWhatsApp labels={content.whatsapp} />
    </PartyModeProvider>
  );
}
