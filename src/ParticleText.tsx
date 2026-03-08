import React, { useEffect, useRef } from "react";

export type ParticleTextProps = {
  text?: string;
  fontSize?: number;
  color?: string;
  particleSize?: number;
  density?: number;
  mouseForce?: number;
  mouseRadius?: number;
  /**
   * Legacy spring speed prop. Prefer `returnSpeed`.
   */
  animationSpeed?: number;
  /**
   * How tightly particles orbit around their base positions.
   * Very small values keep the text readable while feeling alive.
   */
  idleMotionStrength?: number;
  /**
   * Speed of the idle motion oscillation.
   */
  idleMotionSpeed?: number;
  /**
   * Spring strength that pulls particles back towards their base positions.
   */
  returnSpeed?: number;
  /**
   * Maximum distance a particle can stray from its base position.
   */
  maxDisplacement?: number;
  /**
   * Scales how intense the turbulent motion is around the cursor.
   * Higher values produce more chaotic movement near the cursor.
   */
  chaosStrength?: number;
  /**
   * Fraction of the mouse radius that defines the inner high-chaos zone.
   * Value should generally stay in [0.2, 0.9].
   */
  innerChaosRadius?: number;
  /**
   * Optional padding around the rendered text inside the canvas.
   */
  padding?: number;
  /**
   * Optional className for the wrapping div.
   */
  className?: string;
  /**
   * Optional style for the wrapping div.
   */
  style?: React.CSSProperties;
};

type Particle = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  idlePhaseX: number;
  idlePhaseY: number;
};

type MouseState = {
  x: number | null;
  y: number | null;
};

const DEFAULTS: Required<
  Pick<
    ParticleTextProps,
    | "text"
    | "fontSize"
    | "color"
    | "particleSize"
    | "density"
    | "mouseForce"
    | "mouseRadius"
    | "animationSpeed"
    | "idleMotionStrength"
    | "idleMotionSpeed"
    | "returnSpeed"
    | "maxDisplacement"
    | "chaosStrength"
    | "innerChaosRadius"
    | "padding"
  >
> = {
  text: "Particle",
  fontSize: 40,
  color: "#ffffff",
  particleSize: 1.4,
  density: 4,
  mouseForce: 2400,
  mouseRadius: 120,
  animationSpeed: 0.16,
  idleMotionStrength: 2,
  idleMotionSpeed: 0.0022,
  returnSpeed: 0.16,
  maxDisplacement: 24,
   // Chaos tuning defaults.
  chaosStrength: 1,
  innerChaosRadius: 0.45,
  padding: 24,
};

export const ParticleText: React.FC<ParticleTextProps> = (props) => {
  const {
    text = DEFAULTS.text,
    fontSize = DEFAULTS.fontSize,
    color = DEFAULTS.color,
    particleSize = DEFAULTS.particleSize,
    density = DEFAULTS.density,
    mouseForce = DEFAULTS.mouseForce,
    mouseRadius = DEFAULTS.mouseRadius,
    animationSpeed,
    idleMotionStrength,
    idleMotionSpeed,
    returnSpeed,
    maxDisplacement,
    chaosStrength,
    innerChaosRadius,
    padding = DEFAULTS.padding,
    className,
    style,
  } = props;

  const resolvedReturnSpeed =
    returnSpeed ?? animationSpeed ?? DEFAULTS.returnSpeed;
  const resolvedIdleMotionStrength =
    idleMotionStrength ?? DEFAULTS.idleMotionStrength;
  const resolvedIdleMotionSpeed =
    idleMotionSpeed ?? DEFAULTS.idleMotionSpeed;
  const resolvedMaxDisplacement =
    maxDisplacement ?? DEFAULTS.maxDisplacement;
  const resolvedChaosStrength =
    chaosStrength ?? DEFAULTS.chaosStrength;
  const resolvedInnerChaosRadius =
    innerChaosRadius ?? DEFAULTS.innerChaosRadius;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sampleSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const containerSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const mouseRef = useRef<MouseState>({ x: null, y: null });
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Generate particles whenever text or layout props change.
  // Particle positions are in "sample space" (text bounds).
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;

    // Measure text with an offscreen canvas so we can size and center correctly.
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    // Set an initial font to measure the text width.
    offCtx.font = font;
    const metrics = offCtx.measureText(text);
    const textWidth = metrics.width;

    const sampleWidth = Math.ceil(textWidth + padding * 2);
    const sampleHeight = Math.ceil(fontSize + padding * 2);

    // Resize offscreen with final dimensions (resets context state).
    offscreen.width = sampleWidth;
    offscreen.height = sampleHeight;
    offCtx.font = font;
    offCtx.textBaseline = "middle";
    offCtx.textAlign = "center";
    offCtx.fillStyle = "#ffffff";

    const textX = sampleWidth / 2;
    const textY = sampleHeight / 2;
    offCtx.clearRect(0, 0, sampleWidth, sampleHeight);
    offCtx.fillText(text, textX, textY);

    // Sample only where the text pixels are drawn (alpha > threshold).
    const imageData = offCtx.getImageData(0, 0, sampleWidth, sampleHeight);
    const { data, width, height } = imageData;

    const particles: Particle[] = [];
    const step = Math.max(1, density);

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 32) {
          const px = x;
          const py = y;
          particles.push({
            x: px,
            y: py,
            originX: px,
            originY: py,
            vx: 0,
            vy: 0,
            idlePhaseX: Math.random() * Math.PI * 2,
            idlePhaseY: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    particlesRef.current = particles;
    sampleSizeRef.current = { width: sampleWidth, height: sampleHeight };

    return () => {
      particlesRef.current = [];
    };
  }, [text, fontSize, density, padding]);

  // Size canvas to match container and handle resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      containerSizeRef.current = { width: w, height: h };
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const friction = 0.84;
    const spring = resolvedReturnSpeed;

    // Mouse influence is fairly local but strong.
    const effectiveMouseRadius = mouseRadius * 0.9;
    // Global scaling that keeps interaction soft but clearly visible.
    const mouseForceScale = 0.0013;
    const chaoticMaxDispMultiplier = 2.8;

    const draw = () => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const { width: sampleWidth, height: sampleHeight } =
        sampleSizeRef.current;
      const { width: containerWidth, height: containerHeight } =
        containerSizeRef.current;

      if (
        containerWidth < 1 ||
        containerHeight < 1 ||
        sampleWidth < 1 ||
        sampleHeight < 1
      ) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, containerWidth || 1, containerHeight || 1);
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const scale =
      Math.min(
        containerWidth / sampleWidth,
        containerHeight / sampleHeight
      ) * 0.1;
      const translateX = (containerWidth - sampleWidth * scale) / 2;
      const translateY = (containerHeight - sampleHeight * scale) / 2;

      if (!Number.isFinite(scale) || scale <= 0) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Advance a simple time value for animated noise.
      timeRef.current += 16;
      const time = timeRef.current;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      ctx.translate(translateX, translateY);
      ctx.scale(scale, scale);

      if (!particles.length) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = color;

      const sampleMargin = 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Idle motion: each particle gently orbits around its base position.
        const idleRadius = resolvedIdleMotionStrength;
        const idleSpeed = resolvedIdleMotionSpeed;
        const idleX =
          Math.sin(time * idleSpeed + p.idlePhaseX) * idleRadius;
        const idleY =
          Math.cos(time * idleSpeed + p.idlePhaseY) * idleRadius;

        let localMaxDisplacement = resolvedMaxDisplacement;

        if (mouse.x != null && mouse.y != null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

          // Angular-based noise to warp the influence radius per particle,
          // so the disturbance boundary feels like an irregular blob instead
          // of a perfect circle.
          const angle = Math.atan2(dy, dx);
          const angularSeed = p.originX * 0.157 + p.originY * 0.193;
          const angularNoise = Math.sin(
            angle * 3 + angularSeed + time * 0.0008
          ); // [-1, 1]

          const radiusJitterFactor = 1 + angularNoise * 0.45;
          let warpedRadius =
            effectiveMouseRadius * radiusJitterFactor;
          const minRadius = effectiveMouseRadius * 0.6;
          const maxRadius = effectiveMouseRadius * 1.4;
          if (warpedRadius < minRadius) warpedRadius = minRadius;
          if (warpedRadius > maxRadius) warpedRadius = maxRadius;

          if (dist < warpedRadius) {
            // Smooth falloff within the warped radius, which now varies
            // per particle and angle to create an uneven field.
            const t = 1 - dist / warpedRadius;
            const influence = t * t * (3 - 2 * t); // smoothstep

            // Inner high-chaos zone inside the warped cursor area.
            const innerRadiusLocal =
              warpedRadius *
              (resolvedInnerChaosRadius *
                (1 + angularNoise * 0.35));
            const clampedInnerRadius = Math.max(
              warpedRadius * 0.15,
              Math.min(warpedRadius * 0.9, innerRadiusLocal)
            );
            const innerT =
              dist < clampedInnerRadius
                ? 1 - dist / clampedInnerRadius
                : 0;

            // Base outward (radial) direction.
            const nx = dx / dist;
            const ny = dy / dist;

            // Perpendicular direction for subtle swirling.
            const tx = -ny;
            const ty = nx;

            // Simple deterministic noise based on origin and time.
            const seed = p.originX * 12.9898 + p.originY * 78.233;
            let noise =
              Math.sin(seed + time * 0.0015) * 43758.5453;
            noise = noise - Math.floor(noise); // fract in [0, 1)

            const chaosBoost =
              (1 +
                2 * (1 - dist / warpedRadius) +
                3.5 * innerT) *
              resolvedChaosStrength;
            const swirlStrength =
              (noise - 0.5) * 1.4 * influence * chaosBoost;

            const jitterX = tx * swirlStrength;
            const jitterY = ty * swirlStrength;

            const forceMag =
              mouseForce * mouseForceScale * influence * chaosBoost;

            p.vx += (nx + jitterX) * forceMag;
            p.vy += (ny + jitterY) * forceMag;

            // Extra random kicks inside the inner chaos radius to make
            // motion feel unstable and energetic without affecting
            // particles outside this tight zone.
            if (innerT > 0) {
              const randomKickScale =
                0.18 * innerT * chaosBoost * resolvedChaosStrength;
              const kickAngle =
                Math.random() * Math.PI * 2;
              p.vx += Math.cos(kickAngle) * randomKickScale;
              p.vy += Math.sin(kickAngle) * randomKickScale;
            }

            // Allow particles very close to the cursor to travel farther
            // before being clamped, for a more dramatic local disruption.
            if (dist < warpedRadius * 0.6) {
              localMaxDisplacement =
                resolvedMaxDisplacement * chaoticMaxDispMultiplier;
            }
          }
        }

        // Spring towards the idle-offset base position.
        const targetX = p.originX + idleX;
        const targetY = p.originY + idleY;
        const toTargetX = targetX - p.x;
        const toTargetY = targetY - p.y;
        p.vx += toTargetX * spring;
        p.vy += toTargetY * spring;

        p.vx *= friction;
        p.vy *= friction;

        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;

        // Clamp how far a particle can travel from its base position
        // so the word remains readable and stable.
        const dxBase = p.x - p.originX;
        const dyBase = p.y - p.originY;
        const distBase = Math.sqrt(dxBase * dxBase + dyBase * dyBase);
        if (distBase > localMaxDisplacement) {
          const clamp = localMaxDisplacement / distBase;
          p.x = p.originX + dxBase * clamp;
          p.y = p.originY + dyBase * clamp;
        }

        if (
          p.x < -sampleMargin ||
          p.x > sampleWidth + sampleMargin ||
          p.y < -sampleMargin ||
          p.y > sampleHeight + sampleMargin
        ) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    color,
    mouseForce,
    mouseRadius,
    resolvedReturnSpeed,
    resolvedIdleMotionStrength,
    resolvedIdleMotionSpeed,
    resolvedMaxDisplacement,
    resolvedChaosStrength,
    resolvedInnerChaosRadius,
    particleSize,
  ]);

  // Mouse interaction handlers. Use same container size and transform as draw.
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { width: containerWidth, height: containerHeight } =
      containerSizeRef.current;
    const { width: sampleWidth, height: sampleHeight } =
      sampleSizeRef.current;

    if (
      containerWidth < 1 ||
      containerHeight < 1 ||
      sampleWidth < 1 ||
      sampleHeight < 1
    )
      return;

    const scale = Math.min(
      containerWidth / sampleWidth,
      containerHeight / sampleHeight
    );
    const translateX = (containerWidth - sampleWidth * scale) / 2;
    const translateY = (containerHeight - sampleHeight * scale) / 2;

    const displayW = rect.width;
    const displayH = rect.height;
    const mouseX =
      displayW > 0 ? ((event.clientX - rect.left) / displayW) * containerWidth : 0;
    const mouseY =
      displayH > 0 ? ((event.clientY - rect.top) / displayH) * containerHeight : 0;

    const x = (mouseX - translateX) / scale;
    const y = (mouseY - translateY) / scale;

    mouseRef.current = { x, y };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: null, y: null };
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: "block" }}
      />
    </div>
  );
};

