import UI from "./ui/index";
import * as client from "./client/index";
import { UserType } from "./client/index";

export { UI, client, UserType };

export interface Config {
  selector?: string;
  url?: string;
  type: client.UserType;
}

export interface AgentConfig {
  selector?: string;
  url?: string;
}

export interface HostConfig {
  url?: string;
}

export default class Conversa {
  static create(config: Config) {
    const socket = new client.Socket(config.url ?? "ws://localhost:4000");
    // @ts-ignore
    const page = new client.Page(socket, config.selector);
    const daemon = new client.Client(
      client.User.fromType(config.type),
      socket,
      page
    );

    const ui = new UI();
    ui.register(daemon);

    return daemon;
  }

  static agent(config?: AgentConfig) {
    return Conversa.create({ ...config, type: UserType.AGENT });
  }

  static host(config?: HostConfig) {
    return Conversa.create({ ...config, type: UserType.HOST });
  }
}
