/* eslint-disable @typescript-eslint/no-explicit-any */
export const getApiBaseUrl = () =>
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (process as any).env?.NEXT_PUBLIC_API_BASE_URL ||
  '';

export const toAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  // blob: and data: URLs are self-contained — never prepend a base URL
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = getApiBaseUrl();
  if (!base) return url;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};


export const toAbsoluteDocumentUrl = (input?: string) => {
  if (!input) return '';
  
  // If it's an absolute URL like http://localhost:8002/documents/file.jpg
  // Extract just the path /documents/file.jpg so it goes through Vite proxy
  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const url = new URL(input);
      return url.pathname; // Returns /documents/filename
    } catch {
      return input; // If URL parsing fails, return as-is
    }
  }

  // If already has /documents prefix, return as-is
  if (input.startsWith('/documents/')) return input;

  // Normalize the input and prepend /documents/ prefix
  const normalized = input.startsWith('/') ? input.slice(1) : input;
  if (normalized.startsWith('documents/')) {
    return `/${normalized}`;
  }

  // fallback: treat input as filename and prepend /documents/
  return `/documents/${normalized}`;
};