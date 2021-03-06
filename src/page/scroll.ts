import { throttle } from "./timers";

export interface ScrollUpdate {
  scrollX: number;
  scrollY: number;
}

export default class Scroll {
  private closers: (() => void)[] = [];

  onChange(cb: (e: ScrollUpdate) => void): void {
    const onScroll = throttle(() => {
      cb({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });
    }, 300);

    document.addEventListener("scroll", onScroll);

    this.closers.push(() => {
      document.removeEventListener("scroll", onScroll);
    });
  }

  update({ scrollX, scrollY }: ScrollUpdate): void {
    try {
      window.scroll({
        left: scrollX,
        top: scrollY,
        behavior: "smooth",
      });
    } catch (error) {
      // usupported browser
    }
  }

  close(): void {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
