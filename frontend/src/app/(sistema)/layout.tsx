import SidebarLayout from "../../components/layout/SidebarLayout";

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
