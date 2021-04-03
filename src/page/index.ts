import DOM from "./dom";
import TextInput from "./text-input";
import Scroll from "./scroll";
import Mouse from "./mouse";
import Url from "./url";
import { Highlighter } from "./highlight";
import { Permission } from "../access";
import { Socket, PageMessages } from "../socket";

export type Config = {
  selector?: string;
  maskAllInputs?: boolean;
};

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
  private highlighter: Highlighter;
  private permissions: Permission[];

  constructor(private emitter: Socket, config?: Config) {
    this.dom = new DOM(config?.selector, config?.maskAllInputs);
    this.textInput = new TextInput();
    this.scroll = new Scroll();
    this.mouse = new Mouse();
    this.url = new Url();
    this.highlighter = new Highlighter();
    this.permissions = [];
  }

  dump(): void {
    this.permissions.includes(Permission.EmitDOMChange) &&
      this.emitter.send(PageMessages.DOMChanged, {
        html: this.dom.dump(),
        width: window.innerWidth,
        height: window.innerHeight,
      });
  }

  setPermissions(permissions: Permission[]): void {
    this.permissions = permissions;
    this.highlighter.enabled = permissions.includes(
      Permission.EmitHighlightChange
    );
  }

  listen(): void {
    this.mouse.onMove((e): void => {
      this.permissions.includes(Permission.EmitCursorChange) &&
        this.emitter.send(PageMessages.CursorMoved, e);
    });

    this.mouse.onClick((e): void => {
      this.permissions.includes(Permission.EmitCursorClick) &&
        this.emitter.send(PageMessages.CursorClicked, e);
    });

    this.scroll.onChange((e): void => {
      this.permissions.includes(Permission.EmitScrollChange) &&
        this.emitter.send(PageMessages.ScrollChanged, e);
    });

    this.dom.onChange((e): void => {
      this.permissions.includes(Permission.EmitDOMChange) &&
        this.emitter.send(PageMessages.DOMChanged, e);
    });

    this.textInput.onChange((e): void => {
      this.permissions.includes(Permission.EmitTextInputChange) &&
        this.emitter.send(PageMessages.TextInputChanged, e);
    });

    this.highlighter.onHighlight((e): void => {
      this.permissions.includes(Permission.EmitHighlightChange) &&
        this.emitter.send(PageMessages.HighlightChanged, e);
    });

    this.highlighter.onReset((): void => {
      this.permissions.includes(Permission.EmitHighlightChange) &&
        this.emitter.send(PageMessages.HighlightReset, null);
    });
  }

  // eslint-disable-next-line
  handle(data: any): void {
    const { type, payload, upstream } = data;
    if (upstream) return; // FIXME: there must be a better way than this

    switch (type) {
      case PageMessages.HighlightReset:
        return this.highlighter.reset();
      case PageMessages.HighlightChanged:
        return this.highlighter.update(payload);
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
        this.dom.update({
          ...payload,
        });
        this.highlighter.updatePixelRatio();
        return;
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
    this.highlighter.close();
  }
}
