/**
 * Geometry of the 3D stirred tank, in scene units (1 unit ~ 7 cm for a
 * ~2 L bench-top vessel). Proportions follow common lab STR practice:
 * H/T ~ 1.5, impeller D ~ T/3, baffles ~ T/10, lower impeller ~ T/3 off
 * the bottom, sparger ring below the lower impeller.
 */
export const R_IN = 1.0 // glass inner radius (T/2)
export const R_OUT = 1.045 // glass outer radius
export const R_LIQ = 0.992 // liquid body radius (just inside the glass)
export const Y0 = 0.36 // inner bottom of the vessel
export const H = 3.1 // inner height available to liquid
export const Y_TOP = Y0 + H // underside of the head plate
export const HEAD_T = 0.13 // head plate thickness
export const HEAD_R = 1.2

export const IMP_R = 0.35 // Rushton turbine radius (D ~ T/3)
export const IMP_LOW = Y0 + 0.62
export const IMP_HIGH = Y0 + 1.72
export const SPARGE_Y = Y0 + 0.2
export const SPARGE_R = 0.27

export const TARGET_Y = 2.15

/** Head-plate port positions (x, z). */
export const PORT_FEED: [number, number] = [-0.56, 0.4]
export const PORT_HARVEST: [number, number] = [0.6, -0.3]
export const PORT_SPARGE: [number, number] = [-0.45, -0.55]

export const levelY = (level: number) => Y0 + level * H
