
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { UserMenu } from './UserMenu';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const ResponsiveLayout = ({ children, title }: ResponsiveLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Header with trigger for collapse/expand */}
          <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 bg-background border-b border-border px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                {title}
              </h1>
            </div>
            <UserMenu />
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
