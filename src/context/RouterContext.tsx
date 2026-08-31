import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'course'; slug: string }
  | { name: 'contact' }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'register' }
  | { name: 'verify-email' }
  | { name: 'upload-docs' }
  | { name: 'docs-sent' }
  | { name: 'company-enrollees' }
  | { name: 'admin' }
  | { name: 'admin-user'; userId: string };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('curso/')) {
    return { name: 'course', slug: hash.slice('curso/'.length) };
  }
  if (hash.startsWith('admin/usuario/')) {
    return { name: 'admin-user', userId: hash.slice('admin/usuario/'.length) };
  }
  if (hash === 'contato') return { name: 'contact' };
  if (hash === 'carrinho') return { name: 'cart' };
  if (hash === 'checkout') return { name: 'checkout' };
  if (hash === 'cadastro') return { name: 'register' };
  if (hash === 'verificar-email') return { name: 'verify-email' };
  if (hash === 'enviar-documentos') return { name: 'upload-docs' };
  if (hash === 'documentos-enviados') return { name: 'docs-sent' };
  if (hash === 'empresa/matriculas') return { name: 'company-enrollees' };
  if (hash === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case 'course':
      return `#/curso/${route.slug}`;
    case 'contact':
      return '#/contato';
    case 'cart':
      return '#/carrinho';
    case 'checkout':
      return '#/checkout';
    case 'register':
      return '#/cadastro';
    case 'verify-email':
      return '#/verificar-email';
    case 'upload-docs':
      return '#/enviar-documentos';
    case 'docs-sent':
      return '#/documentos-enviados';
    case 'company-enrollees':
      return '#/empresa/matriculas';
    case 'admin':
      return '#/admin';
    case 'admin-user':
      return `#/admin/usuario/${route.userId}`;
    default:
      return '#/';
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    window.location.hash = routeToHash(newRoute);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
