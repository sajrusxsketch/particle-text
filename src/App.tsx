import React, { useState } from "react";
import { ParticleText } from "./ParticleText";

export const App: React.FC = () => {
  const [text, setText] = useState("Particle");
  const [particleSize, setParticleSize] = useState(1.4);
  const [density, setDensity] = useState(4);
  const [mouseForce, setMouseForce] = useState(2400);
  const [mouseRadius, setMouseRadius] = useState(120);
  const [idleMotionStrength, setIdleMotionStrength] = useState(2);
  const [idleMotionSpeed, setIdleMotionSpeed] = useState(0.0022);
  const [chaosStrength, setChaosStrength] = useState(1);
  const [innerChaosRadius, setInnerChaosRadius] = useState(0.45);
  const [returnSpeed, setReturnSpeed] = useState(0.16);
  const [maxDisplacement, setMaxDisplacement] = useState(24);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: "#111",
          color: "#f5f5f5",
          borderBottom: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, opacity: 0.9 }}>Particle Text</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            Live controls
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #333",
                backgroundColor: "#181818",
                color: "#f5f5f5",
                fontSize: 13,
              }}
            />
          </div>

          {[
            {
              label: "Particle Size",
              min: 0.6,
              max: 3,
              step: 0.1,
              value: particleSize,
              onChange: (v: number) => setParticleSize(v),
            },
            {
              label: "Density (lower = more)",
              min: 2,
              max: 10,
              step: 1,
              value: density,
              onChange: (v: number) => setDensity(v),
            },
            {
              label: "Mouse Force",
              min: 400,
              max: 4000,
              step: 50,
              value: mouseForce,
              onChange: (v: number) => setMouseForce(v),
            },
            {
              label: "Mouse Radius",
              min: 40,
              max: 220,
              step: 5,
              value: mouseRadius,
              onChange: (v: number) => setMouseRadius(v),
            },
            {
              label: "Idle Motion Strength",
              min: 0,
              max: 6,
              step: 0.1,
              value: idleMotionStrength,
              onChange: (v: number) => setIdleMotionStrength(v),
            },
            {
              label: "Idle Motion Speed",
              min: 0.0005,
              max: 0.006,
              step: 0.0001,
              value: idleMotionSpeed,
              onChange: (v: number) => setIdleMotionSpeed(v),
            },
            {
              label: "Chaos Strength",
              min: 0,
              max: 3,
              step: 0.05,
              value: chaosStrength,
              onChange: (v: number) => setChaosStrength(v),
            },
            {
              label: "Inner Chaos Radius (fraction)",
              min: 0.2,
              max: 0.9,
              step: 0.01,
              value: innerChaosRadius,
              onChange: (v: number) => setInnerChaosRadius(v),
            },
            {
              label: "Return Speed",
              min: 0.02,
              max: 0.4,
              step: 0.01,
              value: returnSpeed,
              onChange: (v: number) => setReturnSpeed(v),
            },
            {
              label: "Max Displacement",
              min: 8,
              max: 80,
              step: 1,
              value: maxDisplacement,
              onChange: (v: number) => setMaxDisplacement(v),
            },
          ].map((control) => (
            <div
              key={control.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <label style={{ fontSize: 12, opacity: 0.8 }}>
                {control.label}
              </label>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(e) =>
                  control.onChange(parseFloat(e.target.value))
                }
              />
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  alignSelf: "flex-end",
                }}
              >
                {control.value.toFixed(3).replace(/\.?0+$/, "")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 24,
        }}
      >
        <ParticleText
          text={text}
          fontSize={180}
          color="#ffffff"
          particleSize={particleSize}
          density={density}
          mouseForce={mouseForce}
          mouseRadius={mouseRadius}
          idleMotionStrength={idleMotionStrength}
          idleMotionSpeed={idleMotionSpeed}
          chaosStrength={chaosStrength}
          innerChaosRadius={innerChaosRadius}
          returnSpeed={returnSpeed}
          maxDisplacement={maxDisplacement}
        />
      </div>
    </div>
  );
};

