import { LoadingPanel } from "@/components/shared/states";

export function LoadingState({ title }: { title: string }) {
  return <LoadingPanel title={title} />;
}
