/**
 * The value standing for "no replacement" — the old behaviour, and the default:
 * a deletion must never quietly re-point someone's reference at a method they
 * did not choose.
 *
 * A word rather than an empty string, because the Select primitive reads a
 * falsy value as "nothing selected" (`value={!value ? null : value}`, which is
 * what makes its placeholder work) — so an option valued `''` could be picked
 * but never showed as picked. Cannot collide with a candidate: those are
 * `#rrggbb` colours.
 */
export const CLEAR = 'clear';

/* The confirm dialog hosting these rows is at 20000 (ConfirmDialogProvider), and
   every popup the reference generator opens is rendered on document.body — so
   they have to be told to stack above it or they open behind the dialog they
   were opened from. */
export const CONFIRM_POPUP_Z_INDEX = 20010;

/**
 * Room for three references side by side, two of which carry a method select as
 * well as a response-part switch and a path — nine controls across. Capped
 * against the viewport rather than fixed, so a narrow screen gets a dialog it
 * can actually show instead of one clipped at both edges.
 */
export const REMAP_DIALOG_WIDTH = 'min(1280px, 94vw)';
