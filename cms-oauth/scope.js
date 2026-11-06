// GitHub OAuth scopes for the Decap proxy.
// The browser may ask for a scope, but this module is the only place that chooses one.
// Decap's own default (AuthenticationPage.js) is `repo` when auth_scope is unset.
// That includes private repositories. This public blog does not need it.
// The `user` scope is full profile read/write. GitHub shows it as
// "Personal user data — Full access". Decap only calls GET /user for login and
// name, which a repository token already returns. Commits omit author and let
// GitHub use the authenticated account. Do not add `user`, `read:user`, or `user:email`.

export const PUBLIC_REPO_SCOPE = "public_repo";
export const PRIVATE_REPO_SCOPE = "repo";

const PRIVATE_FLAGS = new Set(["1", "true", "yes"]);

export function oauthScope(env) {
  const flag = env && env.GITHUB_REPO_PRIVATE;
  if (typeof flag === "string" && PRIVATE_FLAGS.has(flag.trim().toLowerCase())) {
    return PRIVATE_REPO_SCOPE;
  }
  return PUBLIC_REPO_SCOPE;
}
