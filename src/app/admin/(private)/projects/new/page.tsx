import { randomUUID } from "node:crypto";
import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminTerms } from "@/lib/cms/queries";
import { getDictionary } from "@/i18n/dictionaries";
import type { ProjectInput } from "@/types/project";
export default async function NewProject() {
  const [terms, content] = await Promise.all([
    getAdminTerms(),
    getDictionary("he"),
  ]);
  const initial: ProjectInput = {
    id: randomUUID(),
    title: "",
    title_en: null,
    slug: null,
    client: null,
    client_en: null,
    year: null,
    headline: null,
    headline_en: null,
    short_description: null,
    short_description_en: null,
    description: null,
    description_en: null,
    archive_description: null,
    archive_description_en: null,
    role: null,
    role_en: null,
    target_audience: null,
    target_audience_en: null,
    audience_description: null,
    audience_description_en: null,
    website_url: null,
    seo_title: null,
    seo_title_en: null,
    seo_description: null,
    seo_description_en: null,
    og_image_url: null,
    legacy_services: [],
    cover_image_url: null,
    homepage_image_url: null,
    projects_image_url: null,
    content: [],
    media: [],
    highlights: [],
    featured: false,
    show_on_homepage: true,
    show_on_projects: true,
    homepage_order: null,
    projects_order: null,
    published: false,
    category_ids: [],
    service_ids: [],
    type_id: null,
  };
  return (
    <ProjectEditor initial={initial} terms={terms} content={content} isNew />
  );
}
