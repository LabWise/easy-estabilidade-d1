
import React from 'react';
import { ResponsiveLayout } from '../components/Layout/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <ResponsiveLayout title="Página não encontrada">
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-6xl font-bold text-muted-foreground">404</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              A página que você está procurando não foi encontrada.
            </p>
            <Button asChild>
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default NotFound;
