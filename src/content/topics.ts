/** Learn-page topics, in teaching order. Used by the Learn page and the nav menu. */
export const LEARN_TOPICS = [
  { id: 'bioreactor', title: 'What is a bioreactor?' },
  { id: 'biomass', title: 'Biomass' },
  { id: 'substrate', title: 'Substrate' },
  { id: 'product', title: 'Product' },
  { id: 'monod', title: 'Monod kinetics' },
  { id: 'yield', title: 'Yield' },
  { id: 'dilution', title: 'Dilution rate' },
  { id: 'modes', title: 'Batch vs fed-batch vs CSTR' },
  { id: 'washout', title: 'Washout' },
  { id: 'graphs', title: 'Reading the graphs' },
] as const

export type LearnTopicId = (typeof LEARN_TOPICS)[number]['id']
