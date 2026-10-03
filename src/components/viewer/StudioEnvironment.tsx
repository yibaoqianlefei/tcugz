import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Local reflection lighting for GLTF metals; leaves authored materials and background intact. */
export default function StudioEnvironment() {
  const { gl, scene, invalidate } = useThree();

  /* eslint-disable react-hooks/immutability -- Three.js scene lighting is configured imperatively. */
  useLayoutEffect(() => {
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    let environment;
    try {
      environment = generator.fromScene(room, 0.04);
    } finally {
      room.dispose();
      generator.dispose();
    }
    // Bake once per Canvas, rather than rebuilding on resize, orbit or selection.
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.8;
    invalidate();

    return () => {
      if (scene.environment === environment.texture) {
        scene.environment = previousEnvironment;
        scene.environmentIntensity = previousIntensity;
      }
      environment.dispose();
      invalidate();
    };
  }, [gl, scene, invalidate]);
  /* eslint-enable react-hooks/immutability */

  return null;
}
