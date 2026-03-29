import type {
  PlannerBox,
  ProtocolTarget,
  ProtocolTolerance,
} from "@/features/planner/types/planner";

export function computeLiveFeedback(
  box: PlannerBox,
  target: ProtocolTarget,
  tolerances: ProtocolTolerance
): string[] {
  const hints: string[] = [];

  const dx = target.center.x - box.center.x;
  const dy = target.center.y - box.center.y;
  const dz = target.center.z - box.center.z;

  if (Math.abs(dx) > tolerances.center * 0.5) {
    hints.push(
      `Move box ${Math.abs(dx * 100).toFixed(0)}mm ${dx > 0 ? "right" : "left"}`
    );
  }
  if (Math.abs(dy) > tolerances.center * 0.5) {
    hints.push(
      `Move box ${Math.abs(dy * 100).toFixed(0)}mm ${dy > 0 ? "anterior" : "posterior"}`
    );
  }
  if (Math.abs(dz) > tolerances.center * 0.5) {
    hints.push(
      `Move box ${Math.abs(dz * 100).toFixed(0)}mm ${dz > 0 ? "superior" : "inferior"}`
    );
  }

  const avgSizeDiff =
    (Math.abs(target.size.x - box.size.x) +
      Math.abs(target.size.y - box.size.y) +
      Math.abs(target.size.z - box.size.z)) /
    3;

  if (avgSizeDiff > tolerances.size * 0.5) {
    const totalDiff =
      target.size.x - box.size.x + target.size.y - box.size.y + target.size.z - box.size.z;
    hints.push(totalDiff > 0 ? "Increase slice coverage" : "Decrease slice coverage");
  }

  const angleDiff = (a: number, b: number) => {
    const d = ((a - b) % 360 + 540) % 360 - 180;
    return Math.abs(d);
  };

  const avgAngleDiff =
    (angleDiff(box.rotation.rx, target.rotation.rx) +
      angleDiff(box.rotation.ry, target.rotation.ry) +
      angleDiff(box.rotation.rz, target.rotation.rz)) /
    3;

  if (avgAngleDiff > tolerances.rotation * 0.3) {
    hints.push("Adjust slice angulation");
  }

  if (hints.length === 0) {
    hints.push("Planning looks good");
  }

  return hints.slice(0, 3);
}
