import { it } from "vitest";
import fs from "node:fs";
import { parseEdition } from "./parser";

it("inspect claims/deks", () => {
  for (const id of ["2026-07-23", "2026-07-27", "2026-07-22"]) {
    const md = fs.readFileSync(`content/editions/edition-${id}.md`, "utf8");
    const e = parseEdition(md, id);
    const claimCounts = e.stories.map((s) => s.claims.length);
    const deks = e.stories.filter((s) => s.dek).length;
    console.log(id, { stories: e.stories.length, deks, claimCounts, humanDate: e.humanDate });
  }
});
