import User from "../user";

export interface State {
  code: string;
  session: string;
  control: User;
  user: User;
}

export default class StateManager {
  private key: string;

  constructor(key = "state", private storage = window.sessionStorage) {
    this.key = `share-remote:${key}:`;
  }

  private save(data: State | null) {
    this.storage.setItem(this.key, JSON.stringify(data));
  }

  private merge(js: any) {
    const data = this.storage.getItem(this.key);
    if (!data) return this.save({ ...js });

    const state = JSON.parse(data);
    this.save({
      ...state,
      ...js,
    });
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

  clear() {
    this.save(null);
  }

  setUser(user: User) {
    this.merge({ user });
    return this;
  }

  setControl(control: User) {
    this.merge({ control });
    return this;
  }

  setCode(code: string) {
    this.merge({ code });
    return this;
  }

  setSession(session: string) {
    this.merge({ session });
    return this;
  }
}
