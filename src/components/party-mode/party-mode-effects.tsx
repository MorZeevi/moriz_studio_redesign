"use client";

import Image from "next/image";
import {
  type CSSProperties,
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { useTheme } from "@/components/theme-provider";
import { partyPoster } from "./media";
import { PartyAnimations } from "./party-animations";
import { partyCyan, reflectionSpecs } from "./party-light-model";
import styles from "./party-mode.module.css";
import type { PartyPhase } from "./party-mode-provider";

export const PartyModeEffects = memo(function PartyModeEffects({
  enabled,
  onPhase,
  onFailure,
}: {
  enabled: boolean;
  onPhase: (phase: PartyPhase) => void;
  onFailure: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controller = useRef<PartyAnimations | null>(null);
  const { resolvedTheme } = useTheme();
  const latest = useRef({ onPhase, onFailure });
  latest.current = { onPhase, onFailure };

  useEffect(() => {
    if (!rootRef.current) return;
    const animation = new PartyAnimations(rootRef.current, {
      onPhase: (phase) => latest.current.onPhase(phase),
      onFailure: () => latest.current.onFailure(),
    });
    controller.current = animation;
    return () => {
      animation.destroy();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    controller.current?.request(enabled);
  }, [enabled]);

  useLayoutEffect(() => {
    if (document.documentElement.dataset.theme === resolvedTheme)
      controller.current?.refreshTheme();
  }, [resolvedTheme]);

  return (
    <div
      ref={rootRef}
      className={styles.effects}
      data-party-effects
      style={{ "--party-cyan": partyCyan } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.atmosphere} data-party-atmosphere />
      <div className={styles.reflections} data-party-reflections>
        {reflectionSpecs.map(({ id, color, size, soft, brightness }, index) => (
          <span
            key={id}
            className={styles.reflection}
            data-party-reflection={index}
            data-soft={soft}
            style={
              {
                "--reflection-color": color,
                "--reflection-size": size,
                "--reflection-brightness": brightness,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className={styles.beams} data-party-beams>
        {[0, 1, 2].map((index) => (
          <span key={index} className={styles.beam} data-party-beam={index} />
        ))}
      </div>
      <div className={styles.rig} data-party-rig>
        <span className={styles.cable} />
        <div className={styles.ball}>
          <Image
            src={partyPoster}
            alt=""
            width={640}
            height={640}
            loading="eager"
            unoptimized
            className={styles.poster}
            data-party-poster
          />
          <video
            className={styles.video}
            data-party-video
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
});
