## ParticleText React Component

This project contains a reusable `ParticleText` React component that renders text using animated particles on an HTML canvas.

### Features

- **Particle text**: Renders any text as a field of particles.
- **Mouse interaction**: Particles are pushed away from the mouse and smoothly return to their original positions.
- **Configurable props** for appearance and behavior.

### Props

- **`text`**: `string` – Text to render. Default: `"Particle"`.
- **`fontSize`**: `number` – Font size in pixels. Default: `160`.
- **`color`**: `string` – Particle color (any valid CSS color). Default: `"#ffffff"`.
- **`particleSize`**: `number` – Size of each particle in pixels. Default: `2`.
- **`density`**: `number` – Sampling step in pixels; lower values create more particles. Default: `4`.
- **`mouseForce`**: `number` – Strength of the mouse repulsion force. Default: `1200`.
- **`mouseRadius`**: `number` – Radius around the mouse in which particles are affected. Default: `100`.
- **`animationSpeed`**: `number` – Speed at which particles return to their origin (higher is faster). Default: `0.15`.

### Usage

Import and use the component inside your React application:

```tsx
import React from "react";
import { ParticleText } from "./src/ParticleText";

export function Hero() {
  return (
    <div
      style={{
        backgroundColor: "#000",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ParticleText
        text="Particle"
        fontSize={160}
        color="#ffffff"
        particleSize={2}
        density={4}
        mouseForce={1400}
        mouseRadius={120}
        animationSpeed={0.18}
      />
    </div>
  );
}
```

You can adjust the props to match the visual style and interaction you want, similar to particle text components like the WebGL example on Framer Marketplace.

