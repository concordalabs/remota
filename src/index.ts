import UI from "./ui/index";
import Client from "./client";
import Page from "./client/page";
import WS from "./client/socket/websocket";
import Socket from "./client/socket";
import User, { UserType } from "./client/user";

export type ClientConfig = {
  clientId: string;
  key: string;
  code: string;
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

export default class Remota {
  static create(config: Config): Client {
    if (!config.clientId || !config.key)
      throw new Error("Remota clientId or key are missing");

    const io = new WS({
      url: config.url ?? "wss://remota.xyz",
      key: config.key,
      code: config.code,
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

    const ui = new UI(User.fromType(config.type));
    ui.register(daemon);

    return daemon.start();
  }

  static agent(config: ClientConfig): Client {
    return Remota.create({ ...config, type: UserType.AGENT });
  }

  static host(config: ClientConfig): Client {
    return Remota.create({ ...config, type: UserType.HOST });
  }
}
