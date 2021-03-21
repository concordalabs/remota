import * as template from "./template";
import { Client, User } from "../client";

export default class UI {
  private ui: HTMLElement;
  private style: HTMLStyleElement;
  private registered: boolean;

  constructor(user: User) {
    this.registered = false;
    this.ui = document.createElement("div");
    this.ui.innerHTML = template.HTML;
    document.body.appendChild(this.ui);

    this.style = document.createElement("style");
    this.style.innerHTML = template.CSS;
    document.getElementsByTagName("head")[0].appendChild(this.style);

    const label = document.querySelector<HTMLDivElement>(
      ".__remote-status-bar-actions-label"
    );
    if (!label) return;
    label.innerText = user.isHost() ? "Revoke" : "Request";
  }

  // TODO: change me correctly
  register(controller: Client): void {
    if (this.registered) return;

    this.onEnd((): void => {
      controller.close();
      this.close();
      alert("Your session has been finished");
    });

    this.onRequestControl((): void => {
      controller.requestControlChange();
    });

    controller.onConnect((): void => {
      const el = document.querySelector("#__remote-status-bar-status");
      if (el) el.innerHTML = "Connected";
    });

    controller.onControlUpdate(({ isControlling }): void => {
      const statusBar = document.querySelector<HTMLElement>(
        "#__remote-status-bar-control"
      );
      if (!statusBar) return;

      const overlay = document.querySelector<HTMLIFrameElement>(
        "#__remote-status-overlay"
      );
      if (!overlay) return;

      if (isControlling) {
        statusBar.innerHTML = "You have control";
        overlay.style.border = "4px solid #52c41a";
      } else {
        statusBar.innerHTML = "Peer have control";
        overlay.style.border = "4px solid #f5222d";
      }
    });
  }

  // eslint-disable-next-line
  onEnd(cb: (e: any) => void) {
    const el = document.querySelector("#__remote-status-bar-end");
    if (el) el.addEventListener("click", (e) => cb(e));
    return this;
  }

  // eslint-disable-next-line
  onRequestControl(cb: (e: any) => void) {
    const el = document.querySelector("#__remote-status-bar-request-control");
    if (el) el.addEventListener("click", (e) => cb(e));
    return this;
  }

  close(): void {
    this.registered = false;
    this.ui.remove();
    this.style.remove();
  }
}
