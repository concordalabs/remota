import cssPath from "./css-path";
import throttle from "lodash/throttle";

export interface MouseClick {
  element: string;
  x: number;
  y: number;
}

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
    this.cursor = "#__remote-status-cursor";
  }

  onClick(cb: (e: MouseClick) => void): void {
    const onClick = (e: MouseEvent) => {
      const element = cssPath(e.target);
      if (element.includes("#__remote")) return;

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
