import { readFileSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

/**
 * Load and parse a YAML test case file from tests/cases/.
 */
export function loadCases<T = any>(filename: string): T {
  const filePath = resolve(__dirname, "..", "cases", filename);
  const raw = readFileSync(filePath, "utf-8");
  return yaml.load(raw) as T;
}
