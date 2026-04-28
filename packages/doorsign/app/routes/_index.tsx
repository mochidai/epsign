import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, Link, redirect } from "@remix-run/react";
import DCache from "~/features/cache/cache";

export const meta: MetaFunction = () => {
  return [{ title: "Dashboard" }];
};

export async function action({ request }: ActionFunctionArgs) {
  console.log("clear cache");
  const cache = DCache.getInstance();
  cache.clear();
  return null;
}

export default function Index() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <nav className="flex gap-10">
        <Link to="/dashboard" reloadDocument className="text-blue-500 hover:underline text-3xl">
          Dashboard
        </Link>
        <Link to="/image.png" reloadDocument className="text-blue-500 hover:underline text-3xl">
          Image
        </Link>
        <Link to="/dithered-image.png" reloadDocument className="text-blue-500 hover:underline text-3xl">
          Dithered Image
        </Link>
      </nav>
      <Form method="post" className="mt-10">
        <button type="submit" className="text-gray-400 text-xl">
          clear cache
        </button>
      </Form>
    </div>
  );
}
