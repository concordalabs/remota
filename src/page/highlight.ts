import { debounce, throttle } from "./timers";
import EventEmitter from "eventemitter3";

// Imported from https://stackoverflow.com/questions/22891827/how-do-i-hand-draw-on-canvas-with-javascript

export type HighlightUpdate = {
  clickX: number[];
  clickY: number[];
  clickDrag: boolean[];
};

export class Highlighter {
  private clickX: number[] = [];
  private clickY: number[] = [];
  private clickDrag: boolean[] = [];
  private paint = false;
  private context: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement = {} as HTMLCanvasElement;
  private closers: (() => void)[] = [];
  private events = new EventEmitter();
  private registered = false;

  set enabled(s: boolean) {
    const el = document.querySelector<HTMLCanvasElement>("#__remote-highlight");
    if (!el) return;

    el.style.pointerEvents = s ? "auto" : "none";
  }

  public reset(): void {
    this.clear();
    this.clickX = [];
    this.clickY = [];
    this.clickDrag = [];
    this.paint = false;
    this.events.emit("highlight:update", { reset: true });
  }

  close(): void {
    this.events.removeAllListeners();
    while (this.closers.length > 0) {
      const closer = this.closers.shift();
      if (closer) closer();
    }
  }

  onHighlight(cb: (e: HighlightUpdate) => void): void {
    this.register();

    const onHighlight = throttle((e: HighlightUpdate) => {
      cb({
        clickX: e.clickX,
        clickY: e.clickY,
        clickDrag: e.clickDrag,
      });
    }, 100);

    this.events.on("highlight:update", onHighlight);
  }

  onReset(cb: () => void): void {
    this.register();

    const onReset = debounce(() => {
      this.reset();
      cb();
    }, 4000);

    this.events.on("highlight:reset", onReset);
  }

  update(e: HighlightUpdate): void {
    this.clickX =
      e.clickX && e.clickX.length ? [...this.clickX, ...e.clickX] : this.clickX;
    this.clickY =
      e.clickY && e.clickY.length ? [...this.clickY, ...e.clickY] : this.clickY;
    this.clickDrag =
      e.clickDrag && e.clickY.length
        ? [...this.clickDrag, ...e.clickDrag]
        : this.clickDrag;

    this.redraw();
  }

  updatePixelRatio(): void {
    const width = document.body.scrollWidth ?? window.innerWidth;
    const height = document.body.scrollHeight ?? window.innerHeight;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    const scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);

    this.context.scale(scale, scale);
    this.context.strokeStyle = "#ff0000";
    this.context.lineJoin = "round";
    this.context.lineWidth = 5;
    this.registered = true;
  }

  /**
   * Add information where the user clicked at.
   */
  private addClick(x: number, y: number, dragging: boolean): void {
    this.clickX.push(x);
    this.clickY.push(y);
    this.clickDrag.push(dragging);
  }

  /**
   * Redraw the complete canvas.
   */
  private redraw(): void {
    this.clear();

    for (let i = 0; i < this.clickX.length; i += 1) {
      if (!this.clickDrag[i] && i == 0) {
        this.context.beginPath();
        this.context.moveTo(this.clickX[i], this.clickY[i]);
        this.context.stroke();
      } else if (!this.clickDrag[i] && i > 0) {
        this.context.closePath();

        this.context.beginPath();
        this.context.moveTo(this.clickX[i], this.clickY[i]);
        this.context.stroke();
      } else {
        this.context.lineTo(this.clickX[i], this.clickY[i]);
        this.context.stroke();
      }
    }
  }

  private clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the newly added point.
   */
  private drawNew(): void {
    const i = this.clickX.length - 1;
    if (!this.clickDrag[i]) {
      if (this.clickX.length == 0) {
        this.context.beginPath();
        this.context.moveTo(this.clickX[i], this.clickY[i]);
        this.context.stroke();
      } else {
        this.context.closePath();

        this.context.beginPath();
        this.context.moveTo(this.clickX[i], this.clickY[i]);
        this.context.stroke();
      }
    } else {
      this.context.lineTo(this.clickX[i], this.clickY[i]);
      this.context.stroke();
    }
  }

  private mouseDownEventHandler(e: MouseEvent) {
    this.paint = true;
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    if (this.paint) {
      this.addClick(x, y, false);
      this.drawNew();
    }
    this.emitUpdate();
    this.emitReset();
  }

  private mouseUpEventHandler() {
    this.context.closePath();
    this.paint = false;
    this.emitUpdate();
  }

  private mouseMoveEventHandler(e: MouseEvent) {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;
    if (this.paint) {
      this.addClick(x, y, true);
      this.drawNew();
    }
    this.emitUpdate();
  }

  private emitUpdate() {
    this.events.emit("highlight:update", {
      clickX: this.clickX,
      clickY: this.clickY,
      clickDrag: this.clickDrag,
      reset: false,
    });
  }

  private emitReset() {
    this.events.emit("highlight:reset", null);
  }

  private register(): void {
    if (this.registered) return;

    const el = document.querySelector<HTMLCanvasElement>("#__remote-highlight");
    if (!el) return;

    const context = el?.getContext("2d");
    if (!context) return;

    this.canvas = el;
    this.context = context;

    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;

    const updatePixelRatio = () => this.updatePixelRatio();
    matchMedia(mqString).addEventListener("change", updatePixelRatio);
    this.closers.push(() =>
      matchMedia(mqString).removeEventListener("change", updatePixelRatio)
    );

    const mouseUpEventHandler = () => this.mouseUpEventHandler();
    this.canvas.addEventListener("mouseup", mouseUpEventHandler);
    this.closers.push(() =>
      this.canvas.removeEventListener("mouseup", mouseUpEventHandler)
    );

    const mouseMoveEventHandler = (e: MouseEvent) =>
      this.mouseMoveEventHandler(e);
    this.canvas.addEventListener("mousemove", mouseMoveEventHandler);
    this.closers.push(() =>
      this.canvas.removeEventListener("mousemove", mouseMoveEventHandler)
    );

    const mouseDownEventHandler = (e: MouseEvent) =>
      this.mouseDownEventHandler(e);
    this.canvas.addEventListener("mousedown", mouseDownEventHandler);
    this.closers.push(() =>
      this.canvas.removeEventListener("mousedown", mouseDownEventHandler)
    );

    this.updatePixelRatio();
  }
}
