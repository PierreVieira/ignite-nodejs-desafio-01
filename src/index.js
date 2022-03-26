const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function findUserByName(username) {
  return users.find(user => user.username === username)
}

function getUserIndex(username) {
  return users.findIndex((user) => user.username === username);
}

function getTodoIndex(userIndex, todoIndex) {
  return users[userIndex].todos.findIndex((todo) => todo.id === todoIndex);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = findUserByName(username)
  if (!user) {
    return response.status(404).json({ error: "User not found" })
  }
  request.user = user
  return next()
}
app.post('/users', (request, response) => {
  const { name, username } = request.body
  if (findUserByName(username)) {
    return response.status(400).json({ error: "User already exists" })
  }
  const user = {
    name,
    username,
    id: uuidv4(),
    todos: []
  }
  users.push(user)
  return response.json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { username } = request.user
  const todo = {
    title,
    id: uuidv4(),
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  const index = users.findIndex((user) => user.username === username)
  users[index].todos.push(todo)
  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request.user
  const { title, deadline } = request.body
  const user = findUserByName(username)
  if (!user) {
    return response.status(404).json({ error: "User not found" })
  }
  const { id } = request.params
  const userIndex = users.findIndex((user) => user.username === username)
  const todoIndex = users[userIndex].todos.findIndex((todo) => todo.id === id)
  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" })
  }
  const todo = users[userIndex].todos[todoIndex]
  const todoUpdated = {
    ...todo,
    title,
    deadline
  }
  users[userIndex].todos[todoIndex] = todoUpdated
  return response.json(todoUpdated)
});


app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { username } = request.user
  const user = findUserByName(username)
  if (!user) {
    return response.status(404).json({ error: "User not found" })
  }
  const { id } = request.params
  const userIndex = users.findIndex((user) => user.username === username)
  const todoIndex = users[userIndex].todos.findIndex((todo) => todo.id === id)
  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" })
  }
  const todo = users[userIndex].todos[todoIndex]
  const todoUpdated = {
    ...todo,
    done: true
  }
  users[userIndex].todos[todoIndex] = todoUpdated
  return response.json(todoUpdated)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request.user
  const user = findUserByName(username)
  if (!user) {
    return response.status(404).json({ error: "User not found" })
  }
  const { id } = request.params
  const userIndex = getUserIndex(username)
  const todoIndex = getTodoIndex(userIndex, id)
  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" })
  }
  users[userIndex].todos.splice(todoIndex, 1)
  return response.status(204).json(users[userIndex].todos)
});

module.exports = app;