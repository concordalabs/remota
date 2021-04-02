import { rebuild, snapshot } from "rrweb-snapshot";

interface DOMUpdate {
  // eslint-disable-next-line
  html: any;
}

export default class DOM {
  private closers: (() => void)[] = [];

  constructor(private accessor: string) {}

  onChange(cb: (e: DOMUpdate) => void): MutationObserver {
    const MutationObserver = window.MutationObserver;
    const obj = document.querySelector(this.accessor)?.parentElement;
    const callback = () => {
      cb({ html: this.dump() });
    };

    if (!obj || obj.nodeType !== 1) throw new Error("Object not accessible");

    // define a new observer
    const mutationObserver = new MutationObserver(callback);

    // have the observer observe foo for changes in children
    mutationObserver.observe(obj, { childList: true, subtree: true });
    return mutationObserver;
  }

  update({ html }: DOMUpdate): void {
    const [node] = rebuild(html, {
      doc: document.implementation.createHTMLDocument("x"),
    });

    const el = document.querySelector(this.accessor);
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
  }

  close(): void {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }

  dump() {
    return snapshot(document, {
      blockClass: "remoteSecured",
      maskAllInputs: false,
      slimDOM: true,
    })[0];
  }
}
