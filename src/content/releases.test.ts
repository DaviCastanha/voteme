import { describe, expect, it } from "vitest";
import pkg from "../../package.json";
import { APP_VERSION, compareVersions, RELEASES, releasesSince } from "./releases";

describe("releases", () => {
  it("package.json tem a mesma versão da nota mais recente", () => {
    expect(pkg.version).toBe(APP_VERSION);
  });

  it("lista da mais nova pra mais antiga, cada uma com data e notas", () => {
    for (let i = 1; i < RELEASES.length; i++) {
      expect(compareVersions(RELEASES[i - 1].version, RELEASES[i].version)).toBeGreaterThan(0);
    }
    for (const r of RELEASES) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.title.trim()).not.toBe("");
      expect(r.items.length).toBeGreaterThan(0);
    }
  });

  it("compara versões numericamente", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBeGreaterThan(0);
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
  });

  it("releasesSince devolve só as mais novas", () => {
    expect(releasesSince("1.0.0").map((r) => r.version)).not.toContain("1.0.0");
    expect(releasesSince(null)).toEqual(RELEASES);
    expect(releasesSince(APP_VERSION)).toEqual([]);
  });
});
