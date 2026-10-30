import React from 'react';

export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  icon: Icon,
}) {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-700/10',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10',
    info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span className={`${base} ${variants[variant] || variants.slate} ${sizes[size] || sizes.md} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

