import { Link } from "react-router-dom";
import { Button, Input } from "@/components/shared";
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
            <Input label="Email" type="email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="Enter your password" />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
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
