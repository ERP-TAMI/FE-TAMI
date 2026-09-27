import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { UploadProgressWidget } from "@/components/shared";

function LayoutContent() {
  const { isExpanded, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen overflow-x-hidden xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:ml-[250px]" : "lg:ml-[80px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <UploadProgressWidget />
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
