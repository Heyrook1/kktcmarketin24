import { z } from "zod"

const trimmedString = z.string().trim()

const nonEmptyTrimmedString = z.string().trim().min(1)

const priceSchema = z
  .coerce
  .number()
  .finite()
  .min(1, "Fiyat en az ₺1 olmalıdır.")

const nullableNumberSchema = z
  .union([z.coerce.number().finite().min(1, "Karşılaştırma fiyatı en az ₺1 olmalıdır."), z.null()])
  .optional()

const stringArraySchema = z
  .array(trimmedString)
  .transform((items) => items.filter(Boolean))

export const productCreateSchema = z.object({
  name: nonEmptyTrimmedString,
  description: trimmedString.optional().nullable(),
  price: priceSchema,
  compare_price: nullableNumberSchema,
  category: nonEmptyTrimmedString,
  image_url: trimmedString.optional().nullable(),
  images: stringArraySchema.optional(),
  tags: z
    .union([stringArraySchema, trimmedString.transform((s) => s.split(",").map((t) => t.trim()).filter(Boolean))])
    .optional(),
  stock: z.coerce.number().finite().int().nonnegative().optional(),
  is_active: z.coerce.boolean().optional(),
})

export const productPatchSchema = productCreateSchema.partial()

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductPatchInput = z.infer<typeof productPatchSchema>

