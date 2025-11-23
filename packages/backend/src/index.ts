import express from 'express'
import cors from 'cors'
import type { CreateTodoRequest, UpdateTodoRequest } from '@todo-app/shared'
import * as db from './db.js'
import { authMiddleware } from './auth.js'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Protected routes - require authentication
app.use('/api/todos', authMiddleware)

// Routes
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await db.getAllTodos(req.userId!)
    res.json(todos)
  } catch (error) {
    console.error('Failed to fetch todos:', error)
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch todos' })
  }
})

app.get('/api/todos/:id', async (req, res) => {
  try {
    const todo = await db.getTodoById(req.userId!, req.params.id)
    if (!todo) {
      return res.status(404).json({ error: 'Not found', message: 'Todo not found' })
    }
    res.json(todo)
  } catch (error) {
    console.error('Failed to fetch todo:', error)
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch todo' })
  }
})

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body as CreateTodoRequest

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Validation', message: 'Title is required' })
    }

    const todo = await db.createTodo(req.userId!, { title })
    res.status(201).json(todo)
  } catch (error) {
    console.error('Failed to create todo:', error)
    res.status(500).json({ error: 'Internal', message: 'Failed to create todo' })
  }
})

app.patch('/api/todos/:id', async (req, res) => {
  try {
    const updates = req.body as UpdateTodoRequest
    const updated = await db.updateTodo(req.userId!, req.params.id, updates)

    if (!updated) {
      return res.status(404).json({ error: 'Not found', message: 'Todo not found' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Failed to update todo:', error)
    res.status(500).json({ error: 'Internal', message: 'Failed to update todo' })
  }
})

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const deleted = await db.deleteTodo(req.userId!, req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Not found', message: 'Todo not found' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete todo:', error)
    res.status(500).json({ error: 'Internal', message: 'Failed to delete todo' })
  }
})

// Start server (only when not imported as module for Lambda)
if (process.env.NODE_ENV !== 'lambda') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export { app }
