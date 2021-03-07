import { io, Socket as IOSocket } from "socket.io-client";
import { SocketClient } from "./";

export type IOConfig = {
  url: string;
  clientId: string;
  key: string;
};

export default class IO implements SocketClient {
  private socket: IOSocket;

  constructor(private config: IOConfig) {
    this.socket = io(this.config.url, {
      autoConnect: false,
      query: {
        clientId: this.config.clientId,
        key: this.config.key,
      },
    });
  }

  // eslint-disable-next-line
  send(payload: any): void {
    this.socket.send(payload);
  }

  // eslint-disable-next-line
  emit(type: string, payload: any): void {
    this.socket.emit(type, payload);
  }

  close(): void {
    this.socket.close();
  }

  // eslint-disable-next-line
  on(event: string, cb: Function): void {
    this.socket.on(event, cb);
  }

  connect(code: string): void {
    const query = this.socket.io?.opts?.query ?? {};
    query.code = code;
    this.socket.connect();
  }
}
