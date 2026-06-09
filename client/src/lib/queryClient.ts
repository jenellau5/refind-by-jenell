import { QueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "__PORT_5000__";

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  const fullUrl = url.startsWith("/api") ? `${API_BASE}${url}` : url;
  const headers: HeadersInit = {};
  let bodyPayload: BodyInit | undefined;

  if (body instanceof FormData) {
    bodyPayload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyPayload = JSON.stringify(body);
  }

  const res = await fetch(fullUrl, { method, headers, body: bodyPayload });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url, ...params] = queryKey as string[];
        const fullUrl = url.startsWith("/api") ? `${API_BASE}${url}` : url;
        const res = await fetch(fullUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});
