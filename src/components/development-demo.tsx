"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./development-demo.module.css";

type DevelopmentDemoLabels = {
  title: string;
  note: string;
  wireframe: string;
  live: string;
  activate: string;
  reset: string;
  before: string;
  completed: string;
  tasks: readonly string[];
};

export function DevelopmentDemo({ labels }: { labels: DevelopmentDemoLabels }) {
  const titleId = useId();
  const firstTask = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (live) firstTask.current?.focus({ preventScroll: true });
  }, [live]);

  function toggleStage() {
    setCompleted([]);
    setLive((previous) => !previous);
  }

  return (
    <div
      className={styles.demo}
      data-development-demo
      data-stage={live ? "live" : "wireframe"}
    >
      <div className={styles.toolbar}>
        <span className={styles.stage}>
          {live ? labels.live : labels.wireframe}
        </span>
        <span className={styles.note}>{labels.note}</span>
      </div>
      <fieldset className={styles.app} aria-labelledby={titleId}>
        <h4 className={styles.title} id={titleId}>
          {labels.title}
        </h4>
        <ul className={styles.tasks}>
          {labels.tasks.map((task, index) => (
            <li key={task}>
              <label className={styles.task}>
                <input
                  ref={index === 0 ? firstTask : undefined}
                  type="checkbox"
                  disabled={!live}
                  checked={completed.includes(index)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setCompleted((previous) =>
                      checked
                        ? [...previous, index]
                        : previous.filter((item) => item !== index),
                    );
                  }}
                />
                <span>{task}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className={styles.progress} role="status" aria-atomic="true">
          {live ? (
            <>
              <bdi dir="ltr">
                {completed.length}/{labels.tasks.length}
              </bdi>{" "}
              {labels.completed}
            </>
          ) : (
            labels.before
          )}
        </p>
      </fieldset>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          disabled={!ready}
          onClick={toggleStage}
          className={styles.action}
        >
          {live ? labels.reset : labels.activate}
        </Button>
      </div>
    </div>
  );
}
