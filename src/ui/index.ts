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
        const statusBar = document.querySelector<HTMLElement>(
          "#remote-status-bar-control"
        );
        if (!statusBar) return;

        const overlay = document.querySelector<HTMLIFrameElement>(
          "#remote-status-overlay"
        );
        if (!overlay) return;

        if (isControlling) {
          statusBar.innerHTML = "You have control";
          overlay.style.border = "4px solid #52c41a";
        } else {
          statusBar.innerHTML = "Peer have control";
          overlay.style.border = "4px solid #f5222d";
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
