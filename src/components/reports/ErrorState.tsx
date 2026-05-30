import { ErrorState as SharedErrorState } from "@/components/shared/states";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return <SharedErrorState title={title} description={description} onRetry={onRetry} />;
}
