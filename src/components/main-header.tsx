import Image from "next/image";
import { LanguageLink } from "@/components/language-link";
import { Navigation } from "@/components/navigation";
import { SiteHeader } from "@/components/site-header";
import { StudioLogo } from "@/components/studio-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiquidLink } from "@/components/ui/liquid-link";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import { anchorHref } from "@/lib/anchor-href";

/**
 * The public site header: logo, section navigation, theme and language, and
 * the contact CTA. Off the homepage, pass the anchors that exist on the page;
 * the other section links then lead back to the homepage.
 */
export function MainHeader({
  content,
  locale,
  pageAnchors,
}: {
  content: SiteContent;
  locale: EnabledLocale;
  pageAnchors?: string[];
}) {
  return (
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
        <Navigation
          locale={locale}
          content={content.navigation}
          pageAnchors={pageAnchors}
        />
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
            href={anchorHref(
              content.navigation.contactLink.href,
              locale,
              pageAnchors,
            )}
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
  );
}
