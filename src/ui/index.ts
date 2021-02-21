import * as template from "./template";

export default class UI {
  private ui: HTMLElement;
  private style: HTMLElement;
  private registered: boolean;

  constructor() {
    this.registered = false;
    this.ui = document.createElement("div");
    this.ui.innerHTML = template.HTML;
    document.body.appendChild(this.ui);

    this.style = document.createElement("style");
    // @ts-ignore
    this.style.type = "text/css";
    this.style.innerHTML = template.CSS;
    document.getElementsByTagName("head")[0].appendChild(this.style);
  }

  // TODO: change me correctly
  register(controller: any) {
    if (this.registered) return;

    this.onEnd(() => {
      controller.close();
      this.close();
      document.querySelector('iframe[name="root"]')?.remove();
      alert("Your session has been finished");
    });

    this.onRequestControl(() => {
      controller.requestControlChange();
    });

    controller.onConnect(() => {
      const el = document.querySelector("#remote-status-bar-status");
      if (el) el.innerHTML = "Connected";
    });

    controller.onControlUpdate(
      ({ isControlling }: { isControlling: boolean }) => {
        const el = document.querySelector<HTMLElement>(
          "#remote-status-bar-control"
        );
        if (!el) return;

        const iframe = document.querySelector<HTMLIFrameElement>("iframe");
        if (!iframe) return;

        if (isControlling) {
          el.innerHTML = "You have control";
          iframe.style.border = "3px solid #52c41a";
        } else {
          el.innerHTML = "Peer have control";
          iframe.style.border = "3px solid #f5222d";
        }
      }
    );
  }

  onEnd(cb: (e: any) => void) {
    const el = document.querySelector("#remote-status-bar-end");
    if (el) el.addEventListener("click", (e) => cb(e));
    return this;
  }

  onRequestControl(cb: (e: any) => void) {
    const el = document.querySelector("#remote-status-bar-request-control");
    if (el) el.addEventListener("click", (e) => cb(e));
    return this;
  }

  close() {
    this.registered = false;
    this.ui.remove();
    this.style.remove();
  }
}
