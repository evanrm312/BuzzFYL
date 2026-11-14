import { readFileSync } from "node:fs";
import { Brain, type BrainData } from "../src/brain";

export function loadBrain(path = "public/data/brain_plastic.json"): Brain {
  return Brain.from(JSON.parse(readFileSync(path, "utf8")) as BrainData);
}
