import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

const colorCases = [
  ["color.brand.50", tokens.color.brand[50], "#F4F8FF"],
  ["color.brand.100", tokens.color.brand[100], "#EEF4FF"],
  ["color.brand.500", tokens.color.brand[500], "#2563FF"],
  ["color.brand.600", tokens.color.brand[600], "#2563FF"],
  ["color.brand.700", tokens.color.brand[700], "#1D4ED8"],
  ["color.accent.100", tokens.color.accent[100], "#EEF4FF"],
  ["color.accent.500", tokens.color.accent[500], "#2563FF"],
  ["color.accent.600", tokens.color.accent[600], "#1D4ED8"],
  ["color.surface.base", tokens.color.surface.base, "#FFFFFF"],
  ["color.surface.elevated", tokens.color.surface.elevated, "#FFFFFF"],
  ["color.surface.sunken", tokens.color.surface.sunken, "#F4F8FF"],
  ["color.ink.900", tokens.color.ink[900], "#081225"],
  ["color.ink.700", tokens.color.ink[700], "#344054"],
  ["color.ink.500", tokens.color.ink[500], "#667085"],
  ["color.ink.300", tokens.color.ink[300], "#98A2B3"],
  ["color.ink.100", tokens.color.ink[100], "#E7EBF1"],
  ["color.line", tokens.color.line, "#E7EBF1"],
  ["color.success", tokens.color.success, "#2563FF"],
  ["color.danger", tokens.color.danger, "#BA1A1A"],
  ["color.warn", tokens.color.warn, "#F59E0B"],
  ["color.info", tokens.color.info, "#2563FF"]
] as const;

const radiusCases = [
  ["radius.sm", tokens.radius.sm, 8],
  ["radius.md", tokens.radius.md, 12],
  ["radius.lg", tokens.radius.lg, 16],
  ["radius.xl", tokens.radius.xl, 20],
  ["radius.pill", tokens.radius.pill, 9999]
] as const;

const spacingCases = Object.entries(tokens.spacing).map(
  ([key, value]) => [`spacing.${key}`, value, Number(key) * 4] as const
);

const fontSizeCases = [
  ["font.size.xs", tokens.font.size.xs, 12],
  ["font.size.sm", tokens.font.size.sm, 14],
  ["font.size.base", tokens.font.size.base, 15],
  ["font.size.lg", tokens.font.size.lg, 17],
  ["font.size.xl", tokens.font.size.xl, 20],
  ["font.size.2xl", tokens.font.size["2xl"], 24],
  ["font.size.3xl", tokens.font.size["3xl"], 32],
  ["font.size.4xl", tokens.font.size["4xl"], 40]
] as const;

const weightCases = [
  ["font.weight.regular", tokens.font.weight.regular, 400],
  ["font.weight.medium", tokens.font.weight.medium, 500],
  ["font.weight.semibold", tokens.font.weight.semibold, 600],
  ["font.weight.bold", tokens.font.weight.bold, 700]
] as const;

const lineHeightCases = [
  ["font.lineHeight.tight", tokens.font.lineHeight.tight, 1.25],
  ["font.lineHeight.normal", tokens.font.lineHeight.normal, 1.55],
  ["font.lineHeight.relaxed", tokens.font.lineHeight.relaxed, 1.7]
] as const;

describe("design tokens", () => {
  it.each(colorCases)("%s is stable", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each(radiusCases)("%s is stable", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each(spacingCases)("%s follows the 4px scale", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each(fontSizeCases)("%s is stable", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each(weightCases)("%s is stable", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each(lineHeightCases)("%s is stable", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it("uses Noto Sans KR as the first sans font", () => {
    expect(tokens.font.family.sans.startsWith("Noto Sans KR")).toBe(true);
  });

  it("keeps card and pop shadows defined", () => {
    expect(tokens.shadow.card).toContain("rgba");
    expect(tokens.shadow.pop).toContain("rgba");
  });

  it("keeps motion timings short enough for UI feedback", () => {
    expect(tokens.motion.duration.fast).toBeLessThan(tokens.motion.duration.normal);
    expect(tokens.motion.duration.slow).toBeGreaterThan(tokens.motion.duration.normal);
  });
});
