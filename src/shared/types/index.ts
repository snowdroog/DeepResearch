// Shared types between main and renderer processes

export interface User {
  userId: string
  email: string
  name: string
  avatarUrl?: string
  googleId?: string
  createdAt: Date
  lastLoginAt?: Date
}

export interface AISession {
  sessionId: string
  userId: string
  provider: 'claude' | 'openai' | 'gemini' | 'custom'
  sessionName: string
  active: boolean
  lastActivity: Date
  contextTags: string[]
}

export interface CapturedResponse {
  responseId: string
  sessionId: string
  content: string
  timestamp: Date
  provider: string
  tokens: {
    input: number
    output: number
    total: number
  }
  metadata: Record<string, unknown>
}
