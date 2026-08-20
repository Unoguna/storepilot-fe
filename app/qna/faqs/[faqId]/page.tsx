import { notFound } from "next/navigation";
import { AuthenticatedHome } from "@/components/features/auth/authenticated-home";

export default async function QnaFaqDetailRoute({
  params,
}: {
  params: Promise<{ faqId: string }>;
}) {
  const { faqId: faqIdParam } = await params;
  const faqId = Number(faqIdParam);

  if (!Number.isSafeInteger(faqId) || faqId < 1) {
    notFound();
  }

  return <AuthenticatedHome currentView="qna-faq-detail" faqId={faqId} />;
}
