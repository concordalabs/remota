import { io } from "socket.io-client";
import { SocketMessages } from "./";

export default class SocketIO {
  private socket: any;
  private code = "";
  private session = "";

  constructor(private url: string) {
    this.socket = io(this.url, {
      autoConnect: false,
    });
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

  connect(code: string) {
    this.socket.io.opts.query = {
      code,
    };
    this.code = code;
    this.socket.connect();
  }

  send(type: SocketMessages | string, payload: any) {
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
