// Local re-export shim — avoids Turbopack subpath resolution issues with pnpm.
// All stores should import from "@/lib/zustand-middleware" instead of "zustand/middleware".
// eslint-disable-next-line @typescript-eslint/no-require-imports
const middleware = require("zustand/middleware")
export const persist               = middleware.persist               as typeof import("zustand/middleware").persist
export const devtools              = middleware.devtools              as typeof import("zustand/middleware").devtools
export const subscribeWithSelector = middleware.subscribeWithSelector as typeof import("zustand/middleware").subscribeWithSelector
export const combine               = middleware.combine               as typeof import("zustand/middleware").combine
