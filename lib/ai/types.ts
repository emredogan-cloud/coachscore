/**
 * Types for the AI pipeline (Phase 2).
 *
 * The pipeline drafts the human-readable report from the deterministic engine's
 * EXACT computed values and a curated knowledge base. Hard guardrails (ADR
 * 0005) apply: the model never invents stats, outputs are schema-validated, and
 * the structured roadmap is verified against the engine's gap list before use.
 */

import type { CoachScoreResult, Goal } from '@/lib/core';

/** A provider-agnostic chat message. Untrusted user content is carried here. */
export interface ProviderMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/** A tool the model is forced to call to return structured output. */
export interface ProviderTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export interface GenerateOptions {
  readonly model: string;
  readonly system: string;
  readonly messages: readonly ProviderMessage[];
  readonly maxTokens: number;
  /** When set, the model is forced to call this tool and return its input. */
  readonly tool?: ProviderTool;
  /** Optional image blocks (base64) for vision extraction. */
  readonly images?: readonly ProviderImage[];
  /**
   * Mark the (large, static) system prompt for prompt caching (Phase 8). The
   * provider sets an ephemeral cache breakpoint so repeated KB/reference context
   * is billed at the cache-read rate. No effect on providers that don't cache.
   */
  readonly cacheSystem?: boolean;
}

export interface ProviderImage {
  readonly mediaType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly dataBase64: string;
}

export interface ProviderUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Prompt-cache read tokens (billed at the reduced cache-read rate). */
  readonly cacheReadInputTokens?: number;
  /** Prompt-cache creation tokens (the write that seeds the cache). */
  readonly cacheCreationInputTokens?: number;
}

export interface ProviderResponse {
  readonly text: string;
  /** Parsed input of the forced tool call, if a tool was requested. */
  readonly toolInput: unknown;
  readonly stopReason: string;
  readonly usage: ProviderUsage;
  /** True when served from the response cache (no API call, zero marginal cost). */
  readonly cached?: boolean;
}

/** The provider abstraction (ADR 0005): swap models/vendors without callers. */
export interface AiProvider {
  generate(options: GenerateOptions): Promise<ProviderResponse>;
}

/** Input to the report-draft step — exact computed values + grounding. */
export interface DraftInput {
  readonly townHall: number;
  readonly goal: Goal;
  /** The deterministic engine result — the single source of numeric truth. */
  readonly result: CoachScoreResult;
  /** Optional, UNTRUSTED user free-text ("what's frustrating you?"). */
  readonly userFrustration?: string;
  /** Curated, patch-updated meta knowledge for this TH band. */
  readonly knowledgeBase: string;
}

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface RoadmapItemDraft {
  readonly rank: number;
  readonly elementId: string;
  readonly fromLevel: number;
  readonly toLevel: number;
  readonly rationale: string;
  readonly estimatedImpact: ImpactLevel;
}

export interface ReportDraft {
  readonly diagnosis: string;
  readonly roadmap: readonly RoadmapItemDraft[];
  readonly goalTips: readonly string[];
}

export interface ReferenceReadiness {
  readonly ready: boolean;
  readonly unverifiedCount: number;
  readonly unverifiedFields: readonly string[];
}

export interface DraftResult {
  readonly ok: boolean;
  readonly draft: ReportDraft | null;
  /** 0..1 overall confidence; below the floor → needs human review. */
  readonly confidence: number;
  readonly needsHumanReview: boolean;
  readonly flags: readonly string[];
  readonly attempts: number;
  /** Whether the underlying reference data is verified for paid generation. */
  readonly referenceData: ReferenceReadiness;
  readonly usage: ProviderUsage | null;
}

/** One field extracted from a screenshot, with confidence + provenance. */
export interface ExtractedField {
  readonly key: string;
  readonly value: number;
  readonly confidence: number;
  readonly needsConfirmation: boolean;
}

export interface ExtractionResult {
  readonly fields: readonly ExtractedField[];
  /** Fields below the confidence floor that the user must confirm/correct. */
  readonly lowConfidence: readonly ExtractedField[];
  readonly usage: ProviderUsage | null;
}

/** Confidence floor below which output must be confirmed by a human. */
export const CONFIDENCE_FLOOR = 0.6;
/** Max draft attempts before flagging for human review. */
export const MAX_DRAFT_ATTEMPTS = 3;
