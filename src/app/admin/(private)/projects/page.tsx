import { getAdminProjects } from "@/lib/cms/queries";
import { ProjectList } from "@/components/admin/project-list";
export default async function Projects() {
  return <ProjectList projects={await getAdminProjects()} />;
}
