// Allow importing plain .js/.jsx modules without type declarations
declare module '*.js' {
  const content: any
  export default content
}

declare module '*.jsx' {
  const content: any
  export default content
}

// Specific fallback for the ImageGenerator module to expose named constants
declare module './ImageGenerator' {
  export const CLOUDFLARE_WORKER_URL: string
  export const CLOUDFLARE_BEARER: string
  const _default: any
  export default _default
}
