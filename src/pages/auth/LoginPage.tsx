import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";

export default function LoginPage() {
  return (
    <>
      <PageMeta title="Login | TAMI ERP" description="Sign in to TAMI ERP" />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <section className="shadow-theme-sm w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-8">
            <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
              TAMI ERP
            </p>
            <h1 className="text-title-sm mt-2 font-semibold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
              Authentication will be connected to the backend in a later task.
            </p>
          </div>
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <label className="block">
              <span className="text-theme-sm mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Email
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="text-theme-sm focus:border-brand-500 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-theme-sm mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Password
              </span>
              <input
                type="password"
                placeholder="Enter your password"
                className="text-theme-sm focus:border-brand-500 focus:ring-brand-500/10 h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-gray-900 transition outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              />
            </label>
            <button
              type="submit"
              className="bg-brand-500 text-theme-sm hover:bg-brand-600 focus:ring-brand-500/30 h-11 w-full rounded-lg px-4 font-medium text-white transition focus:ring-3 focus:outline-none"
            >
              Sign in
            </button>
          </form>
          <p className="text-theme-sm mt-6 text-center text-gray-500 dark:text-gray-400">
            New project foundation?{" "}
            <Link className="text-brand-500 hover:text-brand-600 font-medium" to="/dashboard">
              View dashboard shell
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
