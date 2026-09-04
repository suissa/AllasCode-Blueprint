import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  compileEvidencePlan,
  type Evidence,
} from "../runtime/content-addressed-evidence.js";
import type { SemanticGraph } from "../runtime/semantic-graph.js";
const root = join(import.meta.dirname, "..");
const profile =
  process.argv.find((a) => a.startsWith("--profile="))?.split("=")[1] ?? "dev";
const environment =
  process.argv.find((a) => a.startsWith("--environment="))?.split("=")[1] ??
  `functional:node-${process.versions.node.split(".")[0]}-${process.platform}-${process.arch}`;
const previous = process.argv
  .find((a) => a.startsWith("--previous="))
  ?.split("=")[1];
const graph = JSON.parse(
  await readFile(join(root, "generated/semantic-graph.json"), "utf8"),
) as SemanticGraph;
const priorEvidence = previous
  ? ((JSON.parse(await readFile(previous, "utf8")) as { evidence?: Evidence[] })
      .evidence ?? [])
  : [];
const plan = await compileEvidencePlan({
  root,
  graph,
  artifactId: "allascode.example.commerce",
  profileId: profile,
  environmentClass: environment,
  priorEvidence,
});
await mkdir(join(root, "generated", "evidence"), { recursive: true });
const output = join(root, "generated", "evidence", `${profile}-plan.json`);
await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
console.log(
  `${output}: requirements=${plan.closure.required_count} execute=${plan.closure.execute_count} reuse=${plan.closure.reusable_count} rejected=${plan.closure.rejected_count}`,
);
