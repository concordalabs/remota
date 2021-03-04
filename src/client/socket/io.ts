import { io, Socket as IOSocket } from "socket.io-client";
import { SocketClient } from "./";

export default class IO implements SocketClient {
  private socket: IOSocket;

  constructor(private url: string) {
    this.socket = io(this.url, {
      autoConnect: false,
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
    this.socket.io.opts.query = {
      code,
    };
    this.socket.connect();
  }
}
