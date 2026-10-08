/**
 * What the tutorial's invented systems "answer" during the simulated test run.
 *
 * Kept apart from `tutorialFixtures.ts`, which describes what the two connectors CAN
 * do (the invoker operations the sidebar browses). This is what they did on one
 * particular run — the payloads the log tree shows when a method row is opened.
 *
 * Three customers, of whom the middle one already has an account: enough for the loop
 * to go round more than once (so its pager and the "skip to next iteration" control
 * have somewhere to go) and for the IF to be seen taking both branches.
 */
export type TutorialCustomer = {
    id: string
    email: string
    firstName: string
    lastName: string
    company: string
}

export const TUTORIAL_CUSTOMERS: TutorialCustomer[] = [
    { id: 'c-1001', email: 'mara.holt@northwind.example', firstName: 'Mara', lastName: 'Holt', company: 'Northwind' },
    { id: 'c-1002', email: 'jon.reyes@lakeside.example', firstName: 'Jon', lastName: 'Reyes', company: 'Lakeside' },
    { id: 'c-1003', email: 'ada.silva@brightbit.example', firstName: 'Ada', lastName: 'Silva', company: 'Brightbit' },
]

/** Which customers the support desk already knows — the IF's false branch. */
const KNOWN_EMAILS = new Set([TUTORIAL_CUSTOMERS[1].email])

export const isKnownCustomer = (iteration: number): boolean =>
    KNOWN_EMAILS.has(TUTORIAL_CUSTOMERS[iteration % TUTORIAL_CUSTOMERS.length].email)

export const customerAt = (iteration: number): TutorialCustomer =>
    TUTORIAL_CUSTOMERS[iteration % TUTORIAL_CUSTOMERS.length]

/**
 * How many times the loop goes round. Read off the customer list rather than fixed,
 * so the response the user can open in the log tree and the iteration count the loop
 * node displays cannot disagree.
 */
export const TUTORIAL_ITERATIONS = TUTORIAL_CUSTOMERS.length

const username = (customer: TutorialCustomer) => `${customer.firstName} ${customer.lastName}`

/**
 * The request and response bodies for one occurrence of a method, chosen by the
 * operation name the user placed. Falls back to an empty exchange for anything else,
 * so a graph that wandered off the script still plays rather than throwing.
 */
export const tutorialExchange = (
    methodName: string,
    iteration: number,
): { request: unknown; response: unknown; status: string } => {
    const customer = customerAt(iteration)
    switch (methodName) {
        case 'getCustomers':
            return { request: {}, response: { customers: TUTORIAL_CUSTOMERS }, status: '200' }
        case 'getClientByEmail':
            return isKnownCustomer(iteration)
                ? {
                    request: {},
                    status: '200',
                    response: {
                        found: true,
                        client: { id: 'cl-77', email: customer.email, username: username(customer) },
                    },
                }
                : { request: {}, response: { found: false, client: null }, status: '200' }
        case 'createClient':
            return {
                status: '201',
                request: { email: customer.email, username: username(customer) },
                response: { id: `cl-${900 + iteration}`, email: customer.email, username: username(customer) },
            }
        default:
            return { request: {}, response: {}, status: '200' }
    }
}

/** Plausible per-call timings, so the durations in the tree are not all identical. */
export const tutorialDuration = (methodName: string, iteration: number): string => {
    const base = methodName === 'getCustomers' ? 184 : methodName === 'createClient' ? 141 : 96
    return `${base + iteration * 17}ms`
}
