import type { ReactNode } from 'react';
import { TooltipProvider } from '@/design/ui/tooltip';

export function Providers({ children }: { children: ReactNode }) {
    return <TooltipProvider delayDuration={250}>{children}</TooltipProvider>;
}
