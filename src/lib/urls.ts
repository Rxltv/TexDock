export function url(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return path;
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function absoluteUrl(path: string): string {
  const site = import.meta.env.SITE || 'https://rxltv.github.io';
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const normalizedPath = /^https?:\/\//.test(path)
    ? path
    : base && (path === base || path.startsWith(`${base}/`))
      ? path
      : url(path);
  return new URL(normalizedPath, site).href;
}

export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href);
}
