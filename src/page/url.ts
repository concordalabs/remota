export interface URLUpdate {
  url: string;
}

export default class Scroll {
  private closers: (() => void)[] = [];

  onChange(cb: (e: URLUpdate) => void): void {
    const onChange = () =>
      cb({
        url: document.location.href,
      });
    window.addEventListener("popstate", onChange);

    this.closers.push(() => {
      document.removeEventListener("popstate", onChange);
    });
  }

  refresh(url: URLUpdate): void {
    try {
      window.location.href = url.url;
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
