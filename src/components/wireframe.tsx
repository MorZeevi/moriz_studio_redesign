import type { ReactNode } from "react";
import { PartyHeadingLight } from "./party-mode/party-heading-light";
import partyStyles from "./party-mode/party-mode.module.css";

export function Section({
  id,
  title,
  children,
  className = "",
  partyReaction = false,
  showHeading = true,
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  partyReaction?: boolean;
  showHeading?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={showHeading ? `${id}-heading` : undefined}
      aria-label={showHeading ? undefined : title}
      className={`wireframe-section ${className}`}
      data-wireframe-section={id}
    >
      <div className="page-shell">
        {showHeading && (
          <h2
            id={`${id}-heading`}
            className={`section-heading${partyReaction ? ` ${partyStyles.lightHeading}` : ""}`}
            data-party-react={partyReaction ? "heading" : undefined}
          >
            {title}
            {partyReaction && <PartyHeadingLight text={title} />}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

export function TextLines({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-3 ${className}`}>
      <div className="wireframe-line w-full" />
      <div className="wireframe-line w-11/12" />
      <div className="wireframe-line w-3/5" />
    </div>
  );
}

export function MediaPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={`media-placeholder ${className}`}>
      <span>{label}</span>
    </div>
  );
}

function ChatIcon() {
  return (
    <span className="floating-whatsapp-icon" aria-hidden="true" />
  );
}

export function FloatingWhatsApp({
  labels,
}: {
  labels: { label: string; unconfiguredLabel: string };
}) {
  const number =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "972522937174";
  const hasDestination = /^[1-9]\d{7,14}$/.test(number);
  const className = "floating-whatsapp";

  if (!hasDestination) {
    return (
      <button
        type="button"
        className={className}
        disabled
        aria-label={labels.unconfiguredLabel}
        title={labels.unconfiguredLabel}
        data-whatsapp-state="unconfigured"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <a
      href={`https://wa.me/${number}`}
      className={className}
      aria-label={labels.label}
      data-whatsapp-state="configured"
    >
      <ChatIcon />
    </a>
  );
}
