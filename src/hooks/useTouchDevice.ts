import { useState } from "react";

export function useTouchDevice() {
  return useState(() => window.matchMedia("(pointer: coarse)").matches)[0];
}
