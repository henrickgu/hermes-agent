import { translateNow } from '@/i18n'

import type { BillingRefusal } from './api'

export interface BillingRefusalPresentation {
  action: { type: 'none' } | { type: 'portal'; url?: string } | { type: 'retry' } | { type: 'step_up' }
  message: string
  title: string
}

const portalAction = (url?: string): BillingRefusalPresentation['action'] => ({ type: 'portal', url })

const retryMessage = (refusal: BillingRefusal): string => {
  const t = (key: string, ...args: unknown[]) => translateNow(key, ...args)
  const mins = refusal.retryAfter ? t('billing.refusalRetryIn', Math.max(1, Math.round(refusal.retryAfter / 60))) : ''

  return t('billing.refusalTooManyCharges', mins)
}

const stripeRetryMessage = (refusal: BillingRefusal): string => {
  const t = (key: string, ...args: unknown[]) => translateNow(key, ...args)
  const mins = refusal.retryAfter ? t('billing.refusalRetryIn', Math.max(1, Math.round(refusal.retryAfter / 60))) : ''

  return t('billing.refusalStripeTrouble', mins)
}

export const resolveRefusal = (refusal: BillingRefusal): BillingRefusalPresentation => {
  const t = (key: string, ...args: unknown[]) => translateNow(key, ...args)

  switch (refusal.kind) {
    case 'consent_required':
      return {
        action: portalAction(refusal.portalUrl),
        message: t('billing.refusalConsentMessage'),
        title: t('billing.refusalConsentTitle')
      }

    case 'insufficient_scope':
      return {
        action: { type: 'step_up' },
        message: t('billing.refusalScopeMessage'),
        title: t('billing.refusalScopeTitle')
      }
    case 'remote_spending_revoked': {
      const who =
        refusal.actor === 'admin' ? t('billing.refusalRevokedAdmin') : t('billing.refusalRevokedYou')

      return {
        action: portalAction(refusal.portalUrl),
        message: `${who}${t('billing.refusalRevokedSuffix')}`,
        title: t('billing.refusalRevokedTitle')
      }
    }

    case 'session_revoked':
      return {
        action: portalAction(refusal.portalUrl),
        message: t('billing.refusalSessionMessage'),
        title: t('billing.refusalSessionTitle')
      }

    case 'cli_billing_disabled':

    case 'remote_spending_disabled':
      return {
        action: portalAction(refusal.portalUrl),
        message: t('billing.refusalDisabledMessage'),
        title: t('billing.refusalDisabledTitle')
      }

    case 'role_required':
      return {
        action: portalAction(refusal.portalUrl),
        message: t('billing.refusalRoleMessage'),
        title: t('billing.refusalRoleTitle')
      }

    case 'idempotency_conflict':
      return {
        action: { type: 'none' },
        message: t('billing.refusalIdempotencyMessage'),
        title: t('billing.refusalIdempotencyTitle')
      }

    case 'no_payment_method':
      return {
        action: portalAction(refusal.portalUrl),
        message: t('billing.refusalNoCardSavedMessage'),
        title: t('billing.refusalNoCardSavedTitle')
      }

    case 'org_access_denied':
      return {
        action: { type: 'none' },
        message: t('billing.refusalOrgMessage'),
        title: t('billing.refusalOrgTitle')
      }
    case 'monthly_cap_exceeded': {
      const remaining = refusal.payload?.remainingUsd

      return {
        action: portalAction(refusal.portalUrl),
        message: remaining != null ? t('billing.refusalCapRemaining', `$${remaining}`) : t('billing.refusalCapMessage'),
        title: t('billing.refusalCapTitle')
      }
    }

    case 'rate_limited':

    case 'temporarily_unavailable':
      return {
        action: { type: 'retry' },
        message: retryMessage(refusal),
        title: t('billing.refusalTooManyChargesTitle')
      }

    case 'stripe_unavailable':
      return {
        action: { type: 'retry' },
        message: stripeRetryMessage(refusal),
        title: t('billing.refusalStripeTroubleTitle')
      }

    case 'upgrade_cap_exceeded':
      return {
        action: { type: 'none' },
        message: t('billing.refusalDailyCapMessage'),
        title: t('billing.refusalDailyCapTitle')
      }

    case 'endpoint_unavailable':
      return {
        action: { type: 'retry' },
        message: refusal.message || t('billing.refusalEndpointFallback'),
        title: t('billing.refusalEndpointTitle')
      }

    case 'timeout':
      return {
        action: { type: 'retry' },
        message: refusal.message || t('billing.refusalTimeoutFallback'),
        title: t('billing.refusalTimeoutTitle')
      }

    case 'transport':
      return {
        action: { type: 'retry' },
        message: refusal.message || t('billing.refusalTransportFallback'),
        title: t('billing.refusalTransportTitle')
      }

    default:
      return {
        action: { type: 'none' },
        message: refusal.message || t('billing.refusalGenericFallback'),
        title: t('billing.refusalGenericTitle')
      }
  }
}
