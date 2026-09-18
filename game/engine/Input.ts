import { InputState } from "../types";

const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);
const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
const CROUCH_KEYS = new Set(["ArrowDown", "KeyS"]);
const THROW_KEYS = new Set(["KeyX", "KeyF", "ShiftLeft", "ShiftRight"]);

export type TouchPart = "left" | "right" | "jump" | "crouch" | "throw";

export class InputController {
  state: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    crouch: false,
    throwPressed: false,
  };

  private jumpHeldLastFrame = false;
  private throwHeldLastFrame = false;

  private keyboardLeft = false;
  private keyboardRight = false;
  private keyboardJump = false;
  private keyboardCrouch = false;
  private keyboardThrow = false;

  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private touchCrouch = false;
  private touchThrow = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (LEFT_KEYS.has(e.code)) this.keyboardLeft = true;
    if (RIGHT_KEYS.has(e.code)) this.keyboardRight = true;
    if (JUMP_KEYS.has(e.code)) this.keyboardJump = true;
    if (CROUCH_KEYS.has(e.code)) this.keyboardCrouch = true;
    if (THROW_KEYS.has(e.code)) this.keyboardThrow = true;
    if (
      LEFT_KEYS.has(e.code) ||
      RIGHT_KEYS.has(e.code) ||
      JUMP_KEYS.has(e.code) ||
      CROUCH_KEYS.has(e.code) ||
      THROW_KEYS.has(e.code)
    ) {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (LEFT_KEYS.has(e.code)) this.keyboardLeft = false;
    if (RIGHT_KEYS.has(e.code)) this.keyboardRight = false;
    if (JUMP_KEYS.has(e.code)) this.keyboardJump = false;
    if (CROUCH_KEYS.has(e.code)) this.keyboardCrouch = false;
    if (THROW_KEYS.has(e.code)) this.keyboardThrow = false;
  };

  private onBlur = () => {
    this.keyboardLeft = false;
    this.keyboardRight = false;
    this.keyboardJump = false;
    this.keyboardCrouch = false;
    this.keyboardThrow = false;
  };

  attach() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  setTouch(part: TouchPart, pressed: boolean) {
    if (part === "left") this.touchLeft = pressed;
    if (part === "right") this.touchRight = pressed;
    if (part === "jump") this.touchJump = pressed;
    if (part === "crouch") this.touchCrouch = pressed;
    if (part === "throw") this.touchThrow = pressed;
  }

  /** Call once per frame to compute the merged, edge-triggered state. */
  update() {
    this.state.left = this.keyboardLeft || this.touchLeft;
    this.state.right = this.keyboardRight || this.touchRight;
    this.state.crouch = this.keyboardCrouch || this.touchCrouch;

    const jumpHeld = this.keyboardJump || this.touchJump;
    this.state.jump = jumpHeld;
    this.state.jumpPressed = jumpHeld && !this.jumpHeldLastFrame;
    this.jumpHeldLastFrame = jumpHeld;

    const throwHeld = this.keyboardThrow || this.touchThrow;
    this.state.throwPressed = throwHeld && !this.throwHeldLastFrame;
    this.throwHeldLastFrame = throwHeld;
  }
}
