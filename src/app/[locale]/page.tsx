import Image from "next/image";
import { notFound } from "next/navigation";
import { AboutGallery } from "@/components/about-gallery";
import { AboutMe } from "@/components/about-me";
import { AdvantagesMotion } from "@/components/advantages-motion";
import { Faq } from "@/components/faq";
import { FloatingActions } from "@/components/floating-actions";
import { GettingStarted } from "@/components/getting-started";
import { HeroDescription } from "@/components/hero-description";
import { HeroHeading } from "@/components/hero-heading";
import { HeroVideo } from "@/components/hero-video";
import { HomepagePattern } from "@/components/homepage-pattern";
import { InfinityLoop } from "@/components/infinity-loop";
import { LanguageLink } from "@/components/language-link";
import { LogoCarousel } from "@/components/logo-carousel";
import { Navigation } from "@/components/navigation";
import { PartyModeProvider } from "@/components/party-mode/party-mode-provider";
import { PartyModeToggle } from "@/components/party-mode/party-mode-toggle";
import { PixelReveal } from "@/components/pixel-reveal";
import { ProjectsSection } from "@/components/projects-section";
import FallingText from "@/components/react-bits/FallingText";
import { SecondaryScrollSurface } from "@/components/secondary-scroll-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StudioLogo } from "@/components/studio-logo";
import { Testimonials } from "@/components/testimonials";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiquidLink } from "@/components/ui/liquid-link";
import { Section } from "@/components/wireframe";
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

      <SiteHeader>
        <div className="hero-shell site-header-inner">
          <div className="header-brand">
            <StudioLogo
              name={content.studioName}
              locale={locale}
              className="studio-wordmark"
            />
          </div>
          <div className="header-theme-mobile">
            <ThemeToggle labels={content.theme} />
          </div>
          <Navigation locale={locale} content={content.navigation} />
          <div className="header-actions">
            {/* Desktop: theme and language sit together beside the CTA. */}
            <div className="header-controls">
              <ThemeToggle labels={content.theme} />
              <LanguageLink
                locale={locale}
                content={content.navigation.languages}
              />
            </div>
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
      </SiteHeader>

      <main id="main-content" tabIndex={-1}>
        <HomepagePattern>
          <section
            id="hero"
            data-wireframe-section="hero"
            aria-labelledby="hero-heading"
            className="hero-background"
          >
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
                    <h3>{theme}</h3>
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
          projects={projects.map((project) => projectCard(project, "homepage"))}
          locale={locale}
          content={content.projects}
          partyReaction
        />

        <Section id="about" title={content.about.heading} showHeading={false}>
          <AboutMe content={content.about} />
        </Section>

        <AboutGallery content={content.aboutGallery} />

        <Section
          id="testimonials"
          title={content.testimonials.heading}
          showHeading={false}
          className="testimonials-section"
        >
          <Testimonials content={content.testimonials} />
        </Section>

        <SecondaryScrollSurface>
          <Section id="getting-started" title={content.gettingStarted.heading}>
            <GettingStarted
              steps={content.gettingStarted.steps}
              locale={locale}
            />
          </Section>

          <Section id="faq" title={content.faq.heading} showHeading={false}>
            <Faq content={content.faq} />
          </Section>
        </SecondaryScrollSurface>
      </main>

      <SiteFooter content={content} locale={locale} />

      <FloatingActions content={content.floatingActions} ask={content.askAi} />
    </PartyModeProvider>
  );
}
