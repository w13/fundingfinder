import type { SourceSystem } from "../types";
import type { SourceDefinition } from "./types";
import { grantsGovDefinition } from "./grantsGov";
import { hrsaDefinition } from "./hrsa";
import { samGovDefinition } from "./samGov";
import { tedEuDefinition } from "./tedEu";
import { ungmDefinition } from "./ungm";
import { undpDefinition } from "./undp";
import { worldBankDefinition } from "./worldBank";
import { edcDefinition } from "./edc";
import { prozorroDefinition } from "./prozorro";
import { contractsFinderDefinition } from "./contractsFinder";
import { canadaBuysDefinition } from "./canadaBuys";
import { ausTenderDefinition } from "./ausTender";
import { adbDefinition } from "./adb";
import { jetroDefinition } from "./jetro";
import { chileCompraDefinition } from "./chileCompra";

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  grantsGovDefinition,
  samGovDefinition,
  hrsaDefinition,
  tedEuDefinition,
  ungmDefinition,
  undpDefinition,
  worldBankDefinition,
  edcDefinition,
  prozorroDefinition,
  contractsFinderDefinition,
  canadaBuysDefinition,
  ausTenderDefinition,
  adbDefinition,
  jetroDefinition,
  chileCompraDefinition
];

export function getSourceDefinition(sourceId: SourceSystem): SourceDefinition | null {
  return SOURCE_DEFINITIONS.find((definition) => definition.id === sourceId) ?? null;
}