// Loads the BuzzFYL UI module against a stubbed DOM to catch runtime errors without a browser.
//   npx tsx scripts/uismoke.ts "?view=results"   (views: workbench, notebook, tutorial, live&t=30, results, compare)
import { readFileSync } from "node:fs";
const el: any = new Proxy(function () {}, { get: (_t, k) => (k === "length" ? 0 : k === Symbol.iterator ? undefined : k === "forEach" ? () => {} : el), set: () => true, apply: () => el });
const g: any = globalThis;
g.document = { querySelector: () => el, querySelectorAll: () => ({ forEach() {} }), addEventListener() {}, createElement: () => el, body: el };
g.location = { search: process.argv[2] ?? "" };
g.requestAnimationFrame = () => 0;
g.fetch = async (u: string) => ({ ok: true, json: async () => JSON.parse(readFileSync("public/" + u, "utf8")) });
const app: string = "../ui/dist/app.js";
await import(app);
console.log("ok", process.argv[2]);
