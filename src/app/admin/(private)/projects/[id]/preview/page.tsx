import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProject } from "@/lib/cms/queries";
import { ProjectDetail } from "@/components/project-detail";
import { getDictionary } from "@/i18n/dictionaries";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  return (
    <>
      <p>תצוגה מקדימה פרטית — הגרסה השמורה</p>
      <p>
        <Link href={`/admin/projects/${id}`}>חזרה לעריכה</Link>
      </p>
      <ProjectDetail
        project={project}
        locale="he"
        content={await getDictionary("he")}
        preview
      />
    </>
  );
}
