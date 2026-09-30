const INITIAL_VISIBLE = 3
const FIRST_REVEAL = 5

/**
 * How many invokers the list shows after `reveals` clicks of "show more".
 * Each click reveals twice as many as the last (5, then 10, then 20, …), so the
 * total is the initial three plus the geometric sum of the reveals so far:
 * 3, 8, 18, 38, 78. Derived from the click count rather than tracked as a
 * running total, so there is one piece of state instead of two that can disagree.
 */
export const visibleCount = (reveals: number) => INITIAL_VISIBLE + FIRST_REVEAL * (2 ** reveals - 1)
