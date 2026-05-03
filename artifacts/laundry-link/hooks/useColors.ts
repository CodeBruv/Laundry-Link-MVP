import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns design tokens. Always returns the light palette — light mode
 * is the enforced default per product spec. Dark palette is preserved in
 * constants/colors.ts for future opt-in, but is NOT applied here.
 */
export function useColors() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _scheme = useColorScheme(); // kept so React can re-render on OS change
  return { ...colors.light, radius: colors.radius };
}
