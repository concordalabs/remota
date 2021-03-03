import { io, Socket } from "socket.io-client";
import { SocketMessages } from "./";
import { PromptJoin, UpdateJoin, PromptControl, UpdateControl } from "../";

export interface SignalEvent {
  type: SocketMessages;
  payload: PromptJoin | UpdateJoin;
}

export interface MessageEvent {
  type: SocketMessages;
  payload: any;
}

export interface ControlEvent {
  type: SocketMessages;
  payload: PromptControl | UpdateControl;
}

export default class SocketIO {
  private socket: Socket;
  private code = "";
  private session = "";

  constructor(private url: string) {
    this.socket = io(this.url, {
      autoConnect: false,
    });
  }

  onConnect(cb: () => void) {
    this.socket.on("connect", cb);
    return this;
  }

  // ----

  signal(type: SocketMessages, payload: PromptJoin | UpdateJoin) {
    this.socket.emit("signal", {
      type: type,
      code: this.code,
      payload,
    });
  }

  onSignal(cb: (e: SignalEvent) => void) {
    this.socket.on("signal", cb);
    return this;
  }

  // ----

  join(payload: UpdateJoin) {
    this.session = payload.code;
    this.socket.emit("join", payload);
  }

  onNewUser(cb: () => void) {
    this.socket.on("join", cb);
  }

  // ----

  onMessage(cb: (e: MessageEvent) => void) {
    this.socket.on("message", cb);
    return this;
  }

  onControl(cb: (e: ControlEvent) => void) {
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
