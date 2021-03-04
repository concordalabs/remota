import UI from "./ui/index";
import * as client from "./client/index";
import { UserType } from "./client/index";

export { UI, client, UserType };

export type ClientConfig = {
  clientId: string;
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
  static create(config: Config) {
    const io = new client.IO(config.url ?? "ws://localhost:4000");
    const socket = new client.Socket(io);

    let page: client.Page;
    switch (config.type) {
      case UserType.AGENT: {
        page = new client.Page(socket, config.selector);
        break;
      }
      case UserType.HOST: {
        page = new client.Page(socket);
        break;
      }
      default: {
        throw new Error("Not a valid config");
      }
    }

    const daemon = new client.Client(
      config.clientId,
      client.User.fromType(config.type),
      socket,
      page
    );

    const ui = new UI();
    ui.register(daemon);

    return daemon;
  }

  static agent(config: AgentConfig) {
    return Conversa.create({ ...config, type: UserType.AGENT });
  }

  static host(config: HostConfig) {
    return Conversa.create({ ...config, type: UserType.HOST });
  }
}
