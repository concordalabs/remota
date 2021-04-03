import { User } from "./user";

/**
 * Defines user permissions during the session. These are related to what the user
 * can emit back to the other peer.
 * @internal
 */
export enum Permission {
  EmitCursorChange = 1,
  EmitCursorClick,
  EmitScrollChange,
  EmitDOMChange,
  EmitTextInputChange,
}

const HostControl = [
  Permission.EmitCursorChange,
  Permission.EmitCursorClick,
  Permission.EmitScrollChange,
  Permission.EmitDOMChange,
  Permission.EmitTextInputChange,
];

const HostSharedControl = [
  Permission.EmitCursorChange,
  Permission.EmitDOMChange,
];

const AgentSharedControl = [
  Permission.EmitCursorChange,
  Permission.EmitCursorClick,
  Permission.EmitScrollChange,
  Permission.EmitTextInputChange,
];

const AgentView = [Permission.EmitCursorChange];

/**
 * Factory for EmitterAccess permissions
 */
export class Permissions {
  /**
   * @internal
   */
  constructor() {}

  /**
   * Returns the correct level of access a user can have, based on which user is
   * in control.
   */
  static fromUser(user: User, control: User): Permission[] {
    if (user.isSame(control)) {
      return user.isHost() ? HostControl : AgentSharedControl;
    }

    return user.isHost() ? HostSharedControl : AgentView;
  }
}
