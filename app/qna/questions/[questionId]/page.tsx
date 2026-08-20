import { notFound } from "next/navigation";
import { AuthenticatedHome } from "@/components/features/auth/authenticated-home";

export default async function QnaQuestionDetailRoute({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId: questionIdParam } = await params;
  const questionId = Number(questionIdParam);

  if (!Number.isSafeInteger(questionId) || questionId < 1) {
    notFound();
  }

  return <AuthenticatedHome currentView="qna-question-detail" questionId={questionId} />;
}
