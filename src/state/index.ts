import { User } from "../user";

export interface State {
  code: string;
  control: User;
  user: User;
}

export class StateManager {
  private key: string;

  constructor(key = "state", private storage = window.sessionStorage) {
    this.key = `share-remote:${key}:`;
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

  setUser(user: User): this {
    return this.merge({ user });
  }

  setControl(control: User): this {
    return this.merge({ control });
  }

  setCode(code: string): this {
    return this.merge({ code });
  }
}
