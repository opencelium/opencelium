const subscriptionTypeLabels: Record<string, string> = {
    admin: 'OC Admin',
    duo_customer: 'Duo',
    unlimited_customer: 'Unlimited',
    professional: 'Professional',
    enterprise: 'Enterprise',
    enterprise_plus: 'Enterprise Plus',
    starter_api: 'OpenCelium Starter',
    professional_api: 'OpenCelium Professional',
    enterprise_api: 'OpenCelium Enterprise',
    enterprise_plus_api: 'OpenCelium Enterprise Plus',
    free: 'Free',
    empty: '-',
}

export function getSubscriptionTypeLabel(type: string): string {
    return subscriptionTypeLabels[type] ?? type
}
