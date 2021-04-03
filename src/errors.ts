/**
 * Error returned due to issues in the Socket connection
 */
export class SocketError extends Error {
  public data: { description: string };

  constructor(message: string, description: string) {
    super(message);
    this.data = { description };
  }
}
