// Polyfill DOMMatrix for Cloudflare Workers (required by pdfjs-dist)
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true; isIdentity = true;
    constructor() {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    rotateFromVector() { return this; }
    flipX() { return this; }
    flipY() { return this; }
    skewX() { return this; }
    skewY() { return this; }
    invert() { return this; }
    setMatrixValue() { return this; }
    transformPoint() { return { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array(16).fill(0); }
    toFloat64Array() { return new Float64Array(16).fill(0); }
  };
}
