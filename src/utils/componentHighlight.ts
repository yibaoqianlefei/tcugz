import { Color, type Material } from 'three';

export type ComponentHighlightMode = 'clear' | 'hover' | 'selected';

/** Apply after restoring the material's authored colors. Shared by node and lesson viewers. */
export function applyComponentHighlight(material: Material, mode: ComponentHighlightMode) {
  if (mode === 'clear') return;
  if ('emissive' in material && material.emissive instanceof Color && 'emissiveIntensity' in material) {
    material.emissive.set(mode === 'selected' ? '#d4a843' : '#ffffff');
    material.emissiveIntensity = mode === 'selected' ? 1.15 : 1.25;
  } else if ('color' in material && material.color instanceof Color) {
    material.color.lerp(new Color(mode === 'selected' ? '#d4a843' : '#8fd8ff'), mode === 'selected' ? .55 : .35);
  }
  material.needsUpdate = true;
}
