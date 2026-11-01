import { FloatingActions } from "@/components/floating-actions";
import { MainHeader } from "@/components/main-header";
import { SiteFooter } from "@/components/site-footer";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";

export function ArticlesFrame({
  content,
  locale,
  children,
}: {
  content: SiteContent;
  locale: EnabledLocale;
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-5 focus:top-5 focus:z-30 focus:bg-background focus:p-4"
      >
        {content.skipToContent}
      </a>
      <MainHeader
        content={content}
        locale={locale}
        pageAnchors={["#contact"]}
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter content={content} locale={locale} homepage={false} />
      <FloatingActions
        content={content.floatingActions}
        ask={content.askAi}
        mobileWhatsappOnly
      />
    </>
  );
}
