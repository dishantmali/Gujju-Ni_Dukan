import { ReactNode } from "react";

export const EmptyState = ({
  icon, title, description, action,
}: { icon: ReactNode; title: string; description: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
    <div className="h-24 w-24 rounded-full bg-gradient-warm grid place-items-center text-brown-mid mb-5 shadow-card">
      {icon}
    </div>
    <h3 className="font-display text-2xl font-semibold text-foreground">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
