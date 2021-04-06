import { User, UserType } from "../user";

export interface State {
  code: string;
  control: User;
  user: User;
}

export class StateManager {
  private key = "remota:state:";

  constructor(private storage = window.sessionStorage) {}

  static load({ code, user }: { code: string; user: User }): StateManager {
    const state = new StateManager();
    try {
      state.get();
      return state;
    } catch (e) {
      state.code = code;
      state.user = user;
      state.control = user.isHost() ? user : User.fromType(UserType.HOST);
      return state;
    }
  }

  private save(data: State | null): this {
    this.storage.setItem(this.key, JSON.stringify(data));
    return this;
  }

  // eslint-disable-next-line
  private merge(js: any): this {
    const data = this.storage.getItem(this.key);
    if (!data) return this.save({ ...js });

    const state = JSON.parse(data);
    this.save({
      ...state,
      ...js,
    });
    return this;
  }

  get(): State {
    const data = this.storage.getItem(this.key);
    if (!data) throw new Error("not found");

    const state = JSON.parse(data);
    return {
      ...state,
      control: User.fromJSON(state.control),
      user: User.fromJSON(state.user),
    };
  }

  clear(): void {
    this.save(null);
  }

  get code(): string {
    return this.get().code;
  }

  set code(code: string) {
    this.merge({ code });
  }

  get user(): User {
    return this.get().user;
  }

  set user(user: User) {
    this.merge({ user });
  }

  get control(): User {
    return this.get().control;
  }

  set control(control: User) {
    this.merge({ control });
  }
}
