// src/components/catalog/concepts/index.ts
import type { CatalogConceptId } from "@/lib/catalog/concepts";
import { kissa } from "./Kissa";
import { magazine } from "./Magazine";
import { saas } from "./Saas";
import { studio } from "./Studio";
import type { ConceptView } from "./types";

export const CONCEPT_VIEWS: Record<CatalogConceptId, ConceptView> = { kissa, saas, magazine, studio };
