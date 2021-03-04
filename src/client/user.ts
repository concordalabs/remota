import randomSequence from "./helpers/randomSequence";

export enum UserType {
  AGENT = 1,
  HOST,
}

export default class User {
  public id: string;

  constructor(public type: UserType, public name?: string, id?: string) {
    this.id = type === UserType.HOST ? "host" : id || randomSequence(32);
  }

  isSame(actor: this): boolean {
    return this.id === actor.id;
  }

  isHost(): boolean {
    return this.type === UserType.HOST;
  }

  static fromType(t: UserType): User {
    switch (t) {
      case UserType.AGENT:
        return new User(UserType.AGENT, "agent");
      case UserType.HOST:
        return new User(UserType.HOST, "host", "host");
      default:
        throw new Error("user type not supported");
    }
  }

  // eslint-disable-next-line
  static fromJSON(json: any): User {
    return new User(json.type, json.name, json.id);
  }
}
