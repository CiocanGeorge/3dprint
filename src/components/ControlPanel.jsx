import React, { useState } from "react";
import { FONTS } from "../utils/SceneManager";
import styles from "./ControlPanel.module.css";

// ─── Primitives ───────────────────────────────────────────────────────────────

function TextInput({ label, value, onChange, maxLength, placeholder }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        spellCheck={false}
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.selectWrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.selectArrow}>›</span>
      </div>
    </label>
  );
}

const AXIS_COLOR = { X: "#e05555", Y: "#55c355", Z: "#5588e0" };

function SliderInput({ label, value, onChange, min, max, step, unit, axis }) {
  const color = AXIS_COLOR[axis] || "var(--accent)";
  const pct = `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`;
  const display =
    typeof value === "number"
      ? step < 1
        ? value.toFixed(2)
        : value.toFixed(0)
      : value;

  return (
    <label className={styles.field}>
      <div className={styles.labelRow}>
        <span className={styles.label}>
          {axis && (
            <span className={styles.axisTag} style={{ color }}>
              {axis}
            </span>
          )}
          {label}
        </span>
        <span className={styles.value} style={{ color }}>
          {display}
          <span className={styles.unit}>{unit}</span>
        </span>
      </div>
      <div className={styles.sliderWrapper}>
        <input
          className={styles.slider}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div
          className={styles.sliderFill}
          style={{ width: pct, background: color }}
        />
      </div>
    </label>
  );
}

function Section({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <button
        className={styles.sectionHeader}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span
          className={styles.chevron}
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

function XYZ({
  prefix,
  params,
  onChange,
  xProps,
  yProps,
  zProps,
  lx = "Width",
  ly = "Height",
  lz = "Depth",
}) {
  const set = (k) => (v) => onChange({ ...params, [k]: v });
  return (
    <>
      <SliderInput
        axis="X"
        label={` ${lx}`}
        value={params[`${prefix}X`]}
        onChange={set(`${prefix}X`)}
        {...xProps}
      />
      <SliderInput
        axis="Y"
        label={` ${ly}`}
        value={params[`${prefix}Y`]}
        onChange={set(`${prefix}Y`)}
        {...yProps}
      />
      <SliderInput
        axis="Z"
        label={` ${lz}`}
        value={params[`${prefix}Z`]}
        onChange={set(`${prefix}Z`)}
        {...zProps}
      />
    </>
  );
}

// ─── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel({ onExport }) {
  return (
    <div className={styles.exportPanel}>
      <div className={styles.exportTitle}>EXPORT</div>

      <button
        className={`${styles.exportBtn} ${styles.exportCombined}`}
        onClick={() => onExport("combined")}
      >
        <DownloadIcon /> Export Combined STL
      </button>
      <p className={styles.exportDesc}>Literă + nume într-un singur fișier</p>

      <button
        className={`${styles.exportBtn} ${styles.exportSeparate}`}
        onClick={() => onExport("letter_with_slot")}
      >
        <DownloadIcon /> Export Separat (3 fișiere)
      </button>
      <div className={styles.exportDesc}>
        <Tag>monogram_litera.stl</Tag> litera simplă
        <br />
        <Tag>monogram_slot_negative.stl</Tag> locașul (Negative volume în
        slicer)
        <br />
        <Tag>monogram_nume.stl</Tag> numele pentru press-fit
      </div>
    </div>
  );
}

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path
      d="M7 1v8M4 6l3 3 3-3M2 11h10"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Tag = ({ children }) => (
  <span className={styles.fileTag}>{children}</span>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ControlPanel({ params, onChange, onExport }) {
  const set = (k) => (v) => onChange({ ...params, [k]: v });

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.logoMark}>M</span>
        <div>
          <div className={styles.logoTitle}>Monogram Studio</div>
          <div className={styles.logoSub}>3D Customizer</div>
        </div>
      </div>

      <div className={styles.scrollable}>
        <Section label="IDENTITATE">
          <TextInput
            label="Nume complet"
            value={params.fullName}
            onChange={set("fullName")}
            maxLength={24}
            placeholder="Numele tău"
          />
          <div className={styles.field}>
            <label className={styles.label}>Culoare nume</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={params.nameColor}
                onChange={(e) =>
                  onChange({ ...params, nameColor: e.target.value })
                }
                className={styles.colorPicker}
              />
              <span className={styles.colorHex}>{params.nameColor}</span>
            </div>
          </div>
          <TextInput
            label="Literă monogramă"
            value={params.monogramLetter}
            onChange={(v) => set("monogramLetter")(v.slice(-1))}
            maxLength={1}
            placeholder="A"
          />
          <div className={styles.field}>
            <label className={styles.label}>Culoare literă</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={params.monogramColor}
                onChange={(e) =>
                  onChange({ ...params, monogramColor: e.target.value })
                }
                className={styles.colorPicker}
              />
              <span className={styles.colorHex}>{params.monogramColor}</span>
            </div>
          </div>
        </Section>

        <Section label="FONT MONOGRAMĂ">
          <SelectInput
            label="Font literă"
            value={params.monogramFontId}
            onChange={set("monogramFontId")}
            options={FONTS.monogram}
          />
        </Section>

        <Section label="FONT NUME">
          <SelectInput
            label="Font nume"
            value={params.nameFontId}
            onChange={set("nameFontId")}
            options={FONTS.name}
          />
          <SliderInput
            label=" Spațiere litere"
            value={params.letterSpacing}
            onChange={set("letterSpacing")}
            min={-8}
            max={4}
            step={0.5}
            unit=" mm"
          />
        </Section>

        <Section label="MONOGRAMĂ — SCALE">
          <SliderInput
            label=" Font size"
            value={params.monogramSize}
            onChange={set("monogramSize")}
            min={10}
            max={80}
            step={1}
            unit=" mm"
          />
          <XYZ
            prefix="monoScale"
            params={params}
            onChange={onChange}
            xProps={{ min: 0.1, max: 3.0, step: 0.05, unit: "×" }}
            yProps={{ min: 0.1, max: 3.0, step: 0.05, unit: "×" }}
            zProps={{ min: 0.01, max: 1.0, step: 0.01, unit: "×" }}
          />
        </Section>

        <Section label="NUME — SCALE">
          <SliderInput
            label=" Font size"
            value={params.nameSize}
            onChange={set("nameSize")}
            min={3}
            max={24}
            step={0.5}
            unit=" mm"
          />
          <XYZ
            prefix="nameScale"
            params={params}
            onChange={onChange}
            xProps={{ min: 0.1, max: 3.0, step: 0.05, unit: "×" }}
            yProps={{ min: 0.1, max: 3.0, step: 0.05, unit: "×" }}
            zProps={{ min: 0.01, max: 1.0, step: 0.01, unit: "×" }}
          />
        </Section>

        <Section label="NUME — POZIȚIE" defaultOpen={false}>
          <XYZ
            prefix="nameOffset"
            params={params}
            onChange={onChange}
            lx="Stânga / Dreapta"
            ly="Jos / Sus"
            lz="Spate / Față"
            xProps={{ min: -50, max: 50, step: 0.5, unit: " mm" }}
            yProps={{ min: -50, max: 50, step: 0.5, unit: " mm" }}
            zProps={{ min: -20, max: 20, step: 0.5, unit: " mm" }}
          />
        </Section>
      </div>

      <ExportPanel onExport={onExport} />
    </aside>
  );
}
