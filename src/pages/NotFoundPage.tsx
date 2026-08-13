import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";

export default function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page not found | TAMI ERP" description="The requested page was not found" />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <section className="text-center">
          <p className="text-title-lg text-brand-500 font-semibold">404</p>
          <h1 className="text-title-sm mt-3 font-semibold text-gray-900 dark:text-white">
            Page not found
          </h1>
          <Link
            to="/dashboard"
            className="bg-brand-500 text-theme-sm hover:bg-brand-600 mt-6 inline-flex rounded-lg px-4 py-3 font-medium text-white"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    </>
  );
}
