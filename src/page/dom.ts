import { rebuild, snapshot, serializedNodeWithId } from "rrweb-snapshot";

interface DOMUpdate {
  // eslint-disable-next-line
  html: any;
  width: number;
  height: number;
}

export default class DOM {
  private closers: (() => void)[] = [];
  private offset: number;

  constructor(
    private accessor: string = "body",
    private maskAllInputs: boolean = false
  ) {
    this.offset = window.outerHeight - window.innerHeight;
  }

  onChange(cb: (e: DOMUpdate) => void): MutationObserver {
    const MutationObserver = window.MutationObserver;
    const obj = document.querySelector(this.accessor)?.parentElement;
    const callback = () => {
      cb({
        html: this.dump(),
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (!obj || obj.nodeType !== 1) throw new Error("Object not accessible");

    // define a new observer
    const mutationObserver = new MutationObserver(callback);

    // have the observer observe foo for changes in children
    mutationObserver.observe(obj, { childList: true, subtree: true });
    return mutationObserver;
  }

  update({ html, width, height }: DOMUpdate): void {
    const [node] = rebuild(html, {
      doc: document.implementation.createHTMLDocument("x"),
    });

    const el = document.querySelector<HTMLElement>(this.accessor);
    if (!el) return;
    // @ts-ignore
    el.innerHTML = node.body.parentElement.outerHTML;

    // Disable href's
    const elems = document.getElementsByTagName("*");
    for (let i = 0; i < elems.length; i++) {
      const item = elems.item(i);
      if (!item) continue;

      if (item.tagName.toLowerCase() === "a") {
        // @ts-ignore
        item.href = "#";
      }
    }

    this.resize(width, height);
  }

  private resize(width: number, height: number): void {
    if (window.name !== "remota") return;
    if (window.innerWidth === width && window.innerHeight === height) return;

    const el = document.querySelector<HTMLElement>(this.accessor);
    if (window.screen.availWidth < width && el) {
      const factor = width / window.screen.availWidth;
      window.resizeTo(width * factor, height * factor + this.offset);
      el.style.zoom = `${factor}`;
      return;
    }

    window.resizeTo(width, height + this.offset);
  }

  close(): void {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }

  dump(): serializedNodeWithId | null {
    return snapshot(document, {
      blockClass: "remoteSecured",
      maskAllInputs: this.maskAllInputs,
    })[0];
  }
}
