/**
 * Feature flags for EyesOfAzrael.
 *
 * Flags are read at runtime — flip them here (or override via console) to test
 * new code paths without redeploying.
 *
 * ENTITY_SOURCE
 *   'firestore-only'   Current behaviour: all standard-entity reads come from
 *                      Firestore. Safe default — identical to pre-flag behaviour.
 *
 *   'static+delta'     New behaviour: standard entities are served from the static
 *                      CDN base (static/entities/), with only post-base additions
 *                      and edits fetched from Firestore. Much lower read cost.
 *                      Enable after validating the export matches live data.
 *
 * To switch on the new path without a deploy, run in DevTools:
 *   window.FEATURES.ENTITY_SOURCE = 'static+delta';
 *   location.reload();
 */
const FEATURES = {
    ENTITY_SOURCE: 'firestore-only',
};

if (typeof window !== 'undefined') {
    window.FEATURES = FEATURES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FEATURES;
}
