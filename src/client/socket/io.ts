import { io, Socket as IOSocket } from "socket.io-client";
import { SocketClient } from "./";

export default class IO implements SocketClient {
  private socket: IOSocket;

  constructor(private url: string) {
    this.socket = io(this.url, {
      autoConnect: false,
    });
  }

  send(payload: any) {
    this.socket.send(payload);
  }

  emit(type: string, payload: any) {
    this.socket.emit(type, payload);
  }

  close() {
    this.socket.close();
  }

  on(event: string, cb: Function) {
    this.socket.on(event, cb);
  }

  connect(code: string) {
    this.socket.io.opts.query = {
      code,
    };
    this.socket.connect();
  }
}
