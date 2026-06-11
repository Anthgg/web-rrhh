import { EmptyState as SharedEmptyState } from "@/components/shared/states";

export function EmptyState({ title, description }: { title: string; description: string }) {
 return <SharedEmptyState title={title} description={description} />;
}
