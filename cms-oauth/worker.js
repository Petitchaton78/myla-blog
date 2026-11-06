// GitHub OAuth proxy for Decap CMS on GitHub Pages.
// Protocol matches sterlingwes/decap-proxy (GET /auth, GET /callback, postMessage to the opener).
// Secret names here are GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.

function randomHex(bytes) {
  var buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

function repoScope(env) {
  var flag = env.GITHUB_REPO_PRIVATE;
  if (flag !== undefined && flag !== "0" && flag !== "false") return "repo,user";
  return "public_repo,user";
}

function redirectUri(url) {
  return "https://" + url.hostname + "/callback?provider=github";
}

function authorizeURL(env, url) {
  var params = new URLSearchParams({
    response_type: "code",
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri(url),
    scope: repoScope(env),
    state: randomHex(4)
  });
  return "https://github.com/login/oauth/authorize?" + params.toString();
}

function callbackHtml(status, token) {
  var payload = JSON.stringify({ token: token });
  var message = "authorization:github:" + status + ":" + payload;
  var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>登录</title></head><body><p>正在回到内容管理。</p><script>" +
    "var receive=function(event){window.opener&&window.opener.postMessage(" + JSON.stringify(message) + ",\"*\");window.removeEventListener(\"message\",receive,false);};" +
    "window.addEventListener(\"message\",receive,false);" +
    "window.opener&&window.opener.postMessage(\"authorizing:github\",\"*\");" +
    "</script></body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleAuth(url, env) {
  if (url.searchParams.get("provider") !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response("Worker is missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.", { status: 500 });
  }
  return new Response(null, {
    status: 301,
    headers: { Location: authorizeURL(env, url) }
  });
}

async function handleCallback(url, env) {
  if (url.searchParams.get("provider") !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }
  var code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  var response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: redirectUri(url),
      grant_type: "authorization_code"
    })
  });
  var json = await response.json();
  if (!json.access_token) {
    return callbackHtml("error", json.error || "token");
  }
  return callbackHtml("success", json.access_token);
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname === "/auth") return handleAuth(url, env);
    if (url.pathname === "/callback") return handleCallback(url, env);
    return new Response("Hello. This is the Decap CMS OAuth proxy.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
