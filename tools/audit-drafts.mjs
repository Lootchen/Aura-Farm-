import fs from "node:fs/promises";

const source =
  await fs.readFile(
    new URL(
      "../src/draft.js",
      import.meta.url
    ),
    "utf8"
  );
const encoded =
  Buffer.from(
    source,
    "utf8"
  ).toString("base64");
const draft =
  await import(
    `data:text/javascript;base64,${encoded}`
  );

const seedCount =
  Math.max(
    64,
    Number(
      process.argv[2] ||
      2048
    ) || 2048
  );
const report =
  draft.auditDraftSeeds({
    seedCount
  });

console.log(
  JSON.stringify(
    report,
    null,
    2
  )
);

if (!report.ok) {
  process.exitCode = 1;
}
