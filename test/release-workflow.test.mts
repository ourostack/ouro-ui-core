import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

function attachedFiles(text: string): string[] {
  const files = text.match(/gh release create [^\n]*\n\s+(.+)\n/)?.[1];
  assert.ok(files, "release.yml runs gh release create with its files on the next line");
  return files.split(/\s+/).map((file) => file.replace(/^"|"$/g, "").replace("$GITHUB_REF_NAME", "${{ github.ref_name }}"));
}

function attestedFiles(text: string): string[] {
  const subjects = text.match(/uses: actions\/attest-build-provenance@[0-9a-f]{40} # v\S+\n\s+with:\n\s+subject-path: \|\n((?: {12}[^\n]+\n)+)/)?.[1];
  assert.ok(subjects, "release.yml attests with actions/attest-build-provenance, pinned to a full commit SHA, listing subject-path one file per line");
  return subjects.trim().split(/\n\s*/);
}

test("every file the release attaches carries a build attestation, made before the release is created", () => {
  assert.deepEqual([...attestedFiles(workflow)].sort(), [...attachedFiles(workflow)].sort());
  assert.ok(workflow.indexOf("attest-build-provenance") < workflow.indexOf("gh release create"));
  assert.match(workflow, /^permissions:\n(?: {2}.*\n)*? {2}id-token: write\n/m);
  assert.match(workflow, /^permissions:\n(?: {2}.*\n)*? {2}attestations: write\n/m);
});

test("a file attached but not attested fails the check", () => {
  const missing = workflow.replace(/ {12}swatches\.html\n/, "");
  assert.notDeepEqual([...attestedFiles(missing)].sort(), [...attachedFiles(missing)].sort());
});
