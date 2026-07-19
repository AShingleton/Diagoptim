import { redirect } from "next/navigation";

/**
 * Root entrypoint. The application is internationalised under `/[locale]`,
 * so the bare `/` path redirects to the default locale.
 */
export default function RootPage() {
  redirect("/fr");
}
