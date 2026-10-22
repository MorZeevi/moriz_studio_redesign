import { expect, test } from "@playwright/test";
import { projectCard } from "../../src/lib/cms/project-card";
import type { Project } from "../../src/types/project";

function projectWithUserCount(value: string): Project {
  return {
    id: "test-project",
    title: "Test",
    media: [],
    content: [],
    categories: [],
    highlights: [
      { id: "user-count", value, label: "משתמשים", on_homepage: true },
    ],
  } as unknown as Project;
}

test("homepage user counts keep their label only when a number is present", () => {
  for (const value of ["0", "10,000+", "6K+", "כ־500"]) {
    expect(
      projectCard(projectWithUserCount(value), "homepage").highlight,
    ).toEqual({ value, label: "משתמשים" });
  }
  const value = "המערכת בהרצה";
  expect(
    projectCard(projectWithUserCount(value), "homepage").highlight,
  ).toEqual({ value, label: "" });
});

test("other homepage highlights keep their authored labels", () => {
  const project = projectWithUserCount("המערכת בהרצה");
  project.highlights = [
    { id: "status", value: "בפיתוח", label: "סטטוס", on_homepage: true },
  ];
  expect(projectCard(project, "homepage").highlight).toEqual({
    value: "בפיתוח",
    label: "סטטוס",
  });
});
