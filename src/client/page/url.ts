export interface URLUpdate {
  url: string;
}

export default class Scroll {
  private closers: (() => void)[] = [];

  constructor() {}

  onChange(cb: (e: URLUpdate) => void) {
    const onChange = () =>
      cb({
        url: document.location.href,
      });
    window.addEventListener("popstate", onChange);

    this.closers.push(() => {
      document.removeEventListener("popstate", onChange);
    });
  }

  refresh(_: URLUpdate) {
    try {
      window.location.reload();
    } catch (error) {
      // usupported browser
    }
  }

  close() {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
