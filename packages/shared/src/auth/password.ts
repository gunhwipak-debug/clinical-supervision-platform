import { argon2Verify, argon2id } from "hash-wasm";

const ARGON2_MEMORY_COST_KIB = 19_456;
const ARGON2_TIME_COST = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;
const ARGON2_SALT_LENGTH = 16;

export async function hashPassword(plaintext: string): Promise<string> {
  const salt = new Uint8Array(ARGON2_SALT_LENGTH);
  crypto.getRandomValues(salt);

  // hash-wasm keeps Argon2id portable for Node 24 and Vercel without native builds.
  return argon2id({
    password: plaintext,
    salt,
    iterations: ARGON2_TIME_COST,
    parallelism: ARGON2_PARALLELISM,
    memorySize: ARGON2_MEMORY_COST_KIB,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "encoded"
  });
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2Verify({
      password: plaintext,
      hash
    });
  } catch {
    return false;
  }
}
