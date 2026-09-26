import { afterAll, afterEach, beforeAll } from "vitest";
import { resetCohortMocks } from "./handlers";
import { resetFacultyMocks } from "./faculty";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetCohortMocks();
  resetFacultyMocks();
});
afterAll(() => server.close());
