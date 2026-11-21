"use client";

import { useMemo } from "react";
import Image from "./cms-image";
import styles from "./projects.module.css";
import GridMotion from "./react-bits/GridMotion";

/** Homepage card: a tilted, moving wall built from the project's images. */
export function ProjectGridWall({ images }: { images: string[] }) {
  const items = useMemo(
    () =>
      images.map((src) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(min-width: 960px) 18vw, 30vw"
        />
      )),
    [images],
  );
  return (
    <div className={styles.media}>
      <GridMotion
        items={items}
        gap={12}
        radius={10}
        dim={0.25}
        fade={0.3}
        tileColor="var(--project-rule)"
        className={styles.wall}
      />
    </div>
  );
}
