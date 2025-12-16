import { Injectable, Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "token",
  cors: {
    origin: "*",
  },
})
@Injectable()
export class TokenGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TokenGateway.name);
  private userSocketMap: Map<number, string[]> = new Map(); // Map of userId to socketIds

  @WebSocketServer() io: Namespace;

  afterInit(): void {
    this.logger.log("WebSocket Gateway Initialized for Token Display");
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client Connected: ${client.id}`);
    // Store userId if it's in handshake auth or query params
    if (client.handshake.query.userId) {
      const userId = Number(client.handshake.query.userId);
      if (!isNaN(userId)) {
        this.addUserSocket(userId, client.id);
        this.logger.log(
          `User ${userId} connected via query param with socket ${client.id}`
        );
      }
    }
    this.logger.log(`Total Connected Clients: ${this.io.sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
    // Remove the socket from any user mappings
    this.removeSocketFromUsers(client.id);
    this.logger.log(`Remaining Clients: ${this.io.sockets.size}`);
  }

  // Method to handle user authentication and room joining
  @SubscribeMessage("authenticateUser")
  handleUserAuthentication(client: Socket, userId: number): void {
    // Validate userId is a number
    if (typeof userId !== "number" || isNaN(userId)) {
      this.logger.error(`Invalid userId received: ${userId}`);
      return;
    }

    this.addUserSocket(userId, client.id);
    this.logger.log(`User ${userId} authenticated with socket ${client.id}`);

    // Confirm authentication to client
    client.emit("authConfirmed", { userId });
  }

  // Add a socket ID to a user's list of connected sockets
  private addUserSocket(userId: number, socketId: string): void {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, []);
    }

    // Only add if not already present
    const sockets = this.userSocketMap.get(userId);
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
      this.logger.log(`Socket ${socketId} added for user ${userId}`);
      this.logger.log(
        `User ${userId} now has ${sockets.length} active connections`
      );
    }
  }

  // Remove a socket from all user mappings
  private removeSocketFromUsers(socketId: string): void {
    for (const [userId, sockets] of this.userSocketMap.entries()) {
      const index = sockets.indexOf(socketId);
      if (index !== -1) {
        sockets.splice(index, 1);
        this.logger.log(`Removed socket ${socketId} from user ${userId}`);

        // Remove user entry if no more sockets
        if (sockets.length === 0) {
          this.userSocketMap.delete(userId);
          this.logger.log(`User ${userId} has no more active connections`);
        } else {
          this.logger.log(
            `User ${userId} still has ${sockets.length} active connections`
          );
        }
      }
    }
  }

  // Debug method to view current connections
  @SubscribeMessage("debugConnections")
  handleDebugConnections(): any {
    const connections = {};
    for (const [userId, sockets] of this.userSocketMap.entries()) {
      connections[userId] = sockets.length;
    }
    this.logger.log(`Current connections: ${JSON.stringify(connections)}`);
    return { connections };
  }

  // Broadcast to a specific user via all their connected sockets
  broadcastToUser(userId: number, data: any): void {
    if (!this.io) {
      this.logger.error("WebSocket server is not initialized.");
      return;
    }

    // Validate userId
    if (typeof userId !== "number" || isNaN(userId)) {
      this.logger.error(`Invalid userId provided for broadcast: ${userId}`);
      return;
    }

    this.logger.log(`Attempting to broadcast to user ${userId}`);
    const socketIds = this.userSocketMap.get(userId);

    if (!socketIds || socketIds.length === 0) {
      this.logger.log(`No active connections for user ${userId}`);
      return;
    }

    this.logger.log(
      `Broadcasting to user ${userId} via ${socketIds.length} socket(s)`
    );
    let successfulEmits = 0;

    socketIds.forEach((socketId) => {
      const socket = this.io.sockets.get(socketId);
      if (socket) {
        socket.emit("data", {
          ...data,
          userId, // Including userId in the emitted data
        });
        successfulEmits++;
      } else {
        this.logger.warn(`Socket ${socketId} not found for user ${userId}`);
        // Clean up the stale socket ID
        const userSockets = this.userSocketMap.get(userId);
        const index = userSockets.indexOf(socketId);
        if (index !== -1) {
          userSockets.splice(index, 1);
          this.logger.log(
            `Removed stale socket ${socketId} from user ${userId}`
          );
        }
      }
    });

    this.logger.log(
      `Successfully sent to ${successfulEmits} sockets for user ${userId}`
    );
  }

  // DEPRECATED - Do not use this method as it broadcasts to all users
  broadcastToken(data: any) {
    this.logger.warn(
      `DEPRECATED: broadcastToken called - this broadcasts to ALL users`
    );
    this.logger.warn(
      `Please use broadcastToUser instead for user-specific messages`
    );

    if (this.io) {
      this.io.emit("data", data);
    } else {
      this.logger.error("WebSocket server is not initialized.");
    }
  }
}
