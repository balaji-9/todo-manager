const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const { sequelize } = require("../models");

let server, agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("responds with json at /todos", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    expect(response.statusCode).toBe(200);
    expect(response.header["content-type"]).toBe(
      "application/json; charset=utf-8"
    );
    const parseResponse = JSON.parse(response.text);
    expect(parseResponse.id).toBeDefined();
  });
  test("Marks a todo with the given ID as complete", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    expect(parsedResponse.completed).toBe(false);

    const markCompleteResponse = await agent
      .put(`/todos/${todoID}/markASCompleted`)
      .send();
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });

    test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
      const response = await agent.post("/todos").send({
        title: "Prepare Poster",
        dueDate: new Date().toISOString(),
        completed: false,
      });
      const parsedResponse = JSON.parse(response.text);
      const todoID = parsedResponse.id;
      expect(parsedResponse.title).toBe("Prepare Poster");

    const successfulDeleteResponse = await agent
      .delete(`/todos/${todoID}`)
      .send();
    const parsedSuccessfulDeleteResponse = JSON.parse(successfulDeleteResponse.text);
    expect(parsedSuccessfulDeleteResponse).toBe(1);
    const UnsuccessfulDeleteResponse = await agent
    .delete(`/todos/${0}`)
    .send();
    const parsedUnsuccessfulDeleteResponse = JSON.parse(UnsuccessfulDeleteResponse.text);
    expect(parsedUnsuccessfulDeleteResponse).toBe(0);

      
    });
});