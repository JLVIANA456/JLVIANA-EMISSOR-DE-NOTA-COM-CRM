export type AppRole = 'admin' | 'secretary';

// Routes restricted to admin only
const ADMIN_ONLY_ROUTES = [
  '/cfo-digital',
  '/projecao-caixa',
  '/dashboard/estrategico',
];

export function canAccessRoute(role: AppRole | null, path: string): boolean {
  if (role === 'admin') return true;
  if (ADMIN_ONLY_ROUTES.includes(path)) return false;
  return true;
}

export function isAdminOnlyRoute(path: string): boolean {
  return ADMIN_ONLY_ROUTES.includes(path);
}
