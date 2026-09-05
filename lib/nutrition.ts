/** Share of consumed energy supplied by fat; use unrounded energy. */
export function fatEnergyShare(macros: { p: number; c: number; f: number }) {
  const fatKcal = macros.f * 9;
  const totalKcal = macros.p * 4 + macros.c * 4 + fatKcal;
  return {
    fatKcal,
    percent:
      totalKcal > 0 ? Math.round((fatKcal / totalKcal) * 1000) / 10 : null,
  };
}
