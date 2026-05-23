import { describe, expect, it } from "vitest";
import { tokens } from "./tokens";

const colorCases = [
  ["color.brand.50", tokens.color.brand[50], "#F0F3FF"],
  ["color.brand.100", tokens.color.brand[100], "#DAE2FD"],
  ["color.brand.500", tokens.color.brand[500], "#2170E4"],
  ["color.brand.600", tokens.color.brand[600], "#0058BE"],
  ["color.brand.700", tokens.color.brand[700], "#131B2E"],
  ["color.accent.100", tokens.color.accent[100], "#D8E2FF"],
  ["color.accent.500", tokens.color.accent[500], "#ADC6FF"],
  ["color.accent.600", tokens.color.accent[600], "#004395"],
  ["color.surface.base", tokens.color.surface.base, "#F9F9FF"],
  ["color.surface.elevated", tokens.color.surface.elevated, "#FFFFFF"],
  ["color.surface.sunken", tokens.color.surface.sunken, "#E7EEFF"],
  ["color.ink.900", tokens.color.ink[900], "#111C2D"],
  ["color.ink.700", tokens.color.ink[700], "#45464D"],
  ["color.ink.500", tokens.color.ink[500], "#76777D"],
  ["color.ink.300", tokens.color.ink[300], "#C6C6CD"],
  ["color.ink.100", tokens.color.ink[100], "#D8E3FB"],
  ["color.line", tokens.color.line, "#C6C6CD"],
  ["color.success", tokens.color.success, "#0058BE"],
  ["color.danger", tokens.color.danger, "#BA1A1A"],
  ["color.warn", tokens.color.warn, "#F59E0B"],
  ["color.info", tokens.color.info, "#0058BE"]
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

  it("uses Pretendard as the first sans font", () => {
    expect(tokens.font.family.sans.startsWith("Pretendard Variable")).toBe(true);
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
