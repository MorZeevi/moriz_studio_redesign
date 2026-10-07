"use client";

import Link from "next/link";
import { useState } from "react";
import type { EnabledLocale } from "@/i18n/config";
import type { SiteContent } from "@/i18n/dictionaries";
import styles from "./font-preview.module.css";
import { Button } from "./ui/button";
import { HeroDescription } from "./hero-description";

type FontSample = { name: string; family: string; weight: number };

export function FontPreview({
  locale,
  labels,
  hero,
  samples,
}: {
  locale: EnabledLocale;
  labels: SiteContent["fontPreview"];
  hero: SiteContent["hero"];
  samples: FontSample[];
}) {
  const [heading, setHeading] = useState(hero.heading);
  const [size, setSize] = useState(64);

  return (
    <main className={`hero-shell ${styles.preview}`}>
      <header className={styles.header}>
        <Link href={`/${locale}`}>{labels.back}</Link>
        <h1>{labels.title}</h1>
        <p>{labels.introduction}</p>
      </header>

      <div className={styles.controls}>
        <label className={styles.textControl} htmlFor="font-preview-text">
          {labels.textLabel}
          <textarea
            id="font-preview-text"
            value={heading}
            rows={2}
            onChange={(event) => setHeading(event.target.value)}
          />
        </label>
        <label className={styles.sizeControl} htmlFor="font-preview-size">
          <span>
            {labels.sizeLabel} <bdi>{size}px</bdi>
          </span>
          <input
            id="font-preview-size"
            type="range"
            min="32"
            max="96"
            step="1"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </label>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setHeading(hero.heading);
            setSize(64);
          }}
        >
          {labels.reset}
        </Button>
      </div>

      <div className={styles.samples}>
        {samples.map((sample, index) => (
          <section
            key={sample.name}
            className={styles.sample}
            aria-labelledby={`font-sample-${index}`}
            data-font-sample={sample.name}
          >
            <h2 id={`font-sample-${index}`} className={styles.fontName}>
              <bdi dir="ltr">{sample.name}</bdi>
            </h2>
            <div
              className={styles.specimen}
              style={{ fontFamily: sample.family, fontWeight: sample.weight }}
            >
              <p
                className={styles.headline}
                style={{ fontSize: `${size / 16}rem` }}
              >
                {heading}
              </p>
              <HeroDescription
                className={styles.description}
                content={hero.description}
              />
              <span className={styles.cta}>{hero.projectsLink}</span>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
