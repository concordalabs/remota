import EventEmitter from "eventemitter3";
import User, { UserType } from "./user";
import StateManager from "./state";
import Permissions from "./access";
import Socket, { SocketMessages } from "./socket";
import IO from "./socket/io";
import { Page } from "./page";
import { SocketError } from "./errors";

export { User, UserType, Socket, Page, IO };

export interface PromptControl {
  user: User;
}

export interface UpdateControl {
  accept: boolean;
  control: User;
  isControlling?: boolean;
  overwrite?: boolean;
}

export class Client {
  private user: User;
  private code: string;
  private control: User;
  private intervals: { [k: string]: ReturnType<typeof setInterval> };

  constructor(
    private clientId: string,
    user: User,
    private socket: Socket,
    private page: Page,
    private state = new StateManager(),
    private logger = console,
    private events = new EventEmitter()
  ) {
    try {
      const state = this.state.get();
      this.code = state.code;
      this.user = state.user;
      this.control = state.control;
    } catch (e) {
      this.code = "";
      this.user = user;
      this.control = user.isHost() ? user : User.fromType(UserType.HOST);
    }
    this.state.setCode(this.code).setUser(this.user);

    this.intervals = {};
  }

  setCode(c: string): this {
    const code = `${this.clientId}:${c}`;
    this.state.setCode(code);
    this.code = code;
    return this;
  }

  start(code?: string): this {
    if (code) this.setCode(code);

    this.logger.info("conversa is starting...");
    this.page.setPermissions(Permissions.fromUser(this.user, this.control));
    this.updateControl({ accept: true, control: this.control });
    this.page.listen();
    this.socket.connect(this.code);

    this.socket.onConnect(() => {
      this.logger.info("ready for conversa 🚀");
    });

    this.socket.onConnectError((err): void => {
      this.logger.info("conversa failed to connect 🚨", {
        message: err.message,
        description: err.data.description,
      });
      this.error(new SocketError(err.message, err.data.description));
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

  // User event hooks: used by UI and prompts

  onConnect(cb: () => void): void {
    this.socket.onConnect(cb);
  }

  onControlUpdate(cb: (e: UpdateControl) => void): void {
    this.events.on("update:control", cb);
  }

  onControlChangePrompt(cb: (e: PromptControl) => void): void {
    this.events.on("prompt:control-change", cb);
  }

  onError(cb: (e: Error) => void): void {
    this.events.on("error", cb);
  }

  // User interface

  requestControlChange(): void {
    if (this.user.isHost()) return this.revokeControl();

    this.socket.send(SocketMessages.PromptControlRequest, {
      user: this.user,
    });
  }

  acceptControlChange(user: User): void {
    this.replyControlChangeRequest({ control: user, accept: true });
  }

  denyControlChange(): void {
    this.replyControlChangeRequest({ control: this.user, accept: false });
  }

  revokeControl(): void {
    this.replyControlChangeRequest({
      control: this.user,
      accept: true,
      overwrite: true,
    });
  }

  private replyControlChangeRequest(e: UpdateControl): void {
    if (!this.user.isHost()) {
      throw new Error("Only host is allowed `control-change` operations");
    }
    this.socket.send(SocketMessages.ControlUpdate, e);
    this.updateControl(e);
  }

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

  private promptControlChange(e: PromptControl): void {
    this.events.emit("prompt:control-change", e);
  }

  private error(e: Error): void {
    this.events.emit("error", e);
  }

  // Closer function

  onClose(cb: () => void): void {
    this.events.on("close", cb);
  }

  close(): void {
    this.logger.info("closing");
    this.state.clear();
    //
    // this.page.close(); // TODO: re-activate this

    Object.values(this.intervals).forEach((i) => clearInterval(i));
    if (this.socket) this.socket.close();
    this.events.emit("close", {});
  }
}

export default Client;
