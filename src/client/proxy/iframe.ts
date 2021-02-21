import { ProxyMessages } from "./";

export default class IframeProxy {
  private closers: (() => void)[] = [];

  constructor(private target = window.parent) {}

  send(type: ProxyMessages, payload: any, upstream = true) {
    this.target.postMessage(JSON.stringify({ type, payload, upstream }), "*");
  }

  onMessage(cb: any) {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "string") return;
      const data = JSON.parse(e.data);
      cb(data);
    };
    addEventListener("message", handler);
    this.closers.push(() => {
      removeEventListener("message", handler);
    });
  }

  close() {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
