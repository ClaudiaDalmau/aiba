import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { describeMatches, matchReviewList, parseReviewList } from "./review-list";

const list = parseReviewList(`
# Alpha
alpha
someone@example.com
example-alpha.com/
+34 600 11 22 33
# Beta agency
Beta agency, +41 76 000 00 00
https://beta.example/
beta.agency.bcn@example.com
`);

describe("manual review list", () => {
  test("parses entry types", () => {
    assert.deepEqual(list.map((e) => e.type), ["name", "email", "domain", "phone", "name", "phone", "domain", "email"]);
  });
  test("matches by email, case-insensitive", () => {
    assert.equal(matchReviewList(list, { email: "SomeOne@Example.com" }).length, 1);
    assert.equal(matchReviewList(list, { email: "beta.agency.bcn@example.com" })[0].label, "Beta agency");
  });
  test("matches phone with or without country code and spacing", () => {
    assert.ok(matchReviewList(list, { phone: "600112233" }).length);
    assert.ok(matchReviewList(list, { phone: "0041 76 000 00 00" }).length);
    assert.equal(matchReviewList(list, { phone: "+34 600 11 22 34" }).length, 0);
  });
  test("matches website, links and text mentions", () => {
    assert.ok(matchReviewList(list, { website: "https://www.example-alpha.com/x" }).length);
    assert.ok(matchReviewList(list, { links: ["http://beta.example/profile"] }).length);
    assert.ok(matchReviewList(list, { message: "see beta.example for my work" }).length);
  });
  test("names match whole words only", () => {
    assert.ok(matchReviewList(list, { name: "Álpha López" }).length);
    assert.ok(matchReviewList(list, { businessName: "BETA AGENCY Zurich" }).length);
    assert.equal(matchReviewList(list, { name: "Alphabet" }).length, 0);
    assert.equal(matchReviewList(list, { name: "Beta" }).length, 0);
  });
  test("no false positives for an unrelated applicant", () => {
    assert.deepEqual(matchReviewList(list, { email: "ana@mail.com", name: "Ana", phone: "+34 611 000 000", website: "ana.es" }), []);
  });
  test("summary groups by label", () => {
    assert.match(describeMatches(matchReviewList(list, { email: "someone@example.com", phone: "+34600112233" })), /^Alpha: email .*, phone /);
  });
});
