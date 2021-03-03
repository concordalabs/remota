import DOM from "./dom";
import TextInput from "./text-input";
import Scroll from "./scroll";
import Mouse from "./mouse";
import Url from "./url";
import { snapshot } from "rrweb-snapshot";
import { EmitterAccess } from "../access";

export enum PageMessages {
  DOMChanged = 1,
  DOMRequested,
  CursorMoved,
  CursorClicked,
  ScrollChanged,
  TextInputChanged,
  URLChanged,
  PermissionsChanged,
}

export interface Proxy {
  send(type: PageMessages, payload: any): void;
  onMessage(cb: any): void;
  close(): void;
}

export class Page {
  private dom: DOM;
  private textInput: TextInput;
  private scroll: Scroll;
  private mouse: Mouse;
  private url: Url;

  constructor(
    private emitter: Proxy,
    domAccessor = "body",
    private permissions = [EmitterAccess.CursorChange]
  ) {
    this.dom = new DOM(domAccessor);
    this.textInput = new TextInput();
    this.scroll = new Scroll();
    this.mouse = new Mouse();
    this.url = new Url();
  }

  dump() {
    return (
      this.permissions.includes(EmitterAccess.DOMChange) &&
      this.emitter.send(PageMessages.DOMChanged, {
        html: snapshot(document, {
          blockClass: "remoteSecured",
          maskAllInputs: false,
        })[0],
      })
    );
  }

  setPermissions(permissions: EmitterAccess[]) {
    this.permissions = permissions;
  }

  listen() {
    this.mouse.onMove((e) => {
      this.permissions.includes(EmitterAccess.CursorChange) &&
        this.emitter.send(PageMessages.CursorMoved, e);
    });

    this.mouse.onClick((e) => {
      this.permissions.includes(EmitterAccess.CursorClick) &&
        this.emitter.send(PageMessages.CursorClicked, e);
    });

    this.scroll.onChange((e) => {
      this.permissions.includes(EmitterAccess.ScrollChange) &&
        this.emitter.send(PageMessages.ScrollChanged, e);
    });

    this.dom.onChange((e) => {
      this.permissions.includes(EmitterAccess.DOMChange) &&
        this.emitter.send(PageMessages.DOMChanged, e);
    });

    this.textInput.onChange((e) => {
      this.permissions.includes(EmitterAccess.TextInputChange) &&
        this.emitter.send(PageMessages.TextInputChanged, e);
    });
  }

  handle(data: any) {
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

  close() {
    this.dom.close();
    this.textInput.close();
    this.scroll.close();
    this.mouse.close();
  }
}
