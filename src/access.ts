import { User } from "./user";

export enum EmitterAccess {
  CursorChange = 1,
  CursorClick,
  ScrollChange,
  DOMChange,
  TextInputChange,
}

export const HostWrite = [
  EmitterAccess.CursorChange,
  EmitterAccess.CursorClick,
  EmitterAccess.ScrollChange,
  EmitterAccess.DOMChange,
  EmitterAccess.TextInputChange,
];

export const HostRead = [EmitterAccess.CursorChange, EmitterAccess.DOMChange];

export const AgentWrite = [
  EmitterAccess.CursorChange,
  EmitterAccess.CursorClick,
  EmitterAccess.ScrollChange,
  EmitterAccess.TextInputChange,
];

export const AgentRead = [EmitterAccess.CursorChange];

export class Permissions {
  static fromUser(user: User, control: User): EmitterAccess[] {
    if (user.isSame(control)) {
      return user.isHost() ? HostWrite : AgentWrite;
    }

    return user.isHost() ? HostRead : AgentRead;
  }
}
