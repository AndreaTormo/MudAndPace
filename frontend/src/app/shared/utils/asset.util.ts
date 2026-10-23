import { environment } from '../../../environments/environment';

const API_ORIGIN = environment.API_URL.replace(/\/api\/v1\/?$/, '');

export function resolveAssetUrl(url: string): string {
  if (!url || /^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
