import cssPath from "./css-path";
import throttle from "lodash/throttle";

export interface MouseClick {
  element: string;
  x: number;
  y: number;
}

const toCSS = (obj: { [k: string]: number | string }): string => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(";");
};

// const clickFromPoint = (x: number, y: number) => {
//   const evt = new MouseEvent("click", {
//     view: window,
//     bubbles: true,
//     cancelable: true,
//     clientX: x,
//     clientY: y,
//   });
//   const el = document.elementFromPoint(x, y);
//   el?.dispatchEvent(evt);
// };

export interface MouseUpdate {
  cursorX: number;
  cursorY: number;
}

export default class Mouse {
  private cursor: string;
  private closers: (() => void)[] = [];

  constructor() {
    this.cursor = this.getCursor();
  }

  getCursor(): string {
    const node = document.createElement("div");
    node.innerHTML =
      '<svg id="share-remote-cursor" class="remoteSecured" xmlns="http://www.w3.org/2000/svg" transform="scale (-1, 1)" transform-origin="center" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path fill="currentColor" d="M18.75 3.94L4.07 10.08c-.83.35-.81 1.53.02 1.85L9.43 14c.26.1.47.31.57.57l2.06 5.33c.32.84 1.51.86 1.86.03l6.15-14.67c.33-.83-.5-1.66-1.32-1.32z"/></svg>';
    document?.querySelector("body")?.appendChild(node);

    const cursor = document.querySelector("#share-remote-cursor");
    if (!cursor) throw new Error("Cursor could not start");

    cursor.setAttribute(
      "style",
      toCSS({
        "z-index": 999,
        position: "absolute",
        left: "-32px",
        top: "-32px",
        width: "32px",
        height: "32px",
        color: "#52c41a",
      })
    );
    return "#share-remote-cursor";
  }

  onClick(cb: (e: MouseClick) => void): void {
    const onClick = (e: MouseEvent) => {
      const element = cssPath(e.target);
      if (element.includes("#remote-status")) return;

      cb({
        element: cssPath(e.target),
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener("click", onClick);

    this.closers.push(() => {
      document.removeEventListener("click", onClick);
    });
  }

  click({ element }: MouseClick): void {
    const evt = new MouseEvent("click", {
      bubbles: true,
      view: window,
    });
    const el = document.querySelector<HTMLElement>(element);
    el?.dispatchEvent(evt);
  }

  onMove(cb: (e: MouseUpdate) => void): void {
    const onMouseMove = throttle((e) => {
      const { pageX, pageY } = e;
      cb({
        cursorX: pageX,
        cursorY: pageY,
      });
    }, 100);

    document.addEventListener("mousemove", onMouseMove);

    this.closers.push(() => {
      document.removeEventListener("mousemove", onMouseMove);
    });
  }

  update({ cursorX, cursorY }: MouseUpdate): void {
    const cursor = document.querySelector<HTMLElement>(this.cursor);
    if (!cursor) return;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";
  }

  close(): void {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
