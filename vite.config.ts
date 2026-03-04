import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk principal do React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Chunk da UI principal
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          // Chunk de formulários e dados
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Chunk de consultas e estado
          'query-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Chunk de utilitários
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Chunk de ícones
          'icons-vendor': ['lucide-react'],
          // Chunk de auth separado para melhor code splitting
          'auth-vendor': ['@/contexts/AuthContext', '@/components/Auth/LoginForm', '@/components/Auth/ProtectedRoute']
        }
      }
    },
    // Otimizações de tree-shaking
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Reduzir limite de chunk para melhor splitting
    chunkSizeWarningLimit: 1000,
  },
  // Otimizações de dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ],
    exclude: ['xlsx', 'html5-qrcode'] // Lazy load estas bibliotecas pesadas
  },
}));
