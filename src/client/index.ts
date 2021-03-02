import EventEmitter from "eventemitter3";
import User, { UserType } from "./user";
import StateManager from "./state";
import Permissions from "./access";
import randomSequence from "./helpers/randomSequence";
import Socket from "./socket/socketio";
import { SocketMessages } from "./socket";
import { Page } from "./page";

export { User, UserType, Socket, Page };

export class Client {
  private user: User;
  private code: string;
  private session: string;
  private control: User;
  private intervals: any;

  constructor(
    user: User,
    private socket: Socket,
    public page: Page,
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

  setCode(code: string) {
    this.state.setCode(this.code);
    this.code = code;
    return this;
  }

  start(code?: string) {
    if (code) this.setCode(code);

    this.logger.info("connecting");
    this.page.setPermissions(Permissions.fromUser(this.user, this.control));
    this.updateControl({ accept: true, control: this.control });
    this.page.listen();
    this.socket.connect(this.code);

    let requestJoinInterval: ReturnType<typeof setInterval>;
    this.onConnect(() => {
      this.logger.info("connected");
      if (this.session) {
        this.socket.join({ code: this.session });
        return this.updateJoin({ code: this.session });
      }

      if (this.user.isHost()) {
        return this.updateJoin({ code: randomSequence(128) });
      }

      requestJoinInterval = setInterval(() => {
        this.requestJoin({ user: this.user });
      }, 500);
    });

    // JOIN HANDLERS

    this.onJoinRequest(({ user }) => {
      this.logger.info("sending join request");
      this.socket.signal(SocketMessages.PromptJoinRequest, { user });
    });

    // Developers would have to implement their own `onControlChangePrompt` with
    // host.onJoinPrompt(({ user }) => something());

    this.onJoinResponse(({ user, accept }) => {
      if (!this.user.isHost()) return;
      const payload = {
        user,
        accept,
        code: accept ? this.session : undefined,
      };
      this.socket.signal(SocketMessages.JoinUpdate, payload);

      if (accept) {
        setTimeout(() => this.page.dump(), 1000);
      }

      // TODO: update the list of connected peers
    });

    this.onJoinUpdate((payload: any) => {
      clearInterval(requestJoinInterval);

      if (!this.user.isHost() && payload.accept) {
        this.socket.join(payload);
      } else if (this.user.isHost()) {
        this.socket.join(payload);
      }

      this.session = payload.code;
      this.state.setSession(payload.code);
    });

    this.onNewUser(() => {
      if (this.user.isHost()) return;
      setTimeout(() => this.page.dump(), 1000);
    });

    // CONTROL HANDLERS

    this.onControlChangeRequest(() => {
      if (this.user.isHost()) return this.revokeControl();

      this.socket.send(SocketMessages.PromptControlRequest, {
        user: this.user,
      });
    });

    // Developers would have to implement their own `onControlChangePrompt` with
    // host.onControlChangePrompt(({ user }) => something());

    this.onControlChangeResponse(
      (payload: { control: any; accept: boolean }) => {
        this.socket.send(SocketMessages.ControlUpdate, payload);
        this.updateControl(payload);
      }
    );

    this.onControlUpdate(({ control, accept }) => {
      if (!accept) return;

      this.control = User.fromJSON(control);
      this.state.setControl(control);
      accept &&
        this.page.setPermissions(
          Permissions.fromUser(this.user, User.fromJSON(control))
        );
    });

    // handle the event sent with socket.send()
    this.socket.onMessage((data: { type: SocketMessages; payload: any }) => {
      const { type, payload } = data;

      switch (type) {
        case SocketMessages.PromptControlRequest:
          if (!this.user.isHost()) return;
          return this.promptControlChange(payload);
        case SocketMessages.ControlUpdate:
          if (this.user.isHost()) return;
          return this.updateControl(payload);
        default:
          return;
      }
    });

    this.socket.onMessage((data) => this.page.handle(data));

    this.socket.onSignal((data: any) => {
      const { type, payload } = data;
      switch (type) {
        case SocketMessages.PromptJoinRequest:
          if (!this.user.isHost()) return;
          return this.promptJoin(payload);
        case SocketMessages.JoinUpdate:
          if (this.user.isHost()) return;
          // TODO: use events
          return this.updateJoin(payload);
        default:
          return;
      }
    });

    // FIXME: these are hacks while I don't make some stuff reactive
    setInterval(() => {
      this.page.setPermissions(Permissions.fromUser(this.user, this.control));
    }, 1000);

    return this;
  }

  /*
   * Socket life-cycle
   * 1. agent: connect
   * 2. agent onConnect
   */
  onConnect(cb: (e: any) => void) {
    this.socket.onConnect(cb);
  }

  /*
   *
   * Joining life-cycle
   *
   */
  requestJoin(e: any) {
    this.events.emit("request:join", e);
  }

  onJoinRequest(cb: (e: any) => void) {
    this.events.on("request:join", cb);
  }

  promptJoin(e: any) {
    this.events.emit("prompt:join", e);
  }

  onJoinPrompt(cb: (e: any) => void) {
    this.events.on("prompt:join", cb);
  }

  replyJoinRequest(e: any) {
    this.events.emit("response:join", e);
  }

  onJoinResponse(cb: (e: any) => void) {
    this.events.on("response:join", cb);
  }

  updateJoin(e: any) {
    this.events.emit("update:join", e);
  }

  onJoinUpdate(cb: (e: any) => void) {
    this.events.on("update:join", cb);
  }

  acceptUser(user: any) {
    this.replyJoinRequest({ user, accept: true });
  }

  denyUser(user: any) {
    this.replyJoinRequest({ user, accept: false });
  }

  onNewUser(cb: (e: any) => void) {
    this.socket.onNewUser(cb);
  }

  /*
   * Control change life-cycle
   * 1. agent: requestControlChange
   * 2. agent: onControlChangeRequest sends a promp signal to the socket
   * 3. host: receive signal and trigger promptControlChange
   * 4. host: onControlChangePrompt is called and should check for confirmation
   * 5. host: replyControlChange with allow or deny
   * 6. host: onControlChangeReply sends the control change through and update local state
   * 7. agent: control update is received and triggers updateControl
   * 8. agent: onControlUpdate handles change
   */

  requestControlChange(e: any) {
    this.events.emit("request:control-change", e);
  }

  onControlChangeRequest(cb: (e: any) => void) {
    this.events.on("request:control-change", cb);
  }

  promptControlChange(e: any) {
    this.events.emit("prompt:control-change", e);
  }

  onControlChangePrompt(cb: (e: any) => void) {
    this.events.on("prompt:control-change", cb);
  }

  replyControlChangeRequest(e: any) {
    if (!this.user.isHost()) {
      throw new Error("Only host is allowed `control-change` operations");
    }
    this.events.emit("response:control-change", e);
  }

  onControlChangeResponse(cb: (e: any) => void) {
    this.events.on("response:control-change", cb);
  }

  updateControl(payload: any) {
    const control = User.fromJSON(payload.control);
    this.events.emit("update:control", {
      accept: payload.accept,
      control,
      isControlling: control.isSame(this.user),
    });
  }

  onControlUpdate(cb: (e: any) => void) {
    this.events.on("update:control", cb);
  }

  acceptControlChange(user: any) {
    this.replyControlChangeRequest({ control: user, accept: true });
  }

  denyControlChange() {
    this.replyControlChangeRequest({ control: this.user, accept: false });
  }

  revokeControl() {
    this.replyControlChangeRequest({
      control: this.user,
      accept: true,
      overwrite: true,
    });
  }

  /*
   * Closer function
   * Still need some extra stuff to be closed here
   */

  close() {
    this.logger.info("closing");
    this.state.clear();

    // this.page.close(); // TODO: re-activate this
    // @ts-ignore
    Object.values(this.intervals).forEach(clearInterval);
    if (this.socket) this.socket.close();
  }
}
