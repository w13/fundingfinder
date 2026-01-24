import type { SourceSystem } from "../types";
import type { SourceDefinition } from "./types";
import { grantsGovDefinition } from "./grantsGov";
import { hrsaDefinition } from "./hrsa";
import { samGovDefinition } from "./samGov";
import { tedEuDefinition } from "./tedEu";

const SOURCE_DEFINITIONS: SourceDefinition[] = [grantsGovDefinition, samGovDefinition, hrsaDefinition, tedEuDefinition];

export function getSourceDefinition(sourceId: SourceSystem): SourceDefinition | null {
  return SOURCE_DEFINITIONS.find((definition) => definition.id === sourceId) ?? null;
}
