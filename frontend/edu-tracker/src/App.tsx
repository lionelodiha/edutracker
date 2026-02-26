import { useEffect, useMemo, useState } from "react";
import {
  cancelOrganizationSubscriptionEndpointHandler,
  createOrganizationSubscriptionEndpointHandler,
  createOrganizationEndpointHandler,
  demoteUserEndpointHandler,
  getCurrentUserEndpointHandler,
  getCurrentUserSessionsEndpointHandler,
  getOrganizationByIdEndpointHandler,
  getOrganizationMembersEndpointHandler,
  getOrganizationSubscriptionEndpointHandler,
  getOrganizationsEndpointHandler,
  getUserByIdEndpointHandler,
  getUsersEndpointHandler,
  inviteOrganizationMemberEndpointHandler,
  lockUserEndpointHandler,
  loginUserEndpointHandler,
  logoutUserEndpointHandler,
  promoteUserEndpointHandler,
  refreshSessionEndpointHandler,
  registerUserEndpointHandler,
  revokeCurrentUserSessionEndpointHandler,
  revokeAllCurrentUserSessionsEndpointHandler,
  unlockUserEndpointHandler,
  updateCurrentUserEndpointHandler,
  updateCurrentUserPasswordEndpointHandler,
  updateOrganizationMemberRoleEndpointHandler,
  updateOrganizationSubscriptionEndpointHandler,
} from "./api";
import { client } from "./api/client.gen";

type Side = "auth" | "session" | "user" | "org";

type OperationConfig = {
  id: string;
  label: string;
  side: Side;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  route: string;
  needsPath?: boolean;
  needsQuery?: boolean;
  bodyTemplate?: string;
  queryTemplate?: string;
  pathTemplate?: string;
  run: (args: {
    body: unknown;
    query: Record<string, unknown> | undefined;
    path: Record<string, unknown> | undefined;
  }) => Promise<any>;
};

const operationConfigs: OperationConfig[] = [
  {
    id: "register",
    label: "Register User",
    side: "auth",
    method: "POST",
    route: "/api/auth/register",
    bodyTemplate: JSON.stringify(
      {
        userName: "demo_user",
        email: "demo@example.com",
        password: "DemoPassword#123",
        firstName: "Demo",
        middleName: null,
        lastName: "User",
      },
      null,
      2,
    ),
    run: ({ body }) => registerUserEndpointHandler({ body: body as never }),
  },
  {
    id: "login",
    label: "Login",
    side: "auth",
    method: "POST",
    route: "/api/auth/login",
    bodyTemplate: JSON.stringify(
      {
        identifier: "demo@example.com",
        password: "DemoPassword#123",
        rememberMe: true,
      },
      null,
      2,
    ),
    run: ({ body }) => loginUserEndpointHandler({ body: body as never }),
  },
  {
    id: "refresh",
    label: "Refresh Session",
    side: "auth",
    method: "POST",
    route: "/api/auth/refresh",
    run: () => refreshSessionEndpointHandler(),
  },
  {
    id: "logout",
    label: "Logout",
    side: "auth",
    method: "POST",
    route: "/api/auth/logout",
    run: () => logoutUserEndpointHandler(),
  },
  {
    id: "get_sessions",
    label: "Get My Sessions",
    side: "session",
    method: "GET",
    route: "/api/sessions/me",
    run: () => getCurrentUserSessionsEndpointHandler(),
  },
  {
    id: "revoke_all_sessions",
    label: "Revoke All Sessions",
    side: "session",
    method: "POST",
    route: "/api/sessions/revoke-all",
    needsQuery: true,
    queryTemplate: JSON.stringify({ keepCurrentUserSession: true }, null, 2),
    run: ({ query }) => revokeAllCurrentUserSessionsEndpointHandler({ query }),
  },
  {
    id: "revoke_session",
    label: "Revoke Session By Id",
    side: "session",
    method: "POST",
    route: "/api/sessions/{id}/revoke",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => revokeCurrentUserSessionEndpointHandler({ path: path as never }),
  },
  {
    id: "me",
    label: "Get Current User",
    side: "user",
    method: "GET",
    route: "/api/users/me",
    run: () => getCurrentUserEndpointHandler(),
  },
  {
    id: "users",
    label: "Get Users",
    side: "user",
    method: "GET",
    route: "/api/users",
    needsQuery: true,
    queryTemplate: JSON.stringify({ limit: 20 }, null, 2),
    run: ({ query }) => getUsersEndpointHandler({ query }),
  },
  {
    id: "update_me",
    label: "Update Current User",
    side: "user",
    method: "PATCH",
    route: "/api/users/me",
    bodyTemplate: JSON.stringify(
      {
        userName: "demo_user",
        firstName: "Demo",
        middleName: null,
        lastName: "User Updated",
        email: "demo.updated@example.com",
      },
      null,
      2,
    ),
    run: ({ body }) => updateCurrentUserEndpointHandler({ body: body as never }),
  },
  {
    id: "get_user_by_id",
    label: "Get User By Id",
    side: "user",
    method: "GET",
    route: "/api/users/{id}",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => getUserByIdEndpointHandler({ path: path as never }),
  },
  {
    id: "update_password",
    label: "Update Current User Password",
    side: "user",
    method: "PATCH",
    route: "/api/users/me/password",
    bodyTemplate: JSON.stringify(
      {
        currentPassword: "DemoPassword#123",
        newPassword: "DemoPassword#1234",
        logoutAll: false,
      },
      null,
      2,
    ),
    run: ({ body }) =>
      updateCurrentUserPasswordEndpointHandler({ body: body as never }),
  },
  {
    id: "promote_user",
    label: "Promote User",
    side: "user",
    method: "POST",
    route: "/api/users/{id}/promote",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => promoteUserEndpointHandler({ path: path as never }),
  },
  {
    id: "demote_user",
    label: "Demote User",
    side: "user",
    method: "POST",
    route: "/api/users/{id}/demote",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => demoteUserEndpointHandler({ path: path as never }),
  },
  {
    id: "lock_user",
    label: "Lock User",
    side: "user",
    method: "POST",
    route: "/api/users/{id}/lock",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => lockUserEndpointHandler({ path: path as never }),
  },
  {
    id: "unlock_user",
    label: "Unlock User",
    side: "user",
    method: "POST",
    route: "/api/users/{id}/unlock",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => unlockUserEndpointHandler({ path: path as never }),
  },
  {
    id: "orgs",
    label: "List Organizations",
    side: "org",
    method: "GET",
    route: "/api/organizations",
    run: () => getOrganizationsEndpointHandler(),
  },
  {
    id: "create_org",
    label: "Create Organization",
    side: "org",
    method: "POST",
    route: "/api/organizations",
    bodyTemplate: JSON.stringify({ name: "Acme Academy" }, null, 2),
    run: ({ body }) => createOrganizationEndpointHandler({ body: body as never }),
  },
  {
    id: "get_org_by_id",
    label: "Get Organization By Id",
    side: "org",
    method: "GET",
    route: "/api/organizations/{id}",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => getOrganizationByIdEndpointHandler({ path: path as never }),
  },
  {
    id: "invite_org_member",
    label: "Invite Organization Member",
    side: "org",
    method: "POST",
    route: "/api/organizations/{id}/invite",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    bodyTemplate: JSON.stringify(
      {
        email: "member@example.com",
        role: "Member",
      },
      null,
      2,
    ),
    run: ({ body, path }) =>
      inviteOrganizationMemberEndpointHandler({ body: body as never, path: path as never }),
  },
  {
    id: "update_org_member_role",
    label: "Update Organization Member Role",
    side: "org",
    method: "PATCH",
    route: "/api/organizations/{id}/members/{memberId}/role",
    needsPath: true,
    pathTemplate: JSON.stringify(
      {
        id: "00000000-0000-0000-0000-000000000000",
        memberId: "00000000-0000-0000-0000-000000000000",
      },
      null,
      2,
    ),
    bodyTemplate: JSON.stringify({ role: "Admin" }, null, 2),
    run: ({ body, path }) =>
      updateOrganizationMemberRoleEndpointHandler({
        body: body as never,
        path: path as never,
      }),
  },
  {
    id: "get_org_members",
    label: "Get Organization Members",
    side: "org",
    method: "GET",
    route: "/api/organizations/{id}/members",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) => getOrganizationMembersEndpointHandler({ path: path as never }),
  },
  {
    id: "get_org_subscription",
    label: "Get Org Subscription",
    side: "org",
    method: "GET",
    route: "/api/organizations/{id}/subscription",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) =>
      getOrganizationSubscriptionEndpointHandler({ path: path as never }),
  },
  {
    id: "update_org_subscription",
    label: "Update Org Subscription",
    side: "org",
    method: "PATCH",
    route: "/api/organizations/{id}/subscription",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    bodyTemplate: JSON.stringify(
      {
        planName: "Pro",
        seats: 25,
      },
      null,
      2,
    ),
    run: ({ body, path }) =>
      updateOrganizationSubscriptionEndpointHandler({
        body: body as never,
        path: path as never,
      }),
  },
  {
    id: "create_org_subscription",
    label: "Create Org Subscription",
    side: "org",
    method: "POST",
    route: "/api/organizations/{id}/subscription",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    bodyTemplate: JSON.stringify(
      {
        planName: "Starter",
        seats: 10,
      },
      null,
      2,
    ),
    run: ({ body, path }) =>
      createOrganizationSubscriptionEndpointHandler({
        body: body as never,
        path: path as never,
      }),
  },
  {
    id: "cancel_org_sub",
    label: "Cancel Org Subscription",
    side: "org",
    method: "POST",
    route: "/api/organizations/{id}/subscription/cancel",
    needsPath: true,
    pathTemplate: JSON.stringify(
      { id: "00000000-0000-0000-0000-000000000000" },
      null,
      2,
    ),
    run: ({ path }) =>
      cancelOrganizationSubscriptionEndpointHandler({ path: path as never }),
  },
];

const sideOrder: Side[] = ["auth", "session", "user", "org"];
const sideLabel: Record<Side, string> = {
  auth: "Auth",
  session: "Session",
  user: "User",
  org: "Org",
};

const prettyJson = (value: unknown) => {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseJsonText = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return JSON.parse(trimmed);
};

const methodToneClass = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-[#3f9c52]";
    case "POST":
      return "text-[#4a84c7]";
    case "PATCH":
      return "text-[#b6872e]";
    case "PUT":
      return "text-[#9a5fcf]";
    case "DELETE":
      return "text-[#c55353]";
    case "OPTIONS":
      return "text-[#2b9f97]";
    case "HEAD":
      return "text-[#a2894b]";
    default:
      return "text-[var(--text)]";
  }
};

const statusToneClass = (status: string) => {
  if (status === "thrown") {
    return "text-[#c55353]";
  }
  const numeric = Number(status);
  if (Number.isNaN(numeric)) {
    return "text-[var(--text)]";
  }
  if (numeric >= 200 && numeric < 300) {
    return "text-[#3f9c52]";
  }
  if (numeric >= 400) {
    return "text-[#c55353]";
  }
  return "text-[#b6872e]";
};

const okToneClass = (ok: string) => {
  if (ok === "true") {
    return "text-[#3f9c52]";
  }
  if (ok === "false") {
    return "text-[#c55353]";
  }
  return "text-[var(--text)]";
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3187");
  const [selectedOperationId, setSelectedOperationId] = useState(
    operationConfigs[0].id,
  );
  const [bodyInput, setBodyInput] = useState(operationConfigs[0].bodyTemplate ?? "");
  const [queryInput, setQueryInput] = useState(
    operationConfigs[0].queryTemplate ?? "",
  );
  const [pathInput, setPathInput] = useState(operationConfigs[0].pathTemplate ?? "");
  const [responseText, setResponseText] = useState(
    "No request yet. Configure request and run.",
  );
  const [responseMeta, setResponseMeta] = useState({
    status: "-",
    ok: "-",
    requestUrl: "-",
  });
  const [activeMobilePanel, setActiveMobilePanel] = useState<"playground" | "response">(
    "playground",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const selectedOperation = useMemo(
    () => operationConfigs.find((item) => item.id === selectedOperationId) ?? operationConfigs[0],
    [selectedOperationId],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setBodyInput(selectedOperation.bodyTemplate ?? "");
    setQueryInput(selectedOperation.queryTemplate ?? "");
    setPathInput(selectedOperation.pathTemplate ?? "");
    setInputError(null);
  }, [selectedOperation]);

  const operationsBySide = useMemo(() => {
    const map: Record<Side, OperationConfig[]> = {
      auth: [],
      session: [],
      user: [],
      org: [],
    };
    for (const operation of operationConfigs) {
      map[operation.side].push(operation);
    }
    return map;
  }, []);

  const runSelectedOperation = async () => {
    setInputError(null);

    let body: unknown;
    let query: Record<string, unknown> | undefined;
    let path: Record<string, unknown> | undefined;

    try {
      body = parseJsonText(bodyInput);
      query = parseJsonText(queryInput) as Record<string, unknown> | undefined;
      path = parseJsonText(pathInput) as Record<string, unknown> | undefined;
    } catch (error) {
      setInputError(`Invalid JSON input: ${(error as Error).message}`);
      return;
    }

    try {
      setIsRunning(true);
      client.setConfig({ baseUrl });
      const result = await selectedOperation.run({ body, query, path });
      const maybeResponse = result?.response;
      const maybeRequest = result?.request;
      const payload =
        result && typeof result === "object" && "error" in result && result.error
          ? { error: result.error, data: result.data }
          : result?.data ?? result;

      setResponseMeta({
        status: maybeResponse?.status ? String(maybeResponse.status) : "-",
        ok:
          maybeResponse && typeof maybeResponse.ok === "boolean"
            ? String(maybeResponse.ok)
            : "-",
        requestUrl: maybeRequest?.url ?? `${baseUrl}${selectedOperation.route}`,
      });
      setResponseText(prettyJson(payload));
      setActiveMobilePanel("response");
    } catch (error) {
      setResponseMeta({
        status: "thrown",
        ok: "false",
        requestUrl: `${baseUrl}${selectedOperation.route}`,
      });
      setResponseText(prettyJson(error));
      setActiveMobilePanel("response");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-360">
        <header className="mb-4 flex flex-col gap-3 border border-(--line) bg-(--panel) p-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-wide">API Client Playground</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-block"
              onClick={() => setTheme((curr) => (curr === "dark" ? "light" : "dark"))}
            >
              Theme: {theme}
            </button>
          </div>
        </header>

        <div className="mb-3 flex border border-(--line) bg-(--panel) p-1 md:hidden">
          <button
            className={`btn-block flex-1 ${activeMobilePanel === "playground" ? "is-active" : ""}`}
            onClick={() => setActiveMobilePanel("playground")}
          >
            Playground
          </button>
          <button
            className={`btn-block flex-1 ${activeMobilePanel === "response" ? "is-active" : ""}`}
            onClick={() => setActiveMobilePanel("response")}
          >
            Response
          </button>
        </div>

        <main className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-2">
          <section
            className={`panel ${activeMobilePanel === "response" ? "hidden md:block" : ""}`}
          >
            <div className="panel-head">Playground</div>
            <div className="panel-body space-y-4">
              <label className="field">
                <span className="field-label">Base URL</span>
                <input
                  className="input-block"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3187"
                />
              </label>

              <div className="field">
                <span className="field-label">API Side</span>
                <div className="flex flex-wrap gap-2">
                  {sideOrder.map((side) => (
                    <button
                      key={side}
                      type="button"
                      className={`btn-block ${selectedOperation.side === side ? "is-active" : ""}`}
                      onClick={() => {
                        const firstOp = operationsBySide[side][0];
                        if (firstOp) {
                          setSelectedOperationId(firstOp.id);
                        }
                      }}
                    >
                      {sideLabel[side]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span className="field-label">Operation</span>
                <select
                  className="input-block"
                  value={selectedOperation.id}
                  onChange={(e) => setSelectedOperationId(e.target.value)}
                >
                  {operationConfigs.map((operation) => (
                    <option key={operation.id} value={operation.id}>
                      [{operation.side}] {operation.method} {operation.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-3 text-xs text-(--muted) sm:grid-cols-3">
                <div>
                  <div>Method</div>
                  <div
                    className={`text-sm font-bold tracking-wide ${methodToneClass(selectedOperation.method)}`}
                  >
                    {selectedOperation.method}
                  </div>
                </div>
                <div>
                  <div>Route</div>
                  <div className="break-all text-sm text-(--text)">{selectedOperation.route}</div>
                </div>
                <div>
                  <div>Testing Side</div>
                  <div className="text-sm text-(--text)">
                    {sideLabel[selectedOperation.side]}
                  </div>
                </div>
              </div>

              {selectedOperation.needsPath ? (
                <label className="field">
                  <span className="field-label">Path Params (JSON)</span>
                  <textarea
                    className="input-block min-h-24"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                  />
                </label>
              ) : null}

              {selectedOperation.needsQuery ? (
                <label className="field">
                  <span className="field-label">Query (JSON)</span>
                  <textarea
                    className="input-block min-h-24"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                  />
                </label>
              ) : null}

              {selectedOperation.bodyTemplate !== undefined ? (
                <label className="field">
                  <span className="field-label">Body (JSON)</span>
                  <textarea
                    className="input-block min-h-45"
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                  />
                </label>
              ) : null}

              {inputError ? <p className="text-sm text-(--warn)">{inputError}</p> : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-block is-active"
                  onClick={runSelectedOperation}
                  disabled={isRunning}
                >
                  {isRunning ? "Running..." : "Run Request"}
                </button>
              </div>
            </div>
          </section>

          <section
            className={`panel ${activeMobilePanel === "playground" ? "hidden md:block" : ""}`}
          >
            <div className="panel-head">Raw Response</div>
            <div className="panel-body h-full">
              <div className="mb-3 grid grid-cols-1 gap-2 border border-(--line) p-2 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-(--muted)">Status</div>
                  <div className={`text-sm font-bold ${statusToneClass(responseMeta.status)}`}>
                    {responseMeta.status}
                  </div>
                </div>
                <div>
                  <div className="text-(--muted)">OK</div>
                  <div className={`text-sm font-bold ${okToneClass(responseMeta.ok)}`}>
                    {responseMeta.ok.toUpperCase()}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-(--muted)">URL</div>
                  <div className="break-all">{responseMeta.requestUrl}</div>
                </div>
              </div>

              <pre className="response-terminal h-[55vh] overflow-auto text-xs md:h-[67vh]">
{responseText}
              </pre>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
