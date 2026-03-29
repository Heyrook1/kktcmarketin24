import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { resolveVendorSession } from "@/lib/vendor-auth"

export async function POST(request: NextRequest) {
  // Only authenticated vendors can upload
  const auth = await resolveVendorSession()
  if (!auth.ok) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 })
  }

  // Validate type & size (max 5 MB)
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Yalnızca JPG, PNG, WebP veya GIF yüklenebilir." }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Görsel boyutu 5 MB'dan büyük olamaz." }, { status: 400 })
  }

  // Use a path that includes storeId to keep files organised
  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `vendor-products/${auth.session.storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(filename, file, { access: "public" })

  return NextResponse.json({ url: blob.url })
}
