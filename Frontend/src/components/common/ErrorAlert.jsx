import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorAlert({
  title = 'Something went wrong',
  message = 'Failed to load data from the server.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="text-sm text-rose-700 mt-0.5 leading-relaxed break-words">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                icon={RefreshCw}
                className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

