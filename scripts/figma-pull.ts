import { tokens, type DesignTokens } from "../packages/design-tokens/src/tokens";
import {
  figmaEnv,
  getLocalVariables,
  readMapping,
  runCommand,
  tokenItems,
  valueToComparable,
  valueToTokenValue,
  writeMapping,
  writeTokensFile
} from "./figma-token-sync";

async function main() {
  const env = figmaEnv();
  if (!env.configured) {
    console.warn("⚠ FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY missing; figma:pull skipped.");
    return;
  }

  const local = await getLocalVariables(env.fileKey, env.accessToken);
  const collections = Object.values(local.meta.variableCollections).filter(
    (collection) => collection.name.startsWith("CSP/") && !collection.remote
  );
  const collectionByName = new Map(
    collections.map((collection) => [collection.name, collection])
  );
  const variableByKey = new Map(
    Object.values(local.meta.variables)
      .filter((variable) => !variable.remote)
      .map((variable) => [
        `${local.meta.variableCollections[variable.variableCollectionId]?.name ?? ""}/${variable.name}`,
        variable
      ])
  );

  const nextTokens: DesignTokens = structuredClone(tokens);
  const diffs: string[] = [];
  for (const item of tokenItems()) {
    const collection = collectionByName.get(item.collectionName);
    if (!collection) continue;
    const variable = variableByKey.get(`${item.collectionName}/${item.variableName}`);
    if (!variable) continue;
    const figmaValue = variable.valuesByMode[collection.defaultModeId] ?? null;
    const tokenValue = valueToTokenValue(item.kind, figmaValue);
    if (tokenValue === null) continue;
    if (valueToComparable(figmaValue) !== String(item.value)) {
      diffs.push(
        `${item.tokenPath.join(".")}: ${String(item.value)} -> ${String(tokenValue)}`
      );
      setNestedValue(nextTokens, item.tokenPath, tokenValue);
    }
  }

  const mapping = readMapping();
  mapping.fileKey = env.fileKey;
  mapping.lastPull = new Date().toISOString();
  mapping.collections = Object.fromEntries(
    collections.map((collection) => [collection.name, collection.id])
  );
  mapping.values = Object.fromEntries(
    tokenItems(nextTokens).map((item) => [item.tokenPath.join("."), String(item.value)])
  );
  writeMapping(mapping);

  if (diffs.length === 0) {
    console.log("Figma variables match tokens.ts.");
    return;
  }

  writeTokensFile(nextTokens);
  console.log("Figma token diffs:");
  for (const diff of diffs) console.log(`- ${diff}`);
  runCommand(["pnpm", "prettier", "packages/design-tokens/src/tokens.ts", "--write"]);
  runCommand(["pnpm", "format:check"]);
  runCommand(["pnpm", "typecheck"]);
}

function setNestedValue(target: unknown, path: string[], value: string | number): void {
  if (!target || typeof target !== "object") return;
  const [head, ...rest] = path;
  if (!head) return;
  const record = target as Record<string, unknown>;
  if (rest.length === 0) {
    record[head] = value;
    return;
  }
  setNestedValue(record[head], rest, value);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
