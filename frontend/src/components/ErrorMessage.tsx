import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <div className="error-box" role="alert">
      <AlertTriangle size={22} />
      <div className="error-box__body">
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
            <RefreshCw size={14} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
