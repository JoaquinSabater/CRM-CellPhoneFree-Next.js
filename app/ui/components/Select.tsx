import { forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...rest }, ref) => {
    const select = (
      <select
        ref={ref}
        id={id}
        className={clsx(
          'block w-full rounded-md border py-2 pl-3 text-sm text-slate-900',
          'border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );

    if (!label) return select;

    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
        {select}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
