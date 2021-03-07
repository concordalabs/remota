import EventEmitter from "eventemitter3";
import User, { UserType } from "./user";
import StateManager from "./state";
import Permissions from "./access";
import randomSequence from "./helpers/randomSequence";
import Socket, { SocketMessages } from "./socket";
import IO from "./socket/io";
import { Page } from "./page";

export { User, UserType, Socket, Page, IO };

export interface PromptJoin {
  user: User;
  accept?: boolean;
}

export interface UpdateJoin {
  code: string;
  accept?: boolean;
}

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
  private session: string;
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
      this.session = state.session;
      this.user = state.user;
      this.control = state.control;
    } catch (e) {
      this.code = "";
      this.session = "";
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
      if (this.session) {
        this.socket.join({ code: this.session });
        return this.updateJoin({ code: this.session });
      }

      if (this.user.isHost()) {
        return this.updateJoin({ code: randomSequence(128) });
      }

      this.intervals.requestJoinInterval = setInterval(() => {
        this.socket.signal(SocketMessages.PromptJoinRequest, {
          user: this.user,
        });
      }, 500);
    });

    this.socket.onNewUser(() =>
      this.user.isHost() ? setTimeout(() => this.page.dump(), 1000) : null
    );

    this.socket.onMessage((data) => this.page.handle(data));

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

    this.socket.onSignal(({ type, payload }) => {
      switch (type) {
        case SocketMessages.PromptJoinRequest:
          if (!this.user.isHost()) return;
          return this.promptJoin(payload);
        case SocketMessages.JoinUpdate:
          if (this.user.isHost()) return;
          return this.updateJoin(payload);
      }
    });

    return this;
  }

  // User event hooks: used by UI and prompts

  onConnect(cb: () => void): void {
    this.socket.onConnect(cb);
  }

  onJoinPrompt(cb: (e: PromptJoin) => void): void {
    this.events.on("prompt:join", cb);
  }

  onControlUpdate(cb: (e: UpdateControl) => void): void {
    this.events.on("update:control", cb);
  }

  onControlChangePrompt(cb: (e: PromptControl) => void): void {
    this.events.on("prompt:control-change", cb);
  }

  // User interface

  promptJoin(e: PromptJoin): void {
    this.events.emit("prompt:join", e);
  }

  acceptUser(user: User): void {
    this.replyJoinRequest({ user, accept: true });
  }

  denyUser(user: User): void {
    this.replyJoinRequest({ user, accept: false });
  }

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

  private replyJoinRequest({ user, accept }: PromptJoin): void {
    if (!this.user.isHost()) return;
    this.socket.signal(SocketMessages.JoinUpdate, {
      user,
      accept,
      code: accept ? this.session : undefined,
    });

    if (accept) setTimeout(() => this.page.dump(), 1000);
  }

  private updateJoin(payload: UpdateJoin): void {
    clearInterval(this.intervals.requestJoinInterval);

    if (!this.user.isHost() && payload.accept) {
      this.socket.join(payload);
    } else if (this.user.isHost()) {
      this.socket.join(payload);
    }

    this.session = payload.code;
    this.state.setSession(payload.code);
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

  // Closer function

  close(): void {
    this.logger.info("closing");
    this.state.clear();
    //
    // this.page.close(); // TODO: re-activate this

    Object.values(this.intervals).forEach((i) => clearInterval(i));
    if (this.socket) this.socket.close();
  }
}

export default Client;
