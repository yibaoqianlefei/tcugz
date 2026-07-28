/**
 * Phase 6 Step 3 — CameraLockControls (Canvas-external UI).
 *
 * Renders a "locking" button in the toolbar.  Only operates on
 * Zustand store state — never touches THREE, material, or renderer.
 *
 * States:
 *  - No object selected  → disabled
 *  - Selected, not locked → "锁定构件" (enabled)
 *  - Same object locked    → "取消锁定" (active)
 */

import { useNodeStore } from "../../store/nodeStore";
import { Crosshair } from "lucide-react";

export default function CameraLockControls() {
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const cameraLockEnabled = useNodeStore((s) => s.cameraLockEnabled);
  const cameraLockTargetKey = useNodeStore((s) => s.cameraLockTargetKey);
  const lockCameraToObject = useNodeStore((s) => s.lockCameraToObject);
  const unlockCamera = useNodeStore((s) => s.unlockCamera);

  const isLockedToCurrent =
    cameraLockEnabled &&
    cameraLockTargetKey != null &&
    selectedObject != null &&
    cameraLockTargetKey === selectedObject;

  const canLock = selectedObject != null;

  const handleClick = () => {
    if (isLockedToCurrent) {
      unlockCamera();
    } else if (canLock) {
      lockCameraToObject(selectedObject);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canLock}
      aria-pressed={isLockedToCurrent}
      aria-label={isLockedToCurrent ? "取消锁定" : "锁定构件"}
      title={
        !canLock
          ? "请先选择构件"
          : isLockedToCurrent
            ? "取消锁定"
            : "锁定构件"
      }
      className={[
        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center",
        "transition-all duration-200 relative shrink-0",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        isLockedToCurrent
          ? "bg-primary/10 text-primary border border-primary/30"
          : "text-muted-soft hover:text-primary hover:bg-hairline border border-transparent",
      ].join(" ")}
    >
      <Crosshair size={14} className="sm:size-[16px]" strokeWidth={1.5} />
    </button>
  );
}
