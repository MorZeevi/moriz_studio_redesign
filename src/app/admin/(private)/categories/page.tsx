import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { getAdminTerms } from "@/lib/cms/queries";
import type { ManagedKind } from "@/types/project";
export default async function Categories({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: raw } = await searchParams;
  const kind: ManagedKind = raw === "type" ? raw : "category";
  return (
    <TaxonomyManager
      key={kind}
      kind={kind}
      initial={await getAdminTerms(kind)}
    />
  );
}
