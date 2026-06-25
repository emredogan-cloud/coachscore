/**
 * Framework-agnostic product handlers (Phase 6) for ReplayDoctor / BaseDoctor /
 * WarPlan.
 *
 * `handleProductSubmit` validates a submission, runs the deterministic engine
 * (optionally AI-enriched when ANTHROPIC_API_KEY is set), and returns the report
 * inline — this works with no credentials. Persistence is attempted only when the
 * database is activated; checkout only when Stripe + the database are. All seams
 * (activation flags, AI provider, persist, payment provider, repos) are
 * injectable, so the handlers are unit-tested without a key, a database, or a
 * network.
 */

import { z } from 'zod';
import {
  isAiConfigured,
  isDatabaseConfigured,
  isPaymentsConfigured,
} from '@/lib/activation';
import { defaultProvider } from '@/lib/ai';
import type { AiProvider } from '@/lib/ai';
import { appConfig } from '@/lib/env';
import type { Repositories } from '@/lib/db';
import { createProductCheckout, type PaymentProvider } from '@/lib/payments';
import {
  parseProductInput,
  ProductSkuSchema,
  ProductSubmissionSchema,
  runProductAnalysis,
  type ProductInput,
  type ProductReportView,
  type ProductSku,
} from '@/lib/products';
import {
  errorToResult,
  NotActivatedError,
  NotFoundError,
  ValidationError,
} from './errors';
import type { HandlerResult } from './intake-handler';
import { resolveProvider, resolveRepos } from './payment-wire';
import {
  persistProductReport,
  resolveProductReport,
  type ProductPersistenceInfo,
} from './product-wire';

export interface ProductSubmitResponseBody {
  readonly ok: boolean;
  readonly sku: ProductSku;
  readonly report: ProductReportView;
  readonly persistence: ProductPersistenceInfo;
}

export interface ProductSubmitHandlerDeps {
  readonly isAiConfigured?: () => boolean;
  readonly provider?: AiProvider;
  readonly isDbConfigured?: () => boolean;
  readonly persist?: (args: {
    readonly request: ProductInput;
    readonly report: ProductReportView;
    readonly context?: string;
    readonly uploadKeys?: readonly string[];
  }) => Promise<ProductPersistenceInfo>;
}

async function resolvePersistence(
  request: ProductInput,
  report: ProductReportView,
  body: { context?: string; uploadKeys?: readonly string[] },
  deps: ProductSubmitHandlerDeps,
): Promise<ProductPersistenceInfo> {
  const dbConfigured = (deps.isDbConfigured ?? isDatabaseConfigured)();
  if (!dbConfigured) {
    return {
      attempted: false,
      persisted: false,
      reason: 'database_not_configured',
    };
  }
  return (deps.persist ?? persistProductReport)({
    request,
    report,
    context: body.context,
    uploadKeys: body.uploadKeys,
  });
}

export async function handleProductSubmit(
  rawBody: unknown,
  deps: ProductSubmitHandlerDeps = {},
): Promise<HandlerResult> {
  const parsedBody = ProductSubmissionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return errorToResult(
      new ValidationError(
        'Invalid product submission body.',
        parsedBody.error.flatten(),
      ),
    );
  }
  const parsedInput = parseProductInput(
    parsedBody.data.sku,
    parsedBody.data.input,
  );
  if (!parsedInput.ok) {
    return errorToResult(new ValidationError(parsedInput.errors.join('; ')));
  }

  const aiOn = (deps.isAiConfigured ?? isAiConfigured)();
  const provider = aiOn ? (deps.provider ?? defaultProvider()) : undefined;
  const report = await runProductAnalysis(parsedInput.value, { provider });

  const persistence = await resolvePersistence(
    parsedInput.value,
    report,
    {
      context: parsedBody.data.context,
      uploadKeys: parsedBody.data.uploadKeys,
    },
    deps,
  );

  const body: ProductSubmitResponseBody = {
    ok: true,
    sku: parsedBody.data.sku,
    report,
    persistence,
  };
  return { status: 200, body };
}

export interface ProductReportHandlerDeps {
  readonly isDbConfigured?: () => boolean;
  readonly fetch?: (reportId: string) => Promise<ProductReportView | null>;
}

export async function handleProductReport(
  reportId: string,
  deps: ProductReportHandlerDeps = {},
): Promise<HandlerResult> {
  if (!(deps.isDbConfigured ?? isDatabaseConfigured)()) {
    return errorToResult(
      new NotActivatedError(
        'Product report retrieval is not activated: set DATABASE_URL.',
      ),
    );
  }
  const report = await (deps.fetch ?? resolveProductReport)(reportId);
  if (report === null) {
    return errorToResult(new NotFoundError('Product report not found.'));
  }
  return { status: 200, body: { ok: true, report } };
}

const ProductCheckoutSchema = z.object({
  sku: ProductSkuSchema,
  customerEmail: z.string().email().optional(),
});

export interface ProductCheckoutHandlerDeps {
  readonly isActivated?: () => boolean;
  readonly provider?: PaymentProvider;
  readonly repos?: Repositories;
  readonly appUrl?: string;
}

export async function handleProductCheckout(
  rawBody: unknown,
  deps: ProductCheckoutHandlerDeps = {},
): Promise<HandlerResult> {
  const parsed = ProductCheckoutSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorToResult(
      new ValidationError(
        'Invalid product checkout body.',
        parsed.error.flatten(),
      ),
    );
  }

  const activated = (
    deps.isActivated ?? (() => isPaymentsConfigured() && isDatabaseConfigured())
  )();
  if (!activated) {
    return errorToResult(
      new NotActivatedError(
        'Payments are not activated: set STRIPE_SECRET_KEY (+ webhook secret) ' +
          'and DATABASE_URL.',
      ),
    );
  }

  const appUrl = deps.appUrl ?? appConfig.url;
  const provider = deps.provider ?? resolveProvider();
  const repos = deps.repos ?? resolveRepos();

  const result = await createProductCheckout(
    {
      sku: parsed.data.sku,
      customerEmail: parsed.data.customerEmail,
      successUrl: `${appUrl}/products/${parsed.data.sku}?status=success`,
      cancelUrl: `${appUrl}/products?status=cancelled`,
    },
    { provider, repos },
  );

  return {
    status: 200,
    body: {
      orderId: result.orderId,
      url: result.url,
      amountCents: result.amountCents,
    },
  };
}
