import { useState, useEffect, useCallback } from 'react'
import type { Todo, CreateTodoRequest } from '@todo-app/shared'
import { AuthProvider, useAuth, AuthForms } from './auth'

const API_URL = '/api'

function TodoApp() {
  const { user, logout, getAccessToken } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getAccessToken()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
  }, [getAccessToken])

  const fetchTodos = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/todos`)
      if (!res.ok) throw new Error('Failed to fetch todos')
      const data = await res.json()
      setTodos(data)
      setError(null)
    } catch (err) {
      setError('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!newTodo.trim()) return

    const request: CreateTodoRequest = { title: newTodo.trim() }

    try {
      const res = await authFetch(`${API_URL}/todos`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!res.ok) throw new Error('Failed to create todo')
      const todo = await res.json()
      setTodos([todo, ...todos])
      setNewTodo('')
    } catch (err) {
      setError('Failed to add todo')
    }
  }

  async function toggleTodo(id: string) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
      const res = await authFetch(`${API_URL}/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed })
      })
      if (!res.ok) throw new Error('Failed to update todo')
      const updated = await res.json()
      setTodos(todos.map(t => t.id === id ? updated : t))
    } catch (err) {
      setError('Failed to update todo')
    }
  }

  async function deleteTodo(id: string) {
    try {
      const res = await authFetch(`${API_URL}/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete todo')
      setTodos(todos.filter(t => t.id !== id))
    } catch (err) {
      setError('Failed to delete todo')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo App</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <form className="todo-input" onSubmit={addTodo}>
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <ul className="todo-list">
          {todos.length === 0 ? (
            <li className="empty-state">No todos yet. Add one above!</li>
          ) : (
            todos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)}>Delete</button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="app"><p className="loading">Loading...</p></div>
  }

  return isAuthenticated ? <TodoApp /> : <AuthForms />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
