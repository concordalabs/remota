import { io } from "socket.io-client";
import { SocketMessages } from "./";

export const ConnectionState = {
  NONE: "NONE",
  STARTING: "STARTING",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
};

export default class SocketIO {
  private socket: any;

  constructor(private url: string, private code = "", private session = "") {
    this.socket = io(this.url, {
      query: {
        code,
      },
    });
    this.code = code;
    this.session = session;
  }

  onConnect(cb: (e: any) => void) {
    this.socket.on("connect", cb);
    return this;
  }

  // ----

  signal(type: string | number, payload: any) {
    this.socket.emit("signal", {
      type: type,
      code: this.code,
      payload,
    });
  }

  onSignal(cb: (e: any) => void) {
    this.socket.on("signal", cb);
    return this;
  }

  // ----

  join(payload: any) {
    this.session = payload.code;
    this.socket.emit("join", payload);
  }

  onNewUser(cb: (e: any) => void) {
    this.socket.on("join", cb);
  }

  // ----

  onMessage(cb: (e: any) => void) {
    this.socket.on("message", cb);
    return this;
  }

  send(type: SocketMessages, payload: any) {
    this.socket.send({
      type: type,
      code: this.session,
      payload,
    });
  }

  close() {
    this.socket.close();
  }
}
