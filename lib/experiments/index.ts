export type {
  ExperimentStatus,
  Variant,
  Experiment,
  FeatureFlag,
  Assignment,
} from './types';
export { hashFraction, assignVariant, evaluateFlag } from './assignment';
export {
  EXPERIMENTS,
  FEATURE_FLAGS,
  getExperiment,
  getFlag,
  isFeatureEnabled,
} from './catalog';
export {
  ExperimentService,
  ExperimentError,
  type ExperimentServiceDeps,
} from './service';
