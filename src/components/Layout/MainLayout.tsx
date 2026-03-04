
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header title={title} />
        <main className="ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
