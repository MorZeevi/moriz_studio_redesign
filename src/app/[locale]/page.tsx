import Image from "next/image";
import { notFound } from "next/navigation";
import { DevelopmentDemo } from "@/components/development-demo";
import { GettingStarted } from "@/components/getting-started";
import { HeroDescription } from "@/components/hero-description";
import { HeroHeading } from "@/components/hero-heading";
import { HeroVideo } from "@/components/hero-video";
import { LanguageLink } from "@/components/language-link";
import { LogoCarousel } from "@/components/logo-carousel";
import { Navigation } from "@/components/navigation";
import { PartyModeProvider } from "@/components/party-mode/party-mode-provider";
import { PartyModeToggle } from "@/components/party-mode/party-mode-toggle";
import { PixelReveal } from "@/components/pixel-reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectsSection } from "@/components/projects-section";
import { SecondaryScrollSurface } from "@/components/secondary-scroll-surface";
import { SiteFooter } from "@/components/site-footer";
import FallingText from "@/components/react-bits/FallingText";
import Noise from "@/components/react-bits/Noise";
import { StudioLogo } from "@/components/studio-logo";
import { Testimonials } from "@/components/testimonials";
import { LiquidLink } from "@/components/ui/liquid-link";
import {
  FloatingWhatsApp,
  MediaPlaceholder,
  Section,
  TextLines,
} from "@/components/wireframe";
import { isEnabledLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projectCard } from "@/lib/cms/project-card";
import { getPublicProjects } from "@/lib/cms/queries";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();
  const content = await getDictionary(locale);
  const projects = await getPublicProjects("homepage");
  return (
    <PartyModeProvider labels={content.advantages.party}>
      <PixelReveal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>

      <header className="site-header">
        <div className="hero-shell site-header-inner">
          <div className="header-brand">
            <StudioLogo
              name={content.studioName}
              locale={locale}
              className="studio-wordmark"
            />
            {/* Desktop: theme and language sit beside the wordmark. */}
            <div className="header-brand-controls">
              <ThemeToggle labels={content.theme} />
              <LanguageLink
                locale={locale}
                content={content.navigation.languages}
              />
            </div>
          </div>
          <div className="header-theme-mobile">
            <ThemeToggle labels={content.theme} />
          </div>
          <Navigation locale={locale} content={content.navigation} />
          <div className="header-actions">
            <LiquidLink
              className="header-contact-link"
              variant="secondary"
              href={content.navigation.contactLink.href}
              icon={
                <Image
                  src="/images/mor-avatar-cutout.webp"
                  alt=""
                  width={600}
                  height={600}
                  sizes="48px"
                />
              }
            >
              {content.navigation.contactLink.label}
            </LiquidLink>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section
          id="hero"
          data-wireframe-section="hero"
          aria-labelledby="hero-heading"
          className="hero-background"
        >
          <Noise
            patternSize={340}
            patternScaleX={1}
            patternScaleY={0.3}
            patternRefreshInterval={2}
            patternAlpha={22}
          />
          <div className="hero-shell hero">
            <div className="hero-heading-block">
              <HeroHeading content={content.hero.heading} />
            </div>
            <div className="hero-copy">
              <HeroDescription
                className="hero-description"
                content={content.hero.description}
              />
              <div className="hero-actions">
                <LiquidLink
                  className="hero-projects-link"
                  arrow="down"
                  href="#projects"
                  data-party-react="cta"
                >
                  {content.hero.projectsLink}
                </LiquidLink>
              </div>
            </div>
            <HeroVideo labels={content.hero.video} />
            <LogoCarousel labels={content.logoCarousel} />
          </div>
          <div className="hero-shell hero-video-stage">
            <div
              className="hero-video-end"
              data-hero-video-end
              aria-hidden="true"
            />
          </div>
        </section>

        <Section
          id="advantages"
          title={content.advantages.heading}
          showHeading={false}
          className="advantages-section"
        >
          <Noise
            patternSize={340}
            patternScaleX={1}
            patternScaleY={0.3}
            patternRefreshInterval={2}
            patternAlpha={22}
          />
          <div className="advantages-grid grid gap-9 lg:grid-cols-3 lg:gap-12">
            {content.advantages.themes.map((theme, index) => (
              <div
                key={theme}
                className={`min-w-0 advantages-card${index === 1 ? " advantages-card--interactive" : ""}`}
              >
                <h3 className="max-w-[18ch] text-xl leading-relaxed font-medium lg:text-2xl">
                  {theme}
                </h3>
                <p className="mt-5 text-sm text-muted">
                  {index === 0
                    ? content.advantages.research.description
                    : index === 1
                      ? content.advantages.experience.description
                      : content.advantages.development.description}
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
                  <DevelopmentDemo labels={content.advantages.development.demo} />
                )}
              </div>
            ))}
          </div>
        </Section>

        <ProjectsSection
          projects={projects.map((project) => projectCard(project, "homepage"))}
          locale={locale}
          content={content.projects}
          partyReaction
        />

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
          showHeading={false}
          className="testimonials-section bg-surface"
        >
          <Noise
            patternSize={340}
            patternScaleX={1}
            patternScaleY={0.3}
            patternRefreshInterval={2}
            patternAlpha={22}
          />
          <Testimonials content={content.testimonials} />
        </Section>

        <SecondaryScrollSurface>
          <Section id="getting-started" title={content.gettingStarted.heading}>
            <GettingStarted
              steps={content.gettingStarted.steps}
              locale={locale}
            />
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
        </SecondaryScrollSurface>

        <Section
          id="contact"
          title={content.contact.heading}
          className="bg-surface"
        >
          <p className="text-lg text-muted">{content.contact.information}</p>
          <TextLines className="mt-6 max-w-lg" />
        </Section>
      </main>

      <SiteFooter content={content} locale={locale} />

      <FloatingWhatsApp labels={content.whatsapp} />
    </PartyModeProvider>
  );
}
