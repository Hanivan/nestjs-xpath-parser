import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Resolve a proxy URL: an explicit string is used directly; `true` falls back to
 * the `HTTP_PROXY` / `HTTPS_PROXY` env vars. Returns undefined when no proxy.
 */
export function resolveProxyUrl(
  useProxy?: boolean | string,
): string | undefined {
  if (!useProxy) return undefined;
  return typeof useProxy === 'string'
    ? useProxy
    : process.env.HTTP_PROXY || process.env.HTTPS_PROXY || undefined;
}

export interface ProxyAgents {
  httpAgent: HttpsProxyAgent<string>;
  httpsAgent: HttpsProxyAgent<string>;
  proxyUrl: string;
}

/** Resolve a proxy URL into matching http/https agents, if a proxy is set. */
export function proxyAgents(
  useProxy?: boolean | string,
): ProxyAgents | undefined {
  const proxyUrl = resolveProxyUrl(useProxy);
  if (!proxyUrl) return undefined;
  const agent = new HttpsProxyAgent(proxyUrl);
  return { httpAgent: agent, httpsAgent: agent, proxyUrl };
}
