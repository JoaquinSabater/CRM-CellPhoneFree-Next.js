import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'flex h-10 items-center rounded-lg bg-orange-600 px-4 text-sm font-medium text-white transition-colors hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  secondary:
    'flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ghost:
    'flex h-10 items-center rounded-lg bg-transparent px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  danger:
    'flex h-10 items-center rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  icon:
    'inline-flex h-9 w-9 items-center justify-center rounded-md p-0 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
};

export function buttonVariants({
  variant = 'primary',
  className,
}: {
  variant?: ButtonVariant;
  className?: string;
} = {}) {
  return clsx(variantClasses[variant], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = 'primary', ...rest }: ButtonProps) {
  return (
    <button {...rest} className={buttonVariants({ variant, className })}>
      {children}
    </button>
  );
}
