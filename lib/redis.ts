import { Redis } from "@upstash/redis"

// Singleton Redis client — reused across all serverless invocations
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
