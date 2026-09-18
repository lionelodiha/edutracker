import { test, expect } from "@playwright/test";

// The one end-to-end test that runs on every PR: register, create an
// organization, create a semester, sign out. A fresh identity per run
// (Date.now suffix) keeps reruns independent even against a kept database.
const runId = Date.now().toString(36);
const user = {
  firstName: "Smoke",
  lastName: "Test",
  userName: `smoke_${runId}`,
  email: `smoke-${runId}@example.com`,
  password: "Smoke!Pass123",
};
const orgName = `Smoke School ${runId}`;

test("smoke: register, create organization, create semester, sign out", async ({
  page,
}) => {
  // 1. Register a new account.
  await page.goto("/register");
  await page.getByLabel("First Name").fill(user.firstName);
  await page.getByLabel("Last Name").fill(user.lastName);
  await page.getByLabel("Username").fill(user.userName);
  await page.getByLabel("Email Address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm Password").fill(user.password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Account Created!")).toBeVisible();

  // 2. Sign in with it.
  await page.goto("/login");
  await page.getByLabel("Email or Username").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Login Successful!")).toBeVisible();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });

  // 3. Create an organization.
  await page.goto("/dashboard/organizations");
  await page.getByRole("button", { name: "New Organization" }).click();
  await page.getByLabel("Organization Name").fill(orgName);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("heading", { name: orgName })).toBeVisible();

  // 4. Create a semester inside it.
  await page.getByRole("link", { name: new RegExp(orgName) }).click();
  await page.waitForURL(/\/dashboard\/organizations\/[0-9a-f-]+$/);
  const orgId = page.url().split("/").pop();
  await page.goto(`/dashboard/organizations/${orgId}/semesters`);
  await page.getByRole("button", { name: "New Semester" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const year = new Date().getFullYear();
  await expect(page.getByText(`${year} / ${year + 1}`)).toBeVisible();

  // 5. Sign out lands back on the login page.
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL("**/login**", { timeout: 15_000 });
});
