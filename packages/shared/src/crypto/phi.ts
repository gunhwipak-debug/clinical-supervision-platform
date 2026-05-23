import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

const MINIMUM_KEY_LENGTH = 32;
const PGP_OPTIONS = "cipher-algo=aes256, compress-algo=1";

export type PhiPlaintext = string | SQLWrapper;
export type PhiCiphertext = SQLWrapper;

export function requirePhiEncryptionKey(
  key = process.env["PHI_ENCRYPTION_KEY"]
): string {
  if (!key || key.length < MINIMUM_KEY_LENGTH) {
    throw new Error(
      `PHI_ENCRYPTION_KEY must be at least ${String(MINIMUM_KEY_LENGTH)} characters`
    );
  }

  return key;
}

export function resolvePhiEncryptionKey(
  phiAccess: boolean,
  key?: string
): string | undefined {
  return phiAccess ? requirePhiEncryptionKey(key) : undefined;
}

export function encryptPhi(value: PhiPlaintext): SQL<Buffer> {
  return sql<Buffer>`pgp_sym_encrypt(
    ${value},
    nullif(current_setting('app.phi_key', true), ''),
    ${PGP_OPTIONS}
  )`;
}

export function decryptPhi(ciphertext: PhiCiphertext): SQL<string> {
  return sql<string>`pgp_sym_decrypt(
    ${ciphertext},
    nullif(current_setting('app.phi_key', true), ''),
    ${PGP_OPTIONS}
  )`;
}
