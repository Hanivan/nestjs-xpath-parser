export interface UrlHealthCheckResult {
  url: string;
  alive: boolean;
  statusCode?: number;
  error?: string;
}
