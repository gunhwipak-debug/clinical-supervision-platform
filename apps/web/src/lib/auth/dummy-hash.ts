import { hashPassword } from "@csp/shared/auth/password";

export const dummyHash = await hashPassword("dummy password for timing equalization");
