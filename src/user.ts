/**
 * Defines the user type
 */
export enum UserType {
  /**
   * Agent user type, which is the user using remota.xyz session client
   */
  AGENT = 1,
  /**
   * Host user type, which is the user using your app (hosting the session)
   */
  HOST,
}

/**
 * Defines a user, based on an UserType. This class is used to run checks
 * around access and control when required
 */
export class User {
  constructor(public type: UserType, public name?: string) {}

  isSame(actor: this): boolean {
    return this.type === actor.type;
  }

  isHost(): boolean {
    return this.type === UserType.HOST;
  }

  static fromType(t: UserType): User {
    switch (t) {
      case UserType.AGENT:
        return new User(UserType.AGENT, "agent");
      case UserType.HOST:
        return new User(UserType.HOST, "host");
      default:
        throw new Error("user type not supported");
    }
  }

  // eslint-disable-next-line
  static fromJSON(json: any): User {
    return new User(json.type, json.name);
  }
}
