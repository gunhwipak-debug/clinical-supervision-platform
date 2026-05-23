import {
  figmaEnv,
  getLocalVariables,
  normalizeValue,
  postVariables,
  readMapping,
  tokenItems,
  valueToComparable,
  writeMapping
} from "./figma-token-sync";

async function main() {
  const env = figmaEnv();
  if (!env.configured) {
    console.warn("⚠ FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY missing; figma:push skipped.");
    return;
  }

  const items = tokenItems();
  const local = await getLocalVariables(env.fileKey, env.accessToken);
  const collections = Object.values(local.meta.variableCollections).filter(
    (collection) => !collection.remote
  );
  const variables = Object.values(local.meta.variables).filter(
    (variable) => !variable.remote
  );
  const collectionByName = new Map(
    collections.map((collection) => [collection.name, collection])
  );
  const variableByCollectionAndName = new Map(
    variables.map((variable) => [
      `${variable.variableCollectionId}:${variable.name}`,
      variable
    ])
  );

  const collectionCreates = Array.from(
    new Set(items.map((item) => item.collectionName))
  )
    .filter((name) => !collectionByName.has(name))
    .map((name) => ({
      action: "CREATE",
      id: tempCollectionId(name),
      name,
      initialModeId: tempModeId(name)
    }));

  const variableCreates = [];
  const variableModeValues = [];
  for (const item of items) {
    const collection = collectionByName.get(item.collectionName);
    const collectionId = collection?.id ?? tempCollectionId(item.collectionName);
    const modeId = collection?.defaultModeId ?? tempModeId(item.collectionName);
    const existing = collection
      ? variableByCollectionAndName.get(`${collection.id}:${item.variableName}`)
      : null;
    const variableId = existing?.id ?? tempVariableId(item);

    if (!existing) {
      variableCreates.push({
        action: "CREATE",
        id: variableId,
        name: item.variableName,
        variableCollectionId: collectionId,
        resolvedType: item.kind
      });
    } else if (existing.resolvedType !== item.kind) {
      throw new Error(
        `Figma variable type mismatch for ${item.collectionName}/${item.variableName}: expected ${item.kind}, got ${existing.resolvedType}`
      );
    }

    const currentValue = existing?.valuesByMode[modeId] ?? null;
    if (
      !existing ||
      valueToComparable(currentValue) !== valueToComparable(normalizeValue(item))
    ) {
      variableModeValues.push({
        variableId,
        modeId,
        value: normalizeValue(item)
      });
    }
  }

  if (
    collectionCreates.length === 0 &&
    variableCreates.length === 0 &&
    variableModeValues.length === 0
  ) {
    console.log("Figma variables already match code tokens.");
  } else {
    await postVariables(env.fileKey, env.accessToken, {
      variableCollections: collectionCreates,
      variables: variableCreates,
      variableModeValues
    });
    console.log(
      `Figma variables synced: ${String(collectionCreates.length)} collections, ${String(variableCreates.length)} variables, ${String(variableModeValues.length)} values.`
    );
  }

  const refreshed = await getLocalVariables(env.fileKey, env.accessToken);
  const mapping = readMapping();
  mapping.fileKey = env.fileKey;
  mapping.lastPush = new Date().toISOString();
  mapping.collections = Object.fromEntries(
    Object.values(refreshed.meta.variableCollections)
      .filter((collection) => collection.name.startsWith("CSP/"))
      .map((collection) => [collection.name, collection.id])
  );
  mapping.variables = Object.fromEntries(
    Object.values(refreshed.meta.variables)
      .filter((variable) => mapping.collections?.[collectionName(refreshed, variable)])
      .map((variable) => [
        `${collectionName(refreshed, variable)}/${variable.name}`,
        variable.id
      ])
  );
  mapping.values = Object.fromEntries(
    items.map((item) => [item.tokenPath.join("."), String(item.value)])
  );
  writeMapping(mapping);
}

function collectionName(
  local: Awaited<ReturnType<typeof getLocalVariables>>,
  variable: { variableCollectionId: string }
) {
  return local.meta.variableCollections[variable.variableCollectionId]?.name ?? "";
}

function tempCollectionId(name: string): string {
  return `tmp_collection_${slug(name)}`;
}

function tempModeId(name: string): string {
  return `tmp_mode_${slug(name)}`;
}

function tempVariableId(item: {
  collectionName: string;
  variableName: string;
}): string {
  return `tmp_var_${slug(`${item.collectionName}_${item.variableName}`)}`;
}

function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
