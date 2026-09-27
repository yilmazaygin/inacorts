import React from 'react';

export const PersonPhoto: React.FC<{ name: string; url?: string | null; className?: string }> = ({
  name,
  url,
  className = 'h-11 w-11',
}) => {
  if (url) {
    return <img src={url} alt="" className={`${className} shrink-0 rounded-full object-cover`} />;
  }
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr') || '?';
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-800 dark:text-amber-300`}>
      {initial}
    </span>
  );
};
