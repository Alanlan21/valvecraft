import { createContext, useContext } from "react";
import type { NoteNomenclature } from "../types";

export const NomenclatureContext = createContext<NoteNomenclature>("anglo");

export function useNomenclature(): NoteNomenclature {
  return useContext(NomenclatureContext);
}
