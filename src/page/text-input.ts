// @ts-ignore
import cssPath from "./css-path";
import { debounce } from "./timers";

export interface TextInputUpdate {
  path: string;
  value: string;
}

export default class TextInput {
  private closers: (() => void)[] = [];

  onChange(cb: (e: TextInputUpdate) => void): void {
    // eslint-disable-next-line
    const onKeydown = debounce((e: any): void => {
      if (!e.srcElement.value) return;

      setTimeout(() => {
        const path = cssPath(e.srcElement);
        const element = document.querySelector(path);
        if (e.srcElement.classList.contains("remoteSecured")) {
          return cb({
            path,
            value: "****",
          });
        }

        return cb({
          path,
          value: element?.value || "",
        });
      }, 200);
    }, 1000);
    window.addEventListener("keydown", onKeydown);

    this.closers.push(() => {
      document.removeEventListener("keydown", onKeydown);
    });
  }

  update({ path, value }: TextInputUpdate): void {
    const element = document.querySelector(path);
    const valueSetter = Object?.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object?.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }

    element?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  close(): void {
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }
}
