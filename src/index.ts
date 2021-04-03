import { Manager } from "./manager";
import { Page } from "./page";
import { Socket } from "./socket";
import { UI } from "./ui";
import { User, UserType } from "./user";

export type ClientConfig = {
  clientId: string;
  key: string;
  code: string;
  url?: string;
  ui?: UI;
};

export type AgentConfig = ClientConfig & {
  selector?: string;
  type: UserType.AGENT;
};

export type HostConfig = ClientConfig & {
  type: UserType.HOST;
};

export type Config = (AgentConfig | HostConfig) & ClientConfig;

export default class Remota {
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
        page = new Page(socket, config.selector);
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
    const daemon = new Manager(user, socket, page);
    const ui = config.ui ? config.ui : new UI(user);

    ui.register(daemon);
    daemon.start();

    return daemon;
  }

  static agent(config: ClientConfig): Manager {
    return Remota.create({ ...config, type: UserType.AGENT });
  }

  static host(config: ClientConfig): Manager {
    return Remota.create({ ...config, type: UserType.HOST });
  }
}
