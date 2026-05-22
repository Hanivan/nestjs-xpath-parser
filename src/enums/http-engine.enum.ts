export const HttpEngine = {
  AXIOS: 'axios',
  CYCLETLS: 'cycletls',
} as const;

export type HttpEngine = (typeof HttpEngine)[keyof typeof HttpEngine];
