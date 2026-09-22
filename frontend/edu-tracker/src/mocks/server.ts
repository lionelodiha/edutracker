/**
 * Node-side mock server, for Vitest.
 *
 * Unlike the browser worker this needs no flag — a test that talks to a real
 * API is not a unit test. onUnhandledRequest is "error" here for the same
 * reason: in a test, an unmocked call is a mistake you want to see, not
 * something to quietly let through.
 *
 * Usage in a test file:
 *
 *   import { beforeAll, afterEach, afterAll } from "vitest";
 *   import { server } from "../mocks/server";
 *   import { resetCohortMocks } from "../mocks/handlers";
 *
 *   beforeAll(() => server.listen());
 *   afterEach(() => { server.resetHandlers(); resetCohortMocks(); });
 *   afterAll(() => server.close());
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
