import { test as base, createBdd } from "playwright-bdd";
import { addCoverageReport } from "monocart-reporter";

const test = base.extend({
  autoTestFixture: [async ({ page }, use) => {
    await Promise.all([
      page.coverage.startJSCoverage({ resetOnNavigation: false }),
      page.coverage.startCSSCoverage({ resetOnNavigation: false }),
    ]);

    await use("autoTestFixture");

    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage(),
    ]);
    const coverageList = [...jsCoverage, ...cssCoverage];
    await addCoverageReport(coverageList, test.info());
  }, {
    scope: "test",
    auto: true,
  }],
});

export { test };
export const expect = base.expect;
export const { Given, When, Then } = createBdd(test);
