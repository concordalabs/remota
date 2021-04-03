import * as template from "./template";
import { Manager } from "../manager";
import { User } from "../user";

/**
 * Defines the UI interface
 */
export interface UI {
  /**
   * Register the UI with a Remota session manager (required to make UI work)
   */
  register(manager: Manager): void;
  close(): void;
}

/**
 * Default Remota UI. Can be used as a base for customised ones.
 */
export class CommonUI implements UI {
  private ui: HTMLElement;
  private style: HTMLStyleElement;
  private registered: boolean;

  /**
   * Returns an UI instance. Depending on the UserType, some UI components might be different,
   * as agents and hosts have different types of features.
   */
  constructor(private user: User) {
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

  /**
   * Register the UI with a Remota session manager (required to make UI work)
   */
  register(manager: Manager): void {
    if (this.registered) return;

    this.onEnd((): void => {
      manager.close();
      this.close();
    });

    this.onRequestControl((): void => {
      manager.requestControlChange();
    });

    manager.onConnect((): void => {
      const el = document.querySelector("#__remote-status-bar-status");
      if (el) el.innerHTML = "Connected";
    });

    manager.onControlUpdate(({ isControlling, control }): void => {
      const statusBar = document.querySelector<HTMLElement>(
        "#__remote-status-bar-control"
      );
      if (!statusBar) return;

      const overlay = document.querySelector<HTMLElement>(
        "#__remote-status-overlay"
      );
      if (!overlay) return;

      const controlBtn = document.querySelector<HTMLElement>(
        "#__remote-status-bar-request-control"
      );
      if (!controlBtn) return;

      if (control.isSame(this.user)) {
        statusBar.innerHTML = this.user.isHost()
          ? "Agent is viewing"
          : "Shared control";
        overlay.style.border = "4px solid #52c41a";
      } else {
        statusBar.innerHTML = this.user.isHost()
          ? "Shared control"
          : "Highlighting";
        overlay.style.border = "4px solid #f5222d";
        controlBtn.style.display = this.user.isHost() ? "none" : "block";
      }

      controlBtn.style.display = isControlling ? "none" : "block";
    });
  }

  // eslint-disable-next-line
  private onEnd(cb: (e: any) => void) {
    const el = document.querySelector("#__remote-status-bar-end");
    if (el) el.addEventListener("click", (e) => cb(e));
    return this;
  }

  // eslint-disable-next-line
  private onRequestControl(cb: (e: any) => void) {
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
