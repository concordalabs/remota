import { Manager } from "./manager";
import { Page } from "./page";
import { Socket } from "./socket";
import { CommonUI, UI } from "./ui";
import { User, UserType } from "./user";
import { StateManager } from "./state";

export * as Manager from "./manager";
export * as UI from "./ui";
export * as User from "./user";
export * as Error from "./errors";

/**
 * Required configuration for Remota client
 */
export type ClientConfig = {
  /**
   * Your Remota client id
   */
  clientId: string;
  /**
   * Your Remota client key
   */
  key: string;
  /**
   * Remota session code
   */
  code: string;
  /**
   * Remota server URL (defaults to remota.xyz)
   */
  url?: string;
  /**
   * Use custom UI, if provided
   */
  ui?: UI;
  /**
   * Mask all user inputs
   */
  maskAllInputs?: boolean;
};

/**
 * Agent config inherits the default ClientConfig and requires the setting of
 * a CSS "selector" to indicate in which element it should register the Page components
 * @internal
 */
export type AgentConfig = ClientConfig & {
  selector?: string;
  type: UserType.AGENT;
};

/**
 * Host config inherits the default ClientConfig
 * @internal
 */
export type HostConfig = ClientConfig & {
  type: UserType.HOST;
};

/**
 * @internal
 */
export type Config = (AgentConfig | HostConfig) & ClientConfig;

export default class Remota {
  /**
   * @internal
   */
  static create(config: Config): Manager {
    if (!config.clientId || !config.key)
      throw new Error("Remota clientId or key are missing");

    const socket = new Socket({
      url: config.url ?? "wss://remota.xyz",
      key: config.key,
      code: config.code,
      clientId: config.clientId,
    });

    let page: Page;
    switch (config.type) {
      case UserType.AGENT: {
        page = new Page(socket, {
          selector: config.selector,
          maskAllInputs: config.maskAllInputs,
        });
        break;
      }
      case UserType.HOST: {
        page = new Page(socket);
        break;
      }
      default: {
        throw new Error("Not a valid config");
      }
    }

    const user = User.fromType(config.type);
    const state = new StateManager();
    state.setCode(config.code);
    state.setUser(user);
    const daemon = new Manager(user, socket, page, state);
    const ui = config.ui ? config.ui : new CommonUI(user);

    ui.register(daemon);
    daemon.start();

    return daemon;
  }

  static getPreviousCode(): string | null {
    const state = new StateManager();
    return state.getCode();
  }

  /**
   * Starts a Remota session in the agent browser (usually through remota.xyz), which is going to
   * be the peer supporting the host user.
   * @internal
   */
  static agent(config: ClientConfig): Manager {
    return Remota.create({ ...config, type: UserType.AGENT });
  }

  /**
   * Starts a Remota session in your user's browser, which is going to be the session host
   */
  static host(config: ClientConfig): Manager {
    return Remota.create({ ...config, type: UserType.HOST });
  }
}
