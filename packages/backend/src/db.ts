import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '@todo-app/shared'

// Configure client based on environment
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // For local development with DynamoDB Local
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local'
    }
  })
})

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
})

const TABLE_NAME = process.env.TODOS_TABLE || 'todos'

export async function getAllTodos(userId: string): Promise<Todo[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
  )

  const todos = (result.Items || []) as Todo[]
  return todos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getTodoById(userId: string, id: string): Promise<Todo | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, id }
    })
  )

  return (result.Item as Todo) || null
}

export async function createTodo(userId: string, request: CreateTodoRequest): Promise<Todo> {
  const now = new Date().toISOString()
  const todo: Todo = {
    id: uuid(),
    userId,
    title: request.title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: todo
    })
  )

  return todo
}

export async function updateTodo(
  userId: string,
  id: string,
  updates: UpdateTodoRequest
): Promise<Todo | null> {
  // Build update expression dynamically
  const updateParts: string[] = ['#updatedAt = :updatedAt']
  const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' }
  const expressionValues: Record<string, unknown> = {
    ':updatedAt': new Date().toISOString()
  }

  if (updates.title !== undefined) {
    updateParts.push('#title = :title')
    expressionNames['#title'] = 'title'
    expressionValues[':title'] = updates.title.trim()
  }

  if (updates.completed !== undefined) {
    updateParts.push('#completed = :completed')
    expressionNames['#completed'] = 'completed'
    expressionValues[':completed'] = updates.completed
  }

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, id },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(userId) AND attribute_exists(id)'
      })
    )
    return (result.Attributes as Todo) || null
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === 'ConditionalCheckFailedException'
    ) {
      return null
    }
    throw error
  }
}

export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, id },
        ConditionExpression: 'attribute_exists(userId) AND attribute_exists(id)'
      })
    )
    return true
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === 'ConditionalCheckFailedException'
    ) {
      return false
    }
    throw error
  }
}
