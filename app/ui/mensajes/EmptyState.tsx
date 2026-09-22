import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400">
      <ChatBubbleLeftRightIcon className="h-12 w-12" />
      <p className="text-sm">Seleccioná una conversación para empezar</p>
    </div>
  );
}
