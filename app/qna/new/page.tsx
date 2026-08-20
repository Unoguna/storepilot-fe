import { AuthenticatedHome } from "@/components/features/auth/authenticated-home";

export default function QnaQuestionCreateRoute() {
  return <AuthenticatedHome currentView="qna-question-create" />;
}
