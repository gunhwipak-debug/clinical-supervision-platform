import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tokens, type DesignTokens } from "../packages/design-tokens/src/tokens";

export const root = resolve(new URL("..", import.meta.url).pathname);
export const mappingPath = join(root, "packages/design-tokens/figma-mapping.json");
export const tokensPath = join(root, "packages/design-tokens/src/tokens.ts");

export type TokenKind = "COLOR" | "FLOAT" | "STRING";
export type TokenItem = {
  collectionName: string;
  variableName: string;
  tokenPath: string[];
  kind: TokenKind;
  value: string | number;
};

export type FigmaColor = { r: number; g: number; b: number; a: number };
export type FigmaVariable = {
  id: string;
  name: string;
  variableCollectionId: string;
  resolvedType: TokenKind | "BOOLEAN";
  valuesByMode: Record<string, string | number | boolean | FigmaColor | null>;
  remote?: boolean;
};
export type FigmaCollection = {
  id: string;
  name: string;
  defaultModeId: string;
  modes: Array<{ modeId: string; name: string }>;
  remote?: boolean;
};
export type LocalVariablesResponse = {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaCollection>;
  };
};
export type FigmaMapping = {
  fileKey?: string;
  lastPush?: string;
  lastPull?: string;
  collections?: Record<string, string>;
  variables?: Record<string, string>;
  values?: Record<string, string>;
};

export function figmaEnv():
  | { configured: false }
  | { configured: true; accessToken: string; fileKey: string } {
  const accessToken = process.env["FIGMA_ACCESS_TOKEN"];
  const fileKey = process.env["FIGMA_FILE_KEY"];
  if (!accessToken || !fileKey) return { configured: false };
  return { configured: true, accessToken, fileKey };
}

export function readMapping(): FigmaMapping {
  try {
    return JSON.parse(readFileSync(mappingPath, "utf8")) as FigmaMapping;
  } catch {
    return {};
  }
}

export function writeMapping(mapping: FigmaMapping): void {
  writeFileSync(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`);
}

export function tokenItems(source: DesignTokens = tokens): TokenItem[] {
  return [
    ...flattenColor(source.color, "CSP/color", []),
    ...flattenNumber(source.spacing, "CSP/spacing", []),
    ...flattenNumber(source.radius, "CSP/radius", []),
    ...flattenNumber(source.font.size, "CSP/font/size", []),
    ...flattenNumber(source.font.weight, "CSP/font/weight", []),
    ...flattenString(source.shadow, "CSP/shadow", []),
    ...flattenString(source.font.family, "CSP/font/family", [])
  ];
}

export async function getLocalVariables(
  fileKey: string,
  accessToken: string
): Promise<LocalVariablesResponse> {
  return figmaRequest<LocalVariablesResponse>(
    `/v1/files/${encodeURIComponent(fileKey)}/variables/local`,
    accessToken
  );
}

export async function postVariables(
  fileKey: string,
  accessToken: string,
  body: unknown
): Promise<unknown> {
  return figmaRequest(
    `/v1/files/${encodeURIComponent(fileKey)}/variables`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(body)
    }
  );
}

export function normalizeValue(item: TokenItem): string | number | FigmaColor {
  if (item.kind === "COLOR") return hexToFigmaColor(String(item.value));
  return item.value;
}

export function valueToComparable(
  value: string | number | FigmaColor | boolean | null
): string {
  if (isFigmaColor(value)) return figmaColorToHex(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function valueToTokenValue(
  kind: TokenKind,
  value: string | number | FigmaColor | boolean | null
): string | number | null {
  switch (kind) {
    case "COLOR":
      return isFigmaColor(value) ? figmaColorToHex(value) : null;
    case "FLOAT":
      return typeof value === "number" ? value : null;
    case "STRING":
      return typeof value === "string" ? value : null;
  }
}

export function writeTokensFile(nextTokens: DesignTokens): void {
  writeFileSync(
    tokensPath,
    `export const tokens = ${JSON.stringify(nextTokens, null, 2)} as const;\n\nexport type DesignTokens = typeof tokens;\n`
  );
}

export function runCommand(args: string[]): void {
  const result = spawnSync(args[0] ?? "pnpm", args.slice(1), {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed with status ${String(result.status)}`);
  }
}

function flattenColor(
  value: unknown,
  collectionName: string,
  path: string[]
): TokenItem[] {
  if (typeof value === "string" && value.startsWith("#")) {
    return [
      {
        collectionName,
        variableName: path.join("/"),
        tokenPath: ["color", ...path],
        kind: "COLOR",
        value
      }
    ];
  }
  return flattenObject(value, path, (child, nextPath) =>
    flattenColor(child, collectionName, nextPath)
  );
}

function flattenNumber(
  value: unknown,
  collectionName: string,
  path: string[]
): TokenItem[] {
  if (typeof value === "number") {
    return [
      {
        collectionName,
        variableName: path.join("/"),
        tokenPath: pathForCollection(collectionName, path),
        kind: "FLOAT",
        value
      }
    ];
  }
  return flattenObject(value, path, (child, nextPath) =>
    flattenNumber(child, collectionName, nextPath)
  );
}

function flattenString(
  value: unknown,
  collectionName: string,
  path: string[]
): TokenItem[] {
  if (typeof value === "string") {
    return [
      {
        collectionName,
        variableName: path.join("/"),
        tokenPath: pathForCollection(collectionName, path),
        kind: "STRING",
        value
      }
    ];
  }
  return flattenObject(value, path, (child, nextPath) =>
    flattenString(child, collectionName, nextPath)
  );
}

function flattenObject(
  value: unknown,
  path: string[],
  visit: (child: unknown, path: string[]) => TokenItem[]
): TokenItem[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => visit(child, [...path, key]));
}

function pathForCollection(collectionName: string, path: string[]): string[] {
  if (collectionName === "CSP/spacing") return ["spacing", ...path];
  if (collectionName === "CSP/radius") return ["radius", ...path];
  if (collectionName === "CSP/font/size") return ["font", "size", ...path];
  if (collectionName === "CSP/font/weight") return ["font", "weight", ...path];
  if (collectionName === "CSP/font/family") return ["font", "family", ...path];
  if (collectionName === "CSP/shadow") return ["shadow", ...path];
  return path;
}

async function figmaRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set("x-figma-token", accessToken);
  const response = await fetch(`https://api.figma.com${path}`, {
    ...init,
    headers
  });
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message = figmaErrorMessage(body) ?? response.statusText;
    throw new Error(
      `Figma API ${String(response.status)}: ${message}. Check file access, plan tier, and file_variables scopes.`
    );
  }
  return body as T;
}

function figmaErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if ("message" in value && typeof value.message === "string") return value.message;
  if ("err" in value && typeof value.err === "string") return value.err;
  return null;
}

function hexToFigmaColor(hex: string): FigmaColor {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return { r, g, b, a: 1 };
}

function figmaColorToHex(color: FigmaColor): string {
  const toHex = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function isFigmaColor(value: unknown): value is FigmaColor {
  return (
    !!value &&
    typeof value === "object" &&
    "r" in value &&
    "g" in value &&
    "b" in value &&
    "a" in value
  );
}
