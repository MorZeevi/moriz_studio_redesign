import type { ReactNode } from "react";

export function Section({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`wireframe-section ${className}`}
      data-wireframe-section={id}
    >
      <div className="page-shell">
        <h2 id={`${id}-heading`} className="section-heading">
          {title}
        </h2>
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
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.6-4.8a8.5 8.5 0 1 1 15.9-4.2Z" />
      <path d="M8.2 7.8c.3 3.5 2.5 5.7 6 6l1.2-1.5-2.1-1.2-.8.8a7 7 0 0 1-2.3-2.3l.8-.8L9.8 6.7 8.2 7.8Z" />
    </svg>
  );
}

export function FloatingWhatsApp({
  labels,
}: {
  labels: { label: string; unconfiguredLabel: string };
}) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
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
