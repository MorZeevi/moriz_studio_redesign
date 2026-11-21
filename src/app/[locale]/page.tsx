import { notFound } from "next/navigation";
import { AboutGallery } from "@/components/about-gallery";
import { AboutMe } from "@/components/about-me";
import { AdvantagesMotion } from "@/components/advantages-motion";
import { ContactInvitation } from "@/components/contact-invitation";
import { DesignQuote } from "@/components/design-quote";
import { DiagnosticBanner } from "@/components/diagnostic-banner";
import { Faq } from "@/components/faq";
import { FloatingActions } from "@/components/floating-actions";
import { GettingStarted } from "@/components/getting-started";
import { HeroDescription } from "@/components/hero-description";
import { HeroHeading } from "@/components/hero-heading";
import { HeroPortrait } from "@/components/hero-portrait";
import { HeroVideo } from "@/components/hero-video";
import { HomepagePattern } from "@/components/homepage-pattern";
import { InfinityLoop } from "@/components/infinity-loop";
import { JsonLd } from "@/components/json-ld";
import { LogoCarousel } from "@/components/logo-carousel";
import { MainHeader } from "@/components/main-header";
import { PartyModeProvider } from "@/components/party-mode/party-mode-provider";
import { PartyModeToggle } from "@/components/party-mode/party-mode-toggle";
import { conversionCopyFor } from "@/content/conversion-copy";
import { ProjectsSection } from "@/components/projects-section";
import FallingText from "@/components/react-bits/FallingText";
import { SecondaryScrollSurface } from "@/components/secondary-scroll-surface";
import { SiteFooter } from "@/components/site-footer";
import { Testimonials } from "@/components/testimonials";
import { LiquidLink } from "@/components/ui/liquid-link";
import { Section } from "@/components/wireframe";
import { hasDiagnostic, isEnabledLocale, localeConfig } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projectCard } from "@/lib/cms/project-card";
import { getPublicProjects } from "@/lib/cms/queries";
import { homeStructuredData } from "@/lib/structured-data";
import { whatsappContactUrl } from "@/lib/whatsapp";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const conversionCopy = conversionCopyFor(locale);
  const whatsappHref = whatsappContactUrl(locale);
  const projects = await getPublicProjects("homepage");
  return (
    <PartyModeProvider labels={content.advantages.party}>
      <JsonLd data={homeStructuredData(content, locale)} />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>

      <MainHeader content={content} locale={locale} />

      <main id="main-content" tabIndex={-1}>
        {/* The hero stands on a clean ground; the wordmark pattern begins
            with the advantages below it. */}
        <section
          id="hero"
          data-wireframe-section="hero"
          aria-labelledby="hero-heading"
          className="hero-background"
        >
          <div className="hero-shell hero">
            {/* The first screen: the message and the person. On phones it
                fills the screen, with the portrait above the action. */}
            <div className="hero-top">
              <div className="hero-message">
                <div className="hero-heading-block">
                  <p className="hero-proof">
                    {/* A stack of faces beside the figure: stock portraits the
                      owner supplied, decoration only, so no alt text. */}
                    <span className="hero-proof-faces" aria-hidden="true">
                      {[1, 2, 3, 4].map((face) => (
                        // biome-ignore lint/performance/noImgElement: four tiny local avatars, already small files.
                        <img
                          key={face}
                          src={`/images/proof-faces/${face}.webp`}
                          alt=""
                          width={36}
                          height={36}
                        />
                      ))}
                    </span>
                    {conversionCopy.proof.before}{" "}
                    <strong dir="ltr">{conversionCopy.proof.value}</strong>{" "}
                    {conversionCopy.proof.label}
                    <span className="hero-proof-detail">
                      {" "}
                      {conversionCopy.proof.detail}
                    </span>
                  </p>
                  <HeroHeading content={content.hero.heading} />
                </div>
                {/* Pinned to the foot of the hero on desktop: figures, copy,
                  actions. */}
                <div className="hero-lower">
                  <HeroDescription
                    className="hero-description"
                    content={content.hero.description}
                  />
                  <div className="hero-actions" data-contact-placement="hero">
                    {whatsappHref && (
                      <LiquidLink
                        className="hero-contact-link"
                        variant="secondary"
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {conversionCopy.heroAction}
                      </LiquidLink>
                    )}
                    <a className="hero-projects-link" href="#projects">
                      {content.hero.projectsLink}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              {/* The person. */}
              <div className="hero-visual">
                {/* Desktop only: her hello in outline letters, turned to run
                  down the outer page edge: the left edge in Hebrew, the
                  right edge in English. */}
                <svg
                  className="hero-note"
                  viewBox="0 0 150 1000"
                  role="img"
                  aria-label={content.hero.note}
                >
                  {localeConfig[locale].direction === "rtl" ? (
                    // Hebrew: on the edge itself, from the top of the hero
                    // to its foot.
                    <text
                      className="hero-note-line"
                      transform="translate(104 0) rotate(-90)"
                      textAnchor="start"
                      textLength="1000"
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {content.hero.note}
                    </text>
                  ) : (
                    <text
                      className="hero-note-line"
                      transform="translate(84 26) rotate(90)"
                      textAnchor="start"
                    >
                      {content.hero.note}
                    </text>
                  )}
                </svg>
                <HeroPortrait alt={content.hero.portraitAlt} />
              </div>
            </div>
            <LogoCarousel labels={content.logoCarousel} locale={locale} />
            {/* The work, under the client logos. */}
            <HeroVideo labels={content.hero.video} />
          </div>
        </section>

        <HomepagePattern>
          <Section
            id="advantages"
            title={content.advantages.heading}
            showHeading={false}
            className="advantages-section"
          >
            <AdvantagesMotion>
              {content.advantages.themes.map((theme, index) => (
                <article key={theme} className="advantages-card min-w-0">
                  <div className="advantages-stage">
                    {index === 0 ? (
                      <FallingText
                        items={content.advantages.research.terms}
                        label={content.advantages.research.termsLabel}
                        partyReactive
                      />
                    ) : index === 1 ? (
                      <PartyModeToggle />
                    ) : (
                      <InfinityLoop
                        labels={content.advantages.development.infinity}
                      />
                    )}
                  </div>
                  <div className="advantages-body">
                    <h2>{theme}</h2>
                    <p>
                      {index === 0
                        ? content.advantages.research.description
                        : index === 1
                          ? content.advantages.experience.description
                          : content.advantages.development.description}
                    </p>
                  </div>
                </article>
              ))}
            </AdvantagesMotion>
          </Section>
        </HomepagePattern>

        <ProjectsSection
          projects={projects.map((project) =>
            projectCard(project, "homepage", locale),
          )}
          locale={locale}
          content={content.projects}
          partyReaction
        />

        <ContactInvitation
          locale={locale}
          shell
          placement="after-projects"
          text={conversionCopy.invitations.afterProjects}
        />

        <Section id="about" title={content.about.heading} showHeading={false}>
          <AboutMe content={content.about} />
        </Section>

        <AboutGallery content={content.aboutGallery} />

        <Section
          id="testimonials"
          title={content.testimonials.heading}
          className="testimonials-section"
        >
          <Testimonials content={content.testimonials} />
        </Section>

        <SecondaryScrollSurface>
          <Section id="getting-started" title={content.gettingStarted.heading}>
            <GettingStarted steps={content.gettingStarted.steps} />
            <ContactInvitation
              locale={locale}
              placement="after-process"
              text={conversionCopy.invitations.afterProcess}
            />
          </Section>
        </SecondaryScrollSurface>

        <AboutGallery content={content.aboutGallery} reverse />

        <Section
          id="design-quote"
          title={content.designQuote.label}
          showHeading={false}
        >
          <DesignQuote content={content.designQuote} />
        </Section>

        {hasDiagnostic(locale) && (
          <DiagnosticBanner content={content.diagnosticBanner} />
        )}

        <Section id="faq" title={content.faq.heading} showHeading={false}>
          <Faq content={content.faq} locale={locale} />
        </Section>
      </main>

      <SiteFooter content={content} locale={locale} />

      <FloatingActions
        content={content.floatingActions}
        ask={content.askAi}
        locale={locale}
        mobileWhatsappOnly
      />
    </PartyModeProvider>
  );
}
