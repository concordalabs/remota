import { PromptControl, UpdateControl } from "../";

export enum SocketMessages {
  PeerJoin = 20,
  PromptControlRequest,
  ControlUpdate,
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

export type JoinEvent = {
  type: SocketMessages.PeerJoin;
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

  onMessage(cb: (e: MessageEvent) => void): this {
    this.socket.on("message", cb);
    return this;
  }

  onControl(cb: (e: ControlEvent) => void): this {
    this.socket.on("message", cb);
    return this;
  }

  onJoin(cb: (e: JoinEvent) => void): this {
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
      code: this.code,
      payload,
    });
  }

  close(): void {
    this.socket.close();
  }
}
