import { specificGrowthRate, specificProductionRate, specificSubstrateUptake } from './kinetics'
import type { ReactorConfig } from './types'

/** State vector integrated by the solver: [X, S, P, V] */
export type StateVector = [number, number, number, number]

export interface Derivative {
  state: StateVector
  mu: number
}

/**
 * Returns the instantaneous derivatives (dX/dt, dS/dt, dP/dt, dV/dt) for
 * the given reactor type, state, and configuration. This is the single
 * place where the governing mass-balance equations live; the numerical
 * integrator and the UI never need to know the equations themselves.
 *
 * With qp = alpha*mu + beta and qS = mu/Yxs + qp/Yps + ms:
 *
 * Batch:      no inflow or outflow. V is constant.
 *   dX/dt = mu*X - kd*X
 *   dS/dt = -qS*X
 *   dP/dt = qp*X
 *   dV/dt = 0
 *
 * Fed-batch:  substrate fed at rate F, no outflow. V grows; D = F/V.
 *   dX/dt = mu*X - kd*X - D*X
 *   dS/dt = D*(Sf - S) - qS*X
 *   dP/dt = qp*X - D*P
 *   dV/dt = F
 *
 * CSTR:       inflow = outflow, V constant, D = F/V is a fixed parameter.
 *   dX/dt = mu*X - kd*X - D*X
 *   dS/dt = D*(Sf - S) - qS*X
 *   dP/dt = qp*X - D*P
 *   dV/dt = 0
 */
export function derivatives(state: StateVector, config: ReactorConfig): Derivative {
  const [X, Sraw, P, V] = state
  const S = Math.max(Sraw, 0)
  const Xc = Math.max(X, 0)
  const { kinetics, reactorType, fedBatch, cstr } = config

  const mu = specificGrowthRate(S, kinetics)
  const qp = specificProductionRate(mu, kinetics)
  const qS = specificSubstrateUptake(mu, kinetics)

  // Volumetric dilution rate and feed concentration for the reactor mode.
  let D = 0
  let Sf = 0
  let dV = 0
  if (reactorType === 'fedbatch') {
    D = V > 0 ? fedBatch.F / V : 0
    Sf = fedBatch.Sf
    dV = fedBatch.F
  } else if (reactorType === 'cstr') {
    D = cstr.D
    Sf = cstr.Sf
  }

  const dX = (mu - kinetics.kd - D) * Xc
  const dS = D * (Sf - S) - qS * Xc
  const dP = qp * Xc - D * P

  return { state: [dX, dS, dP, dV], mu }
}
