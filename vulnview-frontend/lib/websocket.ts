import { toast } from "@/hooks/use-toast"

interface WebSocketMessage {
  type: "notification"
  data: {
    id: number
    message: string
    severity: string
    createdAt: string
    projectId?: number
    componentId?: number
    vulnerabilityId?: number
  }
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000 // Start with 1 second
  private maxReconnectTimeout = 30000 // Max 30 seconds
  private token: string | null = null

  constructor() {
    // Initialize WebSocket when token is available
    this.initialize = this.initialize.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  initialize(token: string) {
    this.token = token
    this.connect()
  }

  private connect() {
    if (!this.token) return

    // PHASE 9: Notification WebSocket is disabled for now.
    // const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"}/ws/notifications?token=${this.token}`
    // this.ws = new WebSocket(wsUrl)

    if (this.ws) {
      this.ws.onmessage = this.handleMessage
      this.ws.onclose = this.handleClose
      this.ws.onerror = this.handleError
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      if (message.type === "notification") {
        // Show toast notification
        toast({
          title: "New Vulnerability Alert",
          description: message.data.message,
          variant: message.data.severity === "HIGH" || message.data.severity === "CRITICAL" ? "destructive" : "default",
        })

        // Dispatch custom event for components to handle
        const notificationEvent = new CustomEvent("newNotification", {
          detail: message.data,
        })
        window.dispatchEvent(notificationEvent)
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error)
    }
  }

  private handleClose() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const timeout = Math.min(this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectTimeout)
      setTimeout(() => this.connect(), timeout)
    } else {
      console.error("Max WebSocket reconnection attempts reached")
    }
  }

  private handleError(error: Event) {
    console.error("WebSocket error:", error)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
  }
}

// Create a singleton instance
export const wsClient = new WebSocketClient() 