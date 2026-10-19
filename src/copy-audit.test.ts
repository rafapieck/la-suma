import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// The app never says or implies what the user can or cannot afford (packet, Blueprint).
// This scans every source file so a future change cannot slip a verdict in.
const FORBIDDEN = [
  /puedes pagar/i,
  /no puedes/i,
  /alcanza/i,
  /afford/i,
  /puedes permitir/i,
  /te conviene/i,
  /deberías/i,
  /recomend/i,
];

const ROOT = join(__dirname);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

describe("copy audit", () => {
  it("has no affordability verdicts or advice in any source file", () => {
    const hits = sourceFiles(ROOT).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return FORBIDDEN.filter((re) => re.test(text)).map((re) => `${relative(ROOT, file)}: ${re}`);
    });
    expect(hits).toEqual([]);
  });

  it("actually scans the app's files", () => {
    expect(sourceFiles(ROOT).length).toBeGreaterThan(20);
  });
});
