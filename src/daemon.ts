import { Page, IframeProxy } from "./server";

window.onload = () => {
  const handler = new IframeProxy();
  const page = new Page(handler);
  page.listen();
  handler.onMessage((e: any) => page.handle(e));
};
