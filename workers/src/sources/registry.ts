import type { SourceSystem } from "../types";
import type { SourceDefinition } from "./types";
import { grantsGovDefinition } from "./grantsGov";
import { hrsaDefinition } from "./hrsa";
import { samGovDefinition } from "./samGov";
import { tedEuDefinition } from "./tedEu";
import { ungmDefinition } from "./ungm";
import { worldBankDefinition } from "./worldBank";
import { edcDefinition } from "./edc";

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  grantsGovDefinition,
  samGovDefinition,
  hrsaDefinition,
  tedEuDefinition,
  ungmDefinition,
  worldBankDefinition,
  edcDefinition
];

export function getSourceDefinition(sourceId: SourceSystem): SourceDefinition | null {
  return SOURCE_DEFINITIONS.find((definition) => definition.id === sourceId) ?? null;
}
