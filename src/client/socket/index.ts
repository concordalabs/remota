import { PromptJoin, UpdateJoin, PromptControl, UpdateControl } from "../";

export enum SocketMessages {
  PromptControlRequest = 18,
  ControlUpdate,
  PromptJoinRequest,
  JoinUpdate,
}

export enum PageMessages {
  DOMChanged = 1,
  DOMRequested,
  CursorMoved,
  CursorClicked,
  ScrollChanged,
  TextInputChanged,
  URLChanged,
  PermissionsChanged,
}

export type SignalEvent = {
  type: SocketMessages.PromptJoinRequest;
  payload: PromptJoin;
} & {
  type: SocketMessages.JoinUpdate;
  payload: UpdateJoin;
};

export interface MessageEvent {
  type: SocketMessages;
  payload: any;
}

export type ControlEvent = {
  type: SocketMessages.ControlUpdate;
  payload: UpdateControl;
} & {
  type: SocketMessages.PromptControlRequest;
  payload: PromptControl;
};

export interface SocketClient {
  send(payload: any): void;
  emit(type: string, payload: any): void;
  close(): void;
  connect(code: string): void;
  on(event: string, cb: Function): void;
}

export default class Socket {
  private code = "";
  private session = "";

  constructor(private socket: SocketClient) {}

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
    this.code = code;
    this.socket.connect(code);
  }

  send(type: SocketMessages | PageMessages, payload: any) {
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
