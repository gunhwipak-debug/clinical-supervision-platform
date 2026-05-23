function main() {
  if (!process.env["FIGMA_ACCESS_TOKEN"] || !process.env["FIGMA_FILE_KEY"]) {
    console.warn("⚠ FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY missing; figma:init skipped.");
    return;
  }

  console.log(
    "Figma init: create Foundations, Components, and Pages manually if REST page creation is unavailable."
  );
}

main();
