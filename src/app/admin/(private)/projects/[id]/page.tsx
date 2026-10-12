import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminProject, getAdminTerms } from "@/lib/cms/queries";
import { getDictionary } from "@/i18n/dictionaries";
export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, terms, content] = await Promise.all([
    getAdminProject(id),
    getAdminTerms(),
    getDictionary("he"),
  ]);
  if (!project) notFound();
  const {
    categories,
    services,
    type,
    created_at: _created,
    updated_at: _updated,
    ...initial
  } = project;
  return (
    <ProjectEditor
      initial={{
        ...initial,
        category_ids: categories.map((t) => t.id),
        service_ids: services.map((t) => t.id),
        type_id: type?.id ?? null,
      }}
      terms={terms}
      content={content}
    />
  );
}
