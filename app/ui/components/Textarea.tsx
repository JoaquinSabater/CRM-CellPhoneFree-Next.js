import { forwardRef } from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          'block w-full resize-none rounded-md border py-2 pl-3 text-sm text-slate-900 placeholder:text-slate-400',
          'border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
          className,
        )}
        {...rest}
      />
    );

    if (!label) return textarea;

    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
        {textarea}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
