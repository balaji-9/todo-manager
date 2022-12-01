const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path")
app.use(bodyParser.json());

app.set("view engine","ejs")

app.get("/",(request,response) => {
  response.render("index");
})


app.use(express.static(path.join(__dirname,'public')))

app.get("/todos", async (request, response) => {
  const todoItems = await Todo.getTodo();
  response.json(todoItems);
});

app.post("/todos", async (request, response) => {
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.json(todo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("We have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  console.log("Delete a todo by ID:", request.params.id);
  try {
    const deletedTodo = await Todo.deleteTodo(request.params.id);
    return response.send(deletedTodo? true : false);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
