import { getWorkOverview } from "@/lib/cms/work-os";
import { OsView } from "./os-view";

export const metadata = { title: "Mor OS" };

export default async function Os() {
  return <OsView data={await getWorkOverview()} />;
}
