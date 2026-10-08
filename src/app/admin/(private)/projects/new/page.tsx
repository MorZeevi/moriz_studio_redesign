import { randomUUID } from "node:crypto";
import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminCategories, getAdminProjects } from "@/lib/cms/queries";
import { getDictionary } from "@/i18n/dictionaries";
import type { ProjectInput } from "@/types/project";
export default async function NewProject() {
  const [categories, projects, content] = await Promise.all([
    getAdminCategories(),
    getAdminProjects(),
    getDictionary("he"),
  ]);
  const initial: ProjectInput = {
    id: randomUUID(),
    title: "",
    slug: "",
    client: null,
    year: null,
    headline: null,
    short_description: null,
    description: null,
    services: [],
    cover_image_url: null,
    homepage_image_url: null,
    projects_image_url: null,
    content: [],
    featured: false,
    show_on_homepage: true,
    show_on_projects: true,
    homepage_order: null,
    projects_order: null,
    published: false,
    category_ids: [],
  };
  return (
    <ProjectEditor
      initial={initial}
      categories={categories}
      services={[...new Set(projects.flatMap((p) => p.services))]}
      content={content}
      isNew
    />
  );
}
