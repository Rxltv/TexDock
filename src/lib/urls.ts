export function url(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return path;
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href);
}
