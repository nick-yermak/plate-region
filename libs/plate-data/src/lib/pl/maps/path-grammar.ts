/**
 * Country and county map paths use only absolute `M`, relative `l`, and `z`
 * (generate-county-maps.mts). Shared with specs and the web path decoder (#176).
 */
export const PATH_GRAMMAR = /^[Mlz\d -]+$/;
