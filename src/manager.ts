import EventEmitter from "eventemitter3";
import { User, UserType } from "./user";
import { StateManager } from "./state";
import { Permissions } from "./access";
import { Socket, SocketMessages } from "./socket";
import { Page } from "./page";
import { SocketError } from "./errors";

export type PromptControl = {
  user: User;
};

export type UpdateControl = {
  accept: boolean;
  control: User;
  isControlling?: boolean;
  overwrite?: boolean;
};

/**
 * Remota main class, returned when the Remota.agent/host is called. It enables developers
 * to listen to important events, such as when users joined, session control requests and changes
 * and so on.
 */
export class Manager {
  private control: User;
  private intervals: { [k: string]: ReturnType<typeof setInterval> };

  /**
   * @internal
   */
  constructor(
    private user: User,
    private socket: Socket,
    private page: Page,
    private state = new StateManager(),
    private logger = console,
    private events = new EventEmitter()
  ) {
    try {
      const state = this.state.get();
      this.control = state.control;
    } catch (e) {
      this.control = user.isHost() ? user : User.fromType(UserType.HOST);
    }

    this.intervals = {};
  }
  /**
   * Start listening to events and set socket handlers. In the future, the socket connection
   * will be started here as well.
   */
  start(): this {
    this.logger.info("conversa is starting...");
    this.page.setPermissions(Permissions.fromUser(this.user, this.control));
    this.updateControl({ accept: true, control: this.control });
    this.page.listen();

    this.socket.onConnect(() => {
      this.logger.info("ready for conversa 🚀");
    });

    this.socket.onConnectError((): void => {
      this.logger.info("conversa failed to connect 🚨");
    });

    this.socket.onMessage((data) => this.page.handle(data));

    this.socket.onJoin(({ type }) => {
      switch (type) {
        case SocketMessages.PeerJoin:
          return this.page.dump();
      }
    });

    this.socket.onControl(({ type, payload }) => {
      switch (type) {
        case SocketMessages.PromptControlRequest:
          if (!this.user.isHost()) return;
          return this.promptControlChange(payload);
        case SocketMessages.ControlUpdate:
          if (this.user.isHost()) return;
          return this.updateControl(payload);
      }
    });

    return this;
  }

  /**
   * Listen to events triggered by when it gets connected to Remota server. This can be used
   * to change UI state.
   */
  onConnect(cb: () => void): void {
    this.socket.onConnect(cb);
  }

  /**
   * Listen to events when there is a change control request from the UI. This is used to
   * forward to the Remota server, but can as well be used to change UI state.
   */
  onControlUpdate(cb: (e: UpdateControl) => void): void {
    this.events.on("update:control", cb);
  }

  /**
   * Listen to events when there is a control change request from the server. Developers should
   * use this to prompt the user to confirm/deny the control change.
   */
  onControlChangePrompt(cb: (e: PromptControl) => void): void {
    this.events.on("prompt:control-change", cb);
  }

  /**
   * Listen to error events within the manager. Can be used to log errors or show error messages.
   */
  onError(cb: (e: Error) => void): void {
    this.events.on("error", cb);
  }

  /**
   * Listen the Remota manager close events. Can be used to alert the user in case the session
   * was ended (when close() is called)
   */
  onClose(cb: () => void): void {
    this.events.on("close", cb);
  }

  /**
   * Triggers a control change request
   */
  requestControlChange(): void {
    if (this.user.isHost()) return this.revokeControl();

    this.socket.send(SocketMessages.PromptControlRequest, {
      user: this.user,
    });
  }

  /**
   * Accept a control change (uses replyControlChangeRequest)
   */
  acceptControlChange(user: User): void {
    this.replyControlChangeRequest({ control: user, accept: true });
  }

  /**
   * Deny control change (uses replyControlChangeRequest)
   */
  denyControlChange(): void {
    this.replyControlChangeRequest({ control: this.user, accept: false });
  }

  /**
   * Revoke control from agent (only host can trigger)
   */
  revokeControl(): void {
    this.replyControlChangeRequest({
      control: this.user,
      accept: true,
      overwrite: true,
    });
  }

  /*
   * Triggers control change request response, forwarding to the server
   */
  private replyControlChangeRequest(e: UpdateControl): void {
    if (!this.user.isHost()) {
      throw new Error("Only host is allowed `control-change` operations");
    }
    this.socket.send(SocketMessages.ControlUpdate, e);
    this.updateControl(e);
  }

  /*
   * Triggers control updates, once received data from the server
   */
  private updateControl(payload: UpdateControl): void {
    const control = User.fromJSON(payload.control);
    this.events.emit("update:control", {
      accept: payload.accept,
      control,
      isControlling: control.isSame(this.user),
    });

    if (!payload.accept) return;

    this.control = control;
    this.state.setControl(control);
    this.page.setPermissions(Permissions.fromUser(this.user, control));
  }

  /*
   * Triggers the control change prompt event
   */
  private promptControlChange(e: PromptControl): void {
    this.events.emit("prompt:control-change", e);
  }

  /*
   * Triggers the error event
   */
  private error(e: Error): void {
    this.events.emit("error", e);
  }

  /**
   * Close manager and associated resources
   */
  close(): void {
    this.logger.info("closing");
    this.state.clear();
    this.page.close();

    Object.values(this.intervals).forEach((i) => clearInterval(i));
    this.events.emit("close", {});
    this.socket.close();
  }
}
