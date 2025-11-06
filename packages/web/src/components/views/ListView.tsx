import { ReactNode } from 'react';

interface ListViewProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export function ListView({ title, icon, children }: ListViewProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {icon && <span className="text-4xl">{icon}</span>}
          <span>{title}</span>
        </h1>
      </header>
      {children}
    </div>
  );
}
