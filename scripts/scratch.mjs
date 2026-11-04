// Scratch folders for the script tests that work on a copy outside the repository: each is made in
// the system's temp folder and removed after the test file's tests, pass or fail, and the file
// fails if any of them is still there, so no run leaves copies behind in $TMPDIR.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "node:test";

const made = [];

after(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
  assert.deepEqual(made.filter((dir) => existsSync(dir)), [], "a scratch folder outlived the test file");
});

/** A new empty folder in the system's temp folder, named `<prefix><random>`, removed after this file's tests. */
export function scratchDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  made.push(dir);
  return dir;
}

/** The scratch folders this file has made so far, for the check that they are gone. */
export const scratchDirs = () => [...made];
