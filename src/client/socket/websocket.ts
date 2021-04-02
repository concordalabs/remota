// @ts-ignore
import ws from "robust-websocket";
import { SocketClient } from "./";

export type RobustWebSocketConfig = {
  url: string;
  code: string;
  clientId: string;
  key: string;
};

export default class RobustWebSocket implements SocketClient {
  public code: string;
  private socket: any;
  private url: URL;

  constructor(config: RobustWebSocketConfig) {
    this.code = `${config.clientId}:${config.code}`;
    this.url = new URL(config.url);
    this.url.searchParams.append("clientId", config.clientId);
    this.url.searchParams.append("key", config.key);
    this.url.searchParams.append("code", this.code);
    this.socket = new ws(this.url.href);
  }

  // eslint-disable-next-line
  send(payload: any): void {
    this.socket.send(JSON.stringify(payload));
  }

  close(): void {
    this.socket.close();
  }

  // eslint-disable-next-line
  on(event: string, cb: Function): void {
    this.socket.addEventListener(event, (e: any) => {
      cb(JSON.parse(e.data));
    });
  }
}
