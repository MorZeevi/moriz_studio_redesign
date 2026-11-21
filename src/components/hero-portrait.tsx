import Image from "next/image";

export function HeroPortrait({ alt }: { alt: string }) {
  return (
    <div className="hero-portrait">
      <Image
        className="hero-portrait-image"
        src="/images/mor-hero-white-shirt.png"
        alt={alt}
        width={816}
        height={1224}
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 384px, calc(100vw - 64px)"
        preload
      />
    </div>
  );
}
