/**
 * Layer 1 of the theme model: a brand palette (Corporate Identity).
 *
 * A palette holds deduplicated color scales only — individual hex values must
 * never appear outside a palette file. Themes (layer 2) map palette steps to
 * semantic tokens via buildTheme(); they contain zero literals by construction.
 */

/** 10-step color scale, lightest → darkest. Index 5 is the base tone (antd convention). */
export type ColorScale = string[]

/** 13-step neutral scale, white → black (antd "neutral color palette"). */
export type NeutralScale = string[]

export type Palette = {
    neutral: NeutralScale
    primary: ColorScale
    accent: ColorScale
    success: ColorScale
    warning: ColorScale
    error: ColorScale
    info: ColorScale
}
