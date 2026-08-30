import { z } from "zod";
import { sanitizeText } from "@/lib/format";

export const loginSchema = z.object({
  email: z
    .string()
    .transform(sanitizeText)
    .pipe(z.email("Informe um e-mail válido")),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const signupSchema = loginSchema.extend({
  full_name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, "Informe seu nome").max(80)),
  company_name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Informe o nome da empresa").max(80)),
});
