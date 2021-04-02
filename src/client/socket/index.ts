// @ts-ignore
import ws from "robust-websocket";
import { PromptControl, UpdateControl } from "../";

export type Config = {
  url: string;
  code: string;
  clientId: string;
  key: string;
};

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
  send(type: SocketMessages | PageMessages, payload: any): void;
  // eslint-disable-next-line
  // emit(type: string, payload: any): void;
  close(): void;
  // eslint-disable-next-line
  on(event: string, cb: Function): void;

  onConnect(cb: () => void): this;
  onConnectError(cb: (err: SocketConnectionError) => void): this;
  onMessage(cb: (e: MessageEvent) => void): this;
  onControl(cb: (e: ControlEvent) => void): this;
  onJoin(cb: (e: JoinEvent) => void): this;
}

export default class Socket implements SocketClient {
  public code: string;
  private socket: any;
  private url: URL;

  constructor(config: Config) {
    this.code = `${config.clientId}:${config.code}`;
    this.url = new URL(config.url);
    this.url.searchParams.append("clientId", config.clientId);
    this.url.searchParams.append("key", config.key);
    this.url.searchParams.append("code", this.code);
    this.socket = new ws(this.url.href);
  }

  onConnect(cb: () => void): this {
    this.on("connection", cb);
    return this;
  }

  onConnectError(cb: (err: SocketConnectionError) => void): this {
    this.on("error", cb);
    return this;
  }

  // ----

  onMessage(cb: (e: MessageEvent) => void): this {
    this.on("message", cb);
    return this;
  }

  onControl(cb: (e: ControlEvent) => void): this {
    this.on("message", cb);
    return this;
  }

  onJoin(cb: (e: JoinEvent) => void): this {
    this.on("message", cb);
    return this;
  }

  // eslint-disable-next-line
  on(event: string, cb: Function): void {
    this.socket.addEventListener(event, (e: any) => {
      cb(JSON.parse(e.data));
    });
  }

  // eslint-disable-next-line
  send(type: SocketMessages | PageMessages, payload: any): void {
    this.socket.send(
      JSON.stringify({
        type: type,
        code: this.code,
        payload,
      })
    );
  }

  close(): void {
    this.socket.close();
  }
}
