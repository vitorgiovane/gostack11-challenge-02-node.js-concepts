const express = require("express");
const cors = require("cors");

const { uuid, isUuid } = require("uuidv4");

const app = express();

app.use(express.json());
app.use(cors());

const repositories = [];

const validateRepositoryId = (request, response, next) => {
  if (!isUuid(request.params.id)) return response.status(400).json({ error: "Invalid repository id." })
  return next()
}

const validateRepositoryExistence = (request, response, next) => {
  const repositoryIndex = repositories.findIndex(repository => repository.id === request.params.id)
  if (repositoryIndex < 0) return response.status(400).json({ error: "Repository not found." })
  request.repositoryIndex = repositoryIndex
  return next()
}

const isEmpty = obj => {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof (obj) === 'string') return obj.length === 0
  if (typeof (obj) === 'object') return Object.keys(obj).length === 0 && obj.constructor === Object
  return false
}

const validateRequestBody = (request, response, next) => {
  const { title, url, techs } = request.body
  if (isEmpty(title) || isEmpty(url) || isEmpty(techs)) {
    return response.status(400).json({ message: "Invalid request body" })
  }
  next()
}

app.use('/repositories/:id', validateRepositoryId, validateRepositoryExistence)

app.get("/repositories", (request, response) => {
  const { title } = request.query
  if (title) {
    return response.status(200).json(repositories.filter(
      repository => repository.title.toLowerCase().includes(title.toLowerCase())
    ))
  }
  return response.status(200).json(repositories)
});

app.post("/repositories", validateRequestBody, (request, response) => {
  const { title, url, techs } = request.body
  const repository = { id: uuid(), title, url, techs, likes: 0 }

  repositories.push(repository)

  return response.status(201).json(repository)
});

app.get("/repositories/:id", (request, response) => {
  return response.status(200).json(repositories[request.repositoryIndex])
});

app.put("/repositories/:id", (request, response) => {
  const { id } = request.params
  let { title, url, techs } = request.body

  title = title || repositories[request.repositoryIndex].title
  url = url || repositories[request.repositoryIndex].url
  techs = techs || repositories[request.repositoryIndex].techs

  const { likes } = repositories[request.repositoryIndex]
  const repository = { id, title, url, techs, likes }
  repositories[request.repositoryIndex] = repository
  return response.status(200).json(repository)
});

app.delete("/repositories/:id", (request, response) => {
  repositories.splice(request.repositoryIndex, 1)
  return response.status(204).send()
});

app.post("/repositories/:id/like", (request, response) => {
  const { repositoryIndex } = request
  const repository = repositories[repositoryIndex]
  repository.likes++

  repositories[repositoryIndex] = repository

  return response.status(201).json(repository)
});

module.exports = app;
