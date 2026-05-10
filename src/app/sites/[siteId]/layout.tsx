import { Sidebar } from '@/components/layout/Sidebar';

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  return (
    <div className="flex min-h-screen">
      <Sidebar siteId={siteId} />
      <main className="flex-1 overflow-auto bg-gray-50 p-8">{children}</main>
    </div>
  );
}
