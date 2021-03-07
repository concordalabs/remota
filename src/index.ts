import UI from "./ui/index";
import Client from "./client";
import Page from "./client/page";
import IO from "./client/socket/io";
import Socket from "./client/socket";
import User, { UserType } from "./client/user";

export type ClientConfig = {
  clientId: string;
  key: string;
  url?: string;
};

export type AgentConfig = ClientConfig & {
  selector?: string;
  type: UserType.AGENT;
};

export type HostConfig = ClientConfig & {
  type: UserType.HOST;
};

export type Config = (AgentConfig | HostConfig) & ClientConfig;

export default class Conversa {
  static create(config: Config): Client {
    if (!config.clientId || !config.key)
      throw new Error("Conversa clientId or key are missing");

    const io = new IO({
      url: config.url ?? "ws://localhost:4000",
      key: config.key,
      clientId: config.clientId,
    });
    const socket = new Socket(io);

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

    const daemon = new Client(
      config.clientId,
      User.fromType(config.type),
      socket,
      page
    );

    const ui = new UI();
    ui.register(daemon);

    return daemon;
  }

  static agent(config: AgentConfig): Client {
    return Conversa.create({ ...config, type: UserType.AGENT });
  }

  static host(config: HostConfig): Client {
    return Conversa.create({ ...config, type: UserType.HOST });
  }
}
