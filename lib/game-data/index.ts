export * from './types';
export {
  GAME_DATA_REFERENCE,
  MIN_TOWN_HALL,
  MAX_TOWN_HALL,
} from './reference-table';
export {
  ReferenceTableError,
  getTownHallReference,
  validateReferenceTable,
  heroIdsUnlockedAt,
  type ValidationResult,
} from './loader';
