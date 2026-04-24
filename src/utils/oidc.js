const AUTHORITY = import.meta.env.VITE_OIDC_AUTHORITY || ''
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || ''
const SCOPE     = 'openid profile email'

/**
 * The redirect_uri sent to Keycloak.
 * Derived from window.location.origin so it works on any domain.
 * Must exactly match Keycloak's Valid Redirect URIs (no trailing slash).
 */
export function getOidcRedirectUri() {
  return window.location.origin + '/auth/callback'
}

/**
 * Build the Keycloak authorization URL.
 * prompt=login is intentionally omitted — this allows seamless auto-login
 * when the user already has an active Keycloak session from another app.
 */
export function buildAuthorizationUrl() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('oidc_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  getOidcRedirectUri(),
    scope:         SCOPE,
    state,
  })

  return `${AUTHORITY}?${params.toString()}`
}

/**
 * Returns true only when both env vars are configured.
 * Use this to conditionally show/hide the SSO button.
 */
export function isSsoEnabled() {
  return Boolean(AUTHORITY && CLIENT_ID)
}
