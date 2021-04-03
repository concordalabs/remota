import DOM from "./dom";
import TextInput from "./text-input";
import Scroll from "./scroll";
import Mouse from "./mouse";
import Url from "./url";
import { EmitterAccess } from "../access";
import { Socket, PageMessages } from "../socket";

/**
 * Contains DOM page handlers, responsible for gathering user interactions and send
 * to other peers.
 */
export class Page {
  private dom: DOM;
  private textInput: TextInput;
  private scroll: Scroll;
  private mouse: Mouse;
  private url: Url;

  constructor(
    private emitter: Socket,
    domAccessor = "body",
    private permissions = [EmitterAccess.CursorChange]
  ) {
    this.dom = new DOM(domAccessor);
    this.textInput = new TextInput();
    this.scroll = new Scroll();
    this.mouse = new Mouse();
    this.url = new Url();
  }

  dump(): void {
    this.permissions.includes(EmitterAccess.DOMChange) &&
      this.emitter.send(PageMessages.DOMChanged, {
        html: this.dom.dump(),
      });
  }

  setPermissions(permissions: EmitterAccess[]): void {
    this.permissions = permissions;
  }

  listen(): void {
    this.mouse.onMove((e): void => {
      this.permissions.includes(EmitterAccess.CursorChange) &&
        this.emitter.send(PageMessages.CursorMoved, e);
    });

    this.mouse.onClick((e): void => {
      this.permissions.includes(EmitterAccess.CursorClick) &&
        this.emitter.send(PageMessages.CursorClicked, e);
    });

    this.scroll.onChange((e): void => {
      this.permissions.includes(EmitterAccess.ScrollChange) &&
        this.emitter.send(PageMessages.ScrollChanged, e);
    });

    this.dom.onChange((e): void => {
      this.permissions.includes(EmitterAccess.DOMChange) &&
        this.emitter.send(PageMessages.DOMChanged, e);
    });

    this.textInput.onChange((e): void => {
      this.permissions.includes(EmitterAccess.TextInputChange) &&
        this.emitter.send(PageMessages.TextInputChanged, e);
    });
  }

  // eslint-disable-next-line
  handle(data: any): void {
    const { type, payload, upstream } = data;
    if (upstream) return; // FIXME: there must be a better way than this

    switch (type) {
      case PageMessages.ScrollChanged:
        return this.scroll.update(payload);
      case PageMessages.CursorMoved:
        return this.mouse.update(payload);
      case PageMessages.CursorClicked:
        return this.mouse.click(payload);
      case PageMessages.TextInputChanged:
        return this.textInput.update(payload);
      case PageMessages.URLChanged:
        return this.url.refresh(payload);
      case PageMessages.DOMChanged:
        return this.dom.update({
          ...payload,
        });
      case PageMessages.DOMRequested:
        return this.dump();
      default:
        return;
    }
  }

  close(): void {
    this.dom.close();
    this.textInput.close();
    this.scroll.close();
    this.mouse.close();
  }
}
