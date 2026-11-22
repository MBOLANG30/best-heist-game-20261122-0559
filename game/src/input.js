// input.js — keyboard + mouse, kept apart from the game rules.
// Tracks held keys, edge-triggered presses, and the last mouse click in canvas
// coordinates (the canvas is letterboxed to the window, so clicks are scaled).
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered: consumed by the game each frame
    this.click = null; // {x, y} in canvas coordinates, consumed by the game
    this.mouse = { x: 0, y: 0 };
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); });
    canvas.addEventListener('mousemove', (e) => {
      const p = this.toCanvas(e.clientX, e.clientY);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      const p = this.toCanvas(e.clientX, e.clientY);
      this.click = { x: p.x, y: p.y, button: e.button };
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  toCanvas(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (this.canvas.width / r.width),
      y: (clientY - r.top) * (this.canvas.height / r.height),
    };
  }

  held(...names) { return names.some((n) => this.keys.has(n)); }
  wasPressed(...names) { return names.some((n) => this.pressed.has(n)); }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('a', 'arrowleft')) x -= 1;
    if (this.held('d', 'arrowright')) x += 1;
    if (this.held('w', 'arrowup')) y -= 1;
    if (this.held('s', 'arrowdown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  get sneaking() { return this.held('shift'); }
  get interactHeld() { return this.held('e'); }

  endFrame() {
    this.pressed.clear();
    this.click = null;
  }
}
