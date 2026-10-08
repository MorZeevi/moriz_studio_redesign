import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";
import {
  getAdminCategories,
  getAdminProject,
  getAdminProjects,
} from "@/lib/cms/queries";
import { getDictionary } from "@/i18n/dictionaries";
export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, categories, projects, content] = await Promise.all([
    getAdminProject(id),
    getAdminCategories(),
    getAdminProjects(),
    getDictionary("he"),
  ]);
  if (!project) notFound();
  const {
    categories: selected,
    created_at: _created,
    updated_at: _updated,
    ...initial
  } = project;
  return (
    <ProjectEditor
      initial={{ ...initial, category_ids: selected.map((c) => c.id) }}
      categories={categories}
      services={[...new Set(projects.flatMap((p) => p.services))]}
      content={content}
    />
  );
}
