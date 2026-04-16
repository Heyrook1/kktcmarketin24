import { GET as getRates } from "@/app/api/currency/rates/route"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return getRates(request)
}
