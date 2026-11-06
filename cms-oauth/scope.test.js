import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { oauthScope, PRIVATE_REPO_SCOPE, PUBLIC_REPO_SCOPE } from "./scope.js";

function parts(scope) {
  return scope.split(/[,\s]+/).filter(Boolean);
}

test("a public blog asks only for public_repo", () => {
  for (const env of [
    undefined,
    {},
    { GITHUB_REPO_PRIVATE: undefined },
    { GITHUB_REPO_PRIVATE: "0" },
    { GITHUB_REPO_PRIVATE: "false" },
    { GITHUB_REPO_PRIVATE: "no" },
    { GITHUB_REPO_PRIVATE: "" },
    { GITHUB_REPO_PRIVATE: "public" }
  ]) {
    const scope = oauthScope(env);
    assert.equal(scope, PUBLIC_REPO_SCOPE);
    assert.deepEqual(parts(scope), ["public_repo"]);
  }
});

test("a private repo asks for repo and still not for user profile", () => {
  for (const flag of ["1", "true", " yes ", "TRUE"]) {
    const scope = oauthScope({ GITHUB_REPO_PRIVATE: flag });
    assert.equal(scope, PRIVATE_REPO_SCOPE);
    assert.deepEqual(parts(scope), ["repo"]);
  }
});

test("no accepted scope grants personal user data", () => {
  const scopes = [
    oauthScope({}),
    oauthScope({ GITHUB_REPO_PRIVATE: "1" })
  ];
  for (const scope of scopes) {
    for (const part of parts(scope)) {
      assert.equal(part === "user" || part.startsWith("user:"), false, scope);
      assert.notEqual(part, "read:user");
    }
  }
});

test("the worker uses oauthScope and does not hardcode user", () => {
  const src = fs.readFileSync(new URL("./worker.js", import.meta.url), "utf8");
  assert.match(src, /oauthScope\(env\)/);
  assert.doesNotMatch(src, /public_repo,\s*user/);
  assert.doesNotMatch(src, /repo,\s*user/);
  assert.doesNotMatch(src, /searchParams\.get\(\s*["']scope["']\s*\)/);
});
