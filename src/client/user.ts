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

  isSame(actor: this) {
    return this.id === actor.id;
  }

  isHost() {
    return this.type === UserType.HOST;
  }

  static fromType(t: UserType) {
    switch (t) {
      case UserType.AGENT:
        return new User(UserType.AGENT);
      case UserType.HOST:
        return new User(UserType.HOST);
      default:
        throw new Error("user type not supported");
    }
  }

  static fromJSON(json: any) {
    return new User(json.type, json.name, json.id);
  }
}
