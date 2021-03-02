import DOM from "./dom";
import TextInput from "./text-input";
import Scroll from "./scroll";
import Mouse from "./mouse";
import Url from "./url";
import { snapshot } from "rrweb-snapshot";
import { EmitterAccess } from "../access";

export enum ProxyMessages {
  PageDOMChanged = 1,
  PageDOMRequested,
  PageCursorMoved,
  PageCursorClicked,
  PageScrollChanged,
  PageTextInputChanged,
  PageUrlChanged,
  PagePermissionsChanged,
}

export interface Proxy {
  send(type: ProxyMessages, payload: any): void;
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
      this.emitter.send(ProxyMessages.PageDOMChanged, {
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
        this.emitter.send(ProxyMessages.PageCursorMoved, e);
    });

    this.mouse.onClick((e) => {
      this.permissions.includes(EmitterAccess.CursorClick) &&
        this.emitter.send(ProxyMessages.PageCursorClicked, e);
    });

    this.scroll.onChange((e) => {
      this.permissions.includes(EmitterAccess.ScrollChange) &&
        this.emitter.send(ProxyMessages.PageScrollChanged, e);
    });

    this.dom.onChange((e) => {
      this.permissions.includes(EmitterAccess.DOMChange) &&
        this.emitter.send(ProxyMessages.PageDOMChanged, e);
    });

    this.textInput.onChange((e) => {
      this.permissions.includes(EmitterAccess.TextInputChange) &&
        this.emitter.send(ProxyMessages.PageTextInputChanged, e);
    });
  }

  handle(data: any) {
    const { type, payload, upstream } = data;
    if (upstream) return; // FIXME: there must be a better way than this

    switch (type) {
      case ProxyMessages.PageScrollChanged:
        return this.scroll.update(payload);
      case ProxyMessages.PageCursorMoved:
        return this.mouse.update(payload);
      case ProxyMessages.PageCursorClicked:
        return this.mouse.click(payload);
      case ProxyMessages.PageTextInputChanged:
        return this.textInput.update(payload);
      case ProxyMessages.PageUrlChanged:
        return this.url.refresh(payload);
      case ProxyMessages.PageDOMChanged:
        return this.dom.update({
          ...payload,
        });
      case ProxyMessages.PageDOMRequested:
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
