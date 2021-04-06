// @ts-ignore
import ws from "robust-websocket";
import { PromptControl, UpdateControl } from "../manager";

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
  HighlightChanged,
  HighlightReset,
}

export type MessageEvent = {
  type: SocketMessages;
  // eslint-disable-next-line
  payload: any;
};

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

/**
 * Socket client implementation, which allows Remota to communicate
 * with the backend
 */
export interface SocketClient {
  // eslint-disable-next-line
  send(type: SocketMessages | PageMessages, payload: any): void;
  // eslint-disable-next-line
  on(event: string, cb: Function): void;
  close(): void;
  onConnect(cb: () => void): this;
  onConnectError(cb: () => void): this;
  onMessage(cb: (e: MessageEvent) => void): this;
  onControl(cb: (e: ControlEvent) => void): this;
  onJoin(cb: (e: JoinEvent) => void): this;
}

/**
 * Implements SocketClient using robust-web-socket
 */
export class Socket implements SocketClient {
  public code: string;
  private socket: WebSocket;
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
    this.on("open", cb);
    return this;
  }

  onConnectError(cb: () => void): this {
    this.on("close", cb);
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
      const data = e.data ? e.data : null;
      cb(JSON.parse(data));
    });
  }

  // eslint-disable-next-line
  send(type: SocketMessages | PageMessages, payload: any): void {
    try {
      this.socket.send(
        JSON.stringify({
          type: type,
          code: this.code,
          payload,
        })
      );
    } catch (err) {
      // TODO: how to handle this error?
    }
  }

  close(): void {
    this.socket.close();
  }
}
