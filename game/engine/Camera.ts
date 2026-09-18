import { VIEW_HEIGHT, VIEW_WIDTH } from "./constants";

export class Camera {
  x = 0;
  y = 0;

  follow(targetX: number, targetY: number, worldWidth: number, worldHeight: number) {
    const desiredX = targetX - VIEW_WIDTH / 2;
    this.x = Math.max(0, Math.min(desiredX, Math.max(0, worldWidth - VIEW_WIDTH)));

    const desiredY = targetY - VIEW_HEIGHT / 2;
    this.y = Math.max(
      0,
      Math.min(desiredY, Math.max(0, worldHeight - VIEW_HEIGHT))
    );
  }
}
