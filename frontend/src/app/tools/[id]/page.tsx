import { ToolsPage } from "@/components/tools/ToolsPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ToolsPage activeTool={id} />;
}
