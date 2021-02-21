import { rebuild, snapshot } from "rrweb-snapshot";

interface DOMUpdate {
  html: any;
}

export default class DOM {
  private closers: (() => void)[] = [];

  onChange(cb: (e: DOMUpdate) => void) {
    const MutationObserver = window.MutationObserver;
    const obj = document.body?.parentElement;
    const callback = () => {
      cb({
        html: snapshot(document, {
          blockClass: "remoteSecured",
          maskAllInputs: false,
        })[0],
      });
    };

    if (!obj || obj.nodeType !== 1) return;

    // define a new observer
    const mutationObserver = new MutationObserver(callback);

    // have the observer observe foo for changes in children
    mutationObserver.observe(obj, { childList: true, subtree: true });
    return mutationObserver;
  }

  update({ html }: DOMUpdate) {
    const [node] = rebuild(html, {
      doc: document.implementation.createHTMLDocument("x"),
    });
    // @ts-ignore
    document.body.parentElement.innerHTML = node.body.parentElement.outerHTML;
  }

  close() {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
