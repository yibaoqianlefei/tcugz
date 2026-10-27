/**
 * 🗜️ Local glTF decoder paths.
 *
 * `@react-three/drei`'s `useGLTF(path, useDraco)` defaults the Draco decoder to
 * `https://www.gstatic.com/...`, i.e. an external CDN. Model loading must not
 * depend on a network path that may be blocked or rate-limited, so the decoder
 * that ships with `three` is copied into `public/draco/` and referenced through
 * the Vite base URL (works on GitHub Pages under a sub-path too).
 *
 * The decoder is fetched only when a Draco-compressed model is actually loaded,
 * so uncompressed models pay nothing.
 */
export const DRACO_DECODER_PATH = `${import.meta.env.BASE_URL}draco/`;
