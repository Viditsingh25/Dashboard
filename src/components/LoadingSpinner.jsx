import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 32, text = 'Loading...', fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
      <Loader2 size={size} className="animate-spin text-green-600" />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="flex items-center justify-center min-h-[400px]">{content}</div>;
  }

  return content;
}
