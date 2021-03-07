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
  // eslint-disable-next-line
  payload: any;
}

export type ControlEvent = {
  type: SocketMessages.ControlUpdate;
  payload: UpdateControl;
} & {
  type: SocketMessages.PromptControlRequest;
  payload: PromptControl;
};

export type SocketConnectionError = Error & {
  data: {
    description: string;
  };
};

export interface SocketClient {
  // eslint-disable-next-line
  send(payload: any): void;
  // eslint-disable-next-line
  emit(type: string, payload: any): void;
  close(): void;
  connect(code: string): void;
  // eslint-disable-next-line
  on(event: string, cb: Function): void;
}

export default class Socket {
  private code = "";
  private session = "";

  constructor(private socket: SocketClient) {}

  onConnect(cb: () => void): this {
    this.socket.on("connect", cb);
    return this;
  }

  onConnectError(cb: (err: SocketConnectionError) => void): this {
    this.socket.on("connect_error", cb);
    return this;
  }

  // ----

  signal(type: SocketMessages, payload: PromptJoin | UpdateJoin): void {
    this.socket.emit("signal", {
      type: type,
      code: this.code,
      payload,
    });
  }

  onSignal(cb: (e: SignalEvent) => void): this {
    this.socket.on("signal", cb);
    return this;
  }

  // ----

  join(payload: UpdateJoin): void {
    this.session = payload.code;
    this.socket.emit("join", payload);
  }

  onNewUser(cb: () => void): this {
    this.socket.on("join", cb);
    return this;
  }

  // ----

  onMessage(cb: (e: MessageEvent) => void): this {
    this.socket.on("message", cb);
    return this;
  }

  onControl(cb: (e: ControlEvent) => void): this {
    this.socket.on("message", cb);
    return this;
  }

  connect(code: string): void {
    this.code = code;
    this.socket.connect(code);
  }

  // eslint-disable-next-line
  send(type: SocketMessages | PageMessages, payload: any): void {
    this.socket.send({
      type: type,
      code: this.session,
      payload,
    });
  }

  close(): void {
    this.socket.close();
  }
}
