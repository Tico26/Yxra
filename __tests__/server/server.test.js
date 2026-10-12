const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(() => seed(data));
afterAll(() => db.end());

describe("GET /api/categories", () => {
  test("200: responds with every category", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then(({ body: { allCategories } }) => {
        expect(allCategories.length).toBe(data.categories.length);
      });
  });
});
