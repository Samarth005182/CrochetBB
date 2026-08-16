import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Layers,
  Sparkles,
  Sliders,
  Code2,
  Play,
  RotateCcw,
  Eye,
  Zap,
  Check,
  Copy,
  ChevronDown,
  Info,
  Activity,
  Maximize2
} from 'lucide-react';

/**
 * ==============================================================================
 * LAX.JS PARALLAX ENGINE (Types & Core Parser)
 * Lightweight (~2.5KB), zero-dependency, declarative scroll-driven animation parser
 * Supports syntax: "property scroll1 val1 | scroll2 val2 [| scroll3 val3...]"
 * e.g., 'translateY 0 200 | opacity 1 0' or 'rotate 0 0 | 500 360 | scale 0 0.8 | 300 1.2'
 * ==============================================================================
 */

export interface KeyframePoint {
  scroll: number;
  value: number;
}

export interface LaxPropertyRule {
  property: string;
  cssVar: string;
  unit: string;
  points: KeyframePoint[];
}

export interface ParsedLaxElement {
  id: string;
  rawString: string;
  rules: LaxPropertyRule[];
}

// Property mappings and units
const PROPERTY_CONFIG: Record<
  string,
  { cssVar: string; unit: string; defaultValue: number }
> = {
  translateY: { cssVar: '--lax-y', unit: 'px', defaultValue: 0 },
  translateX: { cssVar: '--lax-x', unit: 'px', defaultValue: 0 },
  translateZ: { cssVar: '--lax-z', unit: 'px', defaultValue: 0 },
  rotate: { cssVar: '--lax-rot', unit: 'deg', defaultValue: 0 },
  rotateX: { cssVar: '--lax-rot-x', unit: 'deg', defaultValue: 0 },
  rotateY: { cssVar: '--lax-rot-y', unit: 'deg', defaultValue: 0 },
  scale: { cssVar: '--lax-scale', unit: '', defaultValue: 1 },
  scaleX: { cssVar: '--lax-scale-x', unit: '', defaultValue: 1 },
  scaleY: { cssVar: '--lax-scale-y', unit: '', defaultValue: 1 },
  opacity: { cssVar: '--lax-op', unit: '', defaultValue: 1 },
  blur: { cssVar: '--lax-blur', unit: 'px', defaultValue: 0 },
  hueRotate: { cssVar: '--lax-hue', unit: 'deg', defaultValue: 0 },
  skewX: { cssVar: '--lax-skew-x', unit: 'deg', defaultValue: 0 },
  skewY: { cssVar: '--lax-skew-y', unit: 'deg', defaultValue: 0 },
  brightness: { cssVar: '--lax-bright', unit: '%', defaultValue: 100 },
};

/**
 * Parse declarative data-lax string into structured rules.
 * Example inputs:
 *  - "translateY 0 200 | opacity 1 0"
 *  - "translateY 0 0 400 -120 | opacity 0 1 300 0 | rotate 0 0 500 180"
 *  - "scale 0 0.8 | 300 1.2 | 600 0.5"
 */
export function parseLaxString(laxString: string): LaxPropertyRule[] {
  if (!laxString || typeof laxString !== 'string') return [];

  const rules: LaxPropertyRule[] = [];
  // Split by pipe or group of properties
  const segments = laxString
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  let currentProp = '';
  let currentPoints: KeyframePoint[] = [];

  const flushCurrent = () => {
    if (currentProp && currentPoints.length > 0) {
      const config = PROPERTY_CONFIG[currentProp] || {
        cssVar: `--lax-${currentProp.toLowerCase()}`,
        unit: 'px',
        defaultValue: 0,
      };

      // Sort points by scroll position ascending
      const sortedPoints = [...currentPoints].sort((a, b) => a.scroll - b.scroll);

      // If only 2 numbers were provided without explicit scroll pairs (e.g. "translateY 0 200")
      // Lax.js default maps 0 scroll to start, and 200/500 scroll to end
      if (sortedPoints.length === 1) {
        sortedPoints.unshift({ scroll: 0, value: config.defaultValue });
      }

      rules.push({
        property: currentProp,
        cssVar: config.cssVar,
        unit: config.unit,
        points: sortedPoints,
      });
      currentPoints = [];
    }
  };

  for (const segment of segments) {
    const tokens = segment.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // Check if the first token is a known property name
    const maybeProp = tokens[0];
    const isNewProp = maybeProp in PROPERTY_CONFIG || /^[a-zA-Z]+$/.test(maybeProp);

    let numTokens = tokens;
    if (isNewProp && isNaN(Number(maybeProp))) {
      flushCurrent();
      currentProp = maybeProp;
      numTokens = tokens.slice(1);
    }

    // Process numbers in pairs: (scroll, value) or if given as "val1 val2"
    if (numTokens.length === 2 && !isNaN(Number(numTokens[0])) && !isNaN(Number(numTokens[1]))) {
      // Could be (scroll, value) OR (startVal endVal)
      // If segment had property name and 2 numbers (e.g. "translateY 0 200"),
      // in spec: "translateY 0 200" means scroll 0 -> 0px, scroll 200 -> 200px (or scroll 0 -> 0, scroll 300 -> 200)
      const n1 = parseFloat(numTokens[0]);
      const n2 = parseFloat(numTokens[1]);

      if (tokens[0] === maybeProp && isNewProp) {
        // Syntax: "translateY 0 200" -> from 0 to 200 px over 0 to 300 scroll
        currentPoints.push({ scroll: 0, value: n1 });
        currentPoints.push({ scroll: 300, value: n2 });
      } else {
        // Point pair: scroll = n1, value = n2
        currentPoints.push({ scroll: n1, value: n2 });
      }
    } else if (numTokens.length >= 4) {
      // Syntax: "0 0 500 200" -> scroll 0 -> 0, scroll 500 -> 200
      for (let i = 0; i < numTokens.length; i += 2) {
        if (i + 1 < numTokens.length) {
          const sc = parseFloat(numTokens[i]);
          const val = parseFloat(numTokens[i + 1]);
          if (!isNaN(sc) && !isNaN(val)) {
            currentPoints.push({ scroll: sc, value: val });
          }
        }
      }
    } else if (numTokens.length === 1 && !isNaN(Number(numTokens[0]))) {
      // Single value fallback
      const val = parseFloat(numTokens[0]);
      currentPoints.push({ scroll: currentPoints.length === 0 ? 0 : 300, value: val });
    }
  }

  flushCurrent();
  return rules;
}

/**
 * Linear interpolation (Lerp) over keyframe points
 */
export function interpolateLaxValue(points: KeyframePoint[], currentScroll: number): number {
  if (!points || points.length === 0) return 0;
  if (points.length === 1) return points[0].value;

  // Before first keyframe: clamp to first value
  if (currentScroll <= points[0].scroll) {
    return points[0].value;
  }

  // After last keyframe: clamp to last value
  const last = points[points.length - 1];
  if (currentScroll >= last.scroll) {
    return last.value;
  }

  // Find adjacent pair
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (currentScroll >= p1.scroll && currentScroll <= p2.scroll) {
      const span = p2.scroll - p1.scroll;
      if (span === 0) return p1.value;
      const progress = (currentScroll - p1.scroll) / span;
      return p1.value + (p2.value - p1.value) * progress;
    }
  }

  return points[0].value;
}

/**
 * Format CSS styles for a container or element driven by parsed rules
 */
export function computeLaxStyles(
  rules: LaxPropertyRule[],
  scrollY: number
): { styles: React.CSSProperties; computedValues: Record<string, string> } {
  const inlineStyles: Record<string, string | number> = {};
  const computedValues: Record<string, string> = {};

  let tx = 0;
  let ty = 0;
  let tz = 0;
  let rot = 0;
  let rotX = 0;
  let rotY = 0;
  let scale = 1;
  let scaleX = 1;
  let scaleY = 1;
  let op = 1;
  let blur = 0;
  let hue = 0;
  let skewX = 0;
  let skewY = 0;
  let hasTransform = false;
  let hasFilter = false;

  for (const rule of rules) {
    const val = interpolateLaxValue(rule.points, scrollY);
    computedValues[rule.property] = `${val.toFixed(2)}${rule.unit}`;

    switch (rule.property) {
      case 'translateY':
        ty = val;
        hasTransform = true;
        break;
      case 'translateX':
        tx = val;
        hasTransform = true;
        break;
      case 'translateZ':
        tz = val;
        hasTransform = true;
        break;
      case 'rotate':
        rot = val;
        hasTransform = true;
        break;
      case 'rotateX':
        rotX = val;
        hasTransform = true;
        break;
      case 'rotateY':
        rotY = val;
        hasTransform = true;
        break;
      case 'scale':
        scale = val;
        hasTransform = true;
        break;
      case 'scaleX':
        scaleX = val;
        hasTransform = true;
        break;
      case 'scaleY':
        scaleY = val;
        hasTransform = true;
        break;
      case 'opacity':
        op = Math.max(0, Math.min(1, val));
        inlineStyles.opacity = op;
        break;
      case 'blur':
        blur = Math.max(0, val);
        hasFilter = true;
        break;
      case 'hueRotate':
        hue = val;
        hasFilter = true;
        break;
      case 'skewX':
        skewX = val;
        hasTransform = true;
        break;
      case 'skewY':
        skewY = val;
        hasTransform = true;
        break;
      default:
        // Set as generic CSS variable
        inlineStyles[rule.cssVar] = `${val}${rule.unit}`;
        break;
    }
  }

  if (hasTransform) {
    const transforms = [
      `translate3d(${tx}px, ${ty}px, ${tz}px)`,
      rot !== 0 ? `rotate(${rot}deg)` : '',
      rotX !== 0 ? `rotateX(${rotX}deg)` : '',
      rotY !== 0 ? `rotateY(${rotY}deg)` : '',
      scale !== 1 ? `scale(${scale})` : '',
      scaleX !== 1 || scaleY !== 1 ? `scale(${scaleX}, ${scaleY})` : '',
      skewX !== 0 ? `skewX(${skewX}deg)` : '',
      skewY !== 0 ? `skewY(${skewY}deg)` : '',
    ]
      .filter(Boolean)
      .join(' ');

    inlineStyles.transform = transforms;
  }

  if (hasFilter) {
    const filters = [
      blur > 0 ? `blur(${blur}px)` : '',
      hue !== 0 ? `hue-rotate(${hue}deg)` : '',
    ]
      .filter(Boolean)
      .join(' ');

    inlineStyles.filter = filters;
  }

  return {
    styles: {
      ...inlineStyles,
      willChange: 'transform, opacity, filter',
      transition: 'transform 0.05s linear, opacity 0.05s linear, filter 0.05s linear',
    } as React.CSSProperties,
    computedValues,
  };
}

/**
 * ==============================================================================
 * LAX ELEMENT COMPONENT
 * Declarative component that responds to scroll position via `data-lax` attribute
 * ==============================================================================
 */
export interface LaxElementProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-lax'?: string;
  scrollY?: number;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export const LaxBox: React.FC<LaxElementProps> = ({
  'data-lax': dataLax = '',
  scrollY = 0,
  as: Component = 'div',
  className = '',
  style = {},
  children,
  ...rest
}) => {
  const rules = useMemo(() => parseLaxString(dataLax), [dataLax]);
  const { styles: dynamicStyles } = useMemo(
    () => computeLaxStyles(rules, scrollY),
    [rules, scrollY]
  );

  return (
    <Component
      data-lax={dataLax}
      className={`transition-all duration-75 ease-out ${className}`}
      style={{ ...style, ...dynamicStyles }}
      {...rest}
    >
      {children}
    </Component>
  );
};

/**
 * ==============================================================================
 * INTERACTIVE PRESET CONFIGURATIONS
 * ==============================================================================
 */
interface Preset {
  name: string;
  description: string;
  spec: string;
  category: string;
}

const PRESETS: Preset[] = [
  {
    name: 'Spec Requirement (Fade & Drop)',
    description: 'Technical spec default: translateY 0 -> 200px & opacity 1 -> 0',
    spec: 'translateY 0 200 | opacity 1 0',
    category: 'Spec Default',
  },
  {
    name: 'Vortex 360 Spin',
    description: 'Dynamic rotational acceleration paired with zoom depth',
    spec: 'rotate 0 0 | 500 360 | scale 0 0.8 | 250 1.25 | 500 0.9 | translateY 0 0 | 500 120',
    category: 'Kinetic',
  },
  {
    name: 'Depth Zoom & Bloom',
    description: 'Extreme scale expansion, blur dissipation, and subtle hue rotation',
    spec: 'scale 0 0.6 | 300 1.15 | 600 1.0 | opacity 0 0.3 | 200 1 | blur 0 12 | 300 0 | hueRotate 0 0 | 600 120',
    category: 'Atmospheric',
  },
  {
    name: 'Slingshot Horizontal',
    description: 'Cross-axis trajectory shift with dynamic skew and spring snap',
    spec: 'translateX 0 -180 | 300 0 | 600 180 | skewX 0 18 | 300 0 | 600 -18 | opacity 0 0 | 150 1 | 450 1 | 600 0',
    category: 'Kinetic',
  },
  {
    name: '3D Flip & Tilt',
    description: 'Multi-axis 3D perspective rotation linked to scroll velocity',
    spec: 'rotateX 0 45 | 300 0 | 600 -45 | rotateY 0 -30 | 300 0 | 600 30 | translateY 0 50 | 300 0 | 600 -50',
    category: '3D Depth',
  },
  {
    name: 'Atmospheric Vignette',
    description: 'Smooth soft blur transition with depth of field defocusing',
    spec: 'blur 0 0 | 300 8 | 600 0 | opacity 0 1 | 300 0.4 | 600 1 | scale 0 1 | 300 0.85 | 600 1',
    category: 'Atmospheric',
  },
];

/**
 * ==============================================================================
 * MAIN DEMO SHOWCASE COMPONENT
 * Self-contained, responsive, glassmorphic presentation with real-time inspector
 * ==============================================================================
 */
export default function LaxParallaxDemo(): JSX.Element {
  // State for simulated or native container scroll
  const [scrollY, setScrollY] = useState<number>(0);
  const [maxScroll, setMaxScroll] = useState<number>(800);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [customSpec, setCustomSpec] = useState<string>('translateY 0 200 | opacity 1 0');
  const [selectedPreset, setSelectedPreset] = useState<string>('Spec Requirement (Fade & Drop)');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stage' | 'multi' | 'code'>('stage');

  // Virtual container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync scroll listener for internal viewport
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollY(target.scrollTop);
    setMaxScroll(target.scrollHeight - target.clientHeight || 800);
  }, []);

  // Programmatic scrub handler
  const handleScrub = (val: number) => {
    setScrollY(val);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = val;
    }
  };

  // Auto-play scroll simulation
  useEffect(() => {
    if (!isAutoPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let direction = 1;
    const speed = 2.5;

    const loop = () => {
      setScrollY((prev) => {
        let next = prev + speed * direction;
        if (next >= 750) {
          direction = -1;
          next = 750;
        } else if (next <= 10) {
          direction = 1;
          next = 10;
        }
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = next;
        }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoPlaying]);

  // Current custom parsed rules
  const customRules = useMemo(() => parseLaxString(customSpec), [customSpec]);
  const customComputation = useMemo(
    () => computeLaxStyles(customRules, scrollY),
    [customRules, scrollY]
  );

  const handleCopyCode = () => {
    const snippet = `<!-- Declarative Lax.js Parallax markup -->
<div data-lax="${customSpec}" class="parallax-target">
  <h3>Smooth Scroll Parallax</h3>
  <p>Lightweight 3kb declarative scroll-driven animation</p>
</div>`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const scrollPercentage = Math.min(100, Math.max(0, (scrollY / (maxScroll || 800)) * 100));

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans p-3 sm:p-6 lg:p-8 flex flex-col justify-start items-center selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header / Intro Banner */}
      <header className="w-full max-w-6xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Lax.js Engine &bull; Scroll Parallax
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Declarative Parallax Effects
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded bg-slate-800/90 text-emerald-400 border border-emerald-500/30">
              ~3KB Engine
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
            Lightweight scroll-linked parallax animations applied via HTML{' '}
            <code className="text-amber-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              data-lax
            </code>{' '}
            attributes. Zero boilerplate, GPU-accelerated CSS transforms.
          </p>
        </div>

        {/* Global Control Bar */}
        <div className="flex items-center flex-wrap gap-2.5 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isAutoPlaying
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 animate-pulse'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Auto-Scroll (Playing)
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Auto-Scroll Simulation
              </>
            )}
          </button>

          <button
            onClick={() => handleScrub(0)}
            title="Reset Scroll to Top"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Telemetry Metric pill */}
          <div className="px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">ScrollY:</span>
            <span className="text-cyan-300 font-bold w-12 text-right">
              {Math.round(scrollY)}px
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Controls & Live Syntax Editor (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          {/* Preset Selector */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" /> Presets Library
              </span>
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {PRESETS.length} Available
              </span>
            </div>

            <div className="space-y-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSelectedPreset(preset.name);
                      setCustomSpec(preset.spec);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10 text-white'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        {preset.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {preset.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</span>
                    <code className="text-[10px] font-mono text-amber-300/90 bg-black/40 px-1.5 py-0.5 rounded border border-slate-800/60 mt-0.5 block truncate">
                      {preset.spec}
                    </code>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Data-Lax Attribute Editor */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="data-lax-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Declarative Syntax
              </label>
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              Edit the attribute value in real time. Syntax:{' '}
              <span className="text-slate-300 font-mono">property [scroll val] | ...</span>
            </p>

            <div className="relative">
              <textarea
                id="data-lax-input"
                rows={3}
                value={customSpec}
                onChange={(e) => {
                  setCustomSpec(e.target.value);
                  setSelectedPreset('Custom Edit');
                }}
                className="w-full bg-slate-950 font-mono text-xs text-amber-300 p-3 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition resize-none leading-relaxed"
                placeholder="e.g. translateY 0 200 | opacity 1 0"
              />
            </div>

            {/* Live Computed Output Inspector */}
            <div className="mt-3 bg-slate-950/90 rounded-xl p-3 border border-slate-800/90">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" /> Active Interpolated State
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                {Object.entries(customComputation.computedValues).length > 0 ? (
                  Object.entries(customComputation.computedValues).map(([prop, val]) => (
                    <div
                      key={prop}
                      className="flex items-center justify-between bg-slate-900/90 px-2 py-1 rounded border border-slate-800"
                    >
                      <span className="text-slate-400">{prop}:</span>
                      <span className="text-amber-300 font-semibold">{val}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs italic col-span-2">
                    No active property rules parsed.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Scrub Controller */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Manual Scroll Scrubber
              </span>
              <span className="text-amber-400 font-mono font-bold">
                {Math.round(scrollPercentage)}% ({Math.round(scrollY)}px)
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={650}
              value={scrollY}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-800"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0px (Top)</span>
              <span>300px (Mid)</span>
              <span>650px (Bottom)</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Viewport Showcase & Parallax Simulation Stage (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Showcase Tabs */}
          <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('stage')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'stage'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Interactive Stage
              </button>
              <button
                onClick={() => setActiveTab('multi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'multi'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" /> Multi-Layer Choreography
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> HTML / React Guide
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pr-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              60 FPS GPU Sync
            </div>
          </div>

          {/* VIRTUAL SCROLL STAGE CONTAINER */}
          {activeTab === 'stage' && (
            <div className="relative rounded-3xl border border-slate-800 bg-[#090D16] shadow-2xl overflow-hidden flex flex-col">
              {/* Stage Top Bar */}
              <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 pl-2">
                    lax-viewport://scroll-driver
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Scroll:</span>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-75"
                      style={{ width: `${scrollPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable Viewport */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                tabIndex={0}
                aria-label="Scrollable Parallax Showcase Viewport"
                className="h-[520px] overflow-y-auto overflow-x-hidden p-6 relative select-none scroll-smooth focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                style={{ perspective: 1000 }}
              >
                {/* Scroll Indicator Prompt */}
                <div className="absolute top-3 right-6 z-20 pointer-events-none flex items-center gap-1.5 text-xs text-amber-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-amber-500/30 shadow-lg">
                  <ChevronDown className="w-3.5 h-3.5 animate-bounce text-amber-400" />
                  <span>Scroll or drag thumb inside</span>
                </div>

                {/* Background Parallax Grid Layer */}
                <LaxBox
                  data-lax="translateY 0 0 | 700 -180 | opacity 0 0.3 | 400 0.15"
                  scrollY={scrollY}
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 60%), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                    backgroundSize: '100% 100%, 32px 32px, 32px 32px',
                  }}
                />

                {/* SECTION 1: Hero Banner with Dynamic Float */}
                <div className="min-h-[300px] flex flex-col items-center justify-center relative pt-4 pb-8">
                  {/* Floating Orb Background */}
                  <LaxBox
                    data-lax="translateY 0 -20 | 500 120 | rotate 0 0 | 500 180 | scale 0 1 | 300 1.4"
                    scrollY={scrollY}
                    className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-indigo-500/20 blur-2xl pointer-events-none -z-10"
                  />

                  {/* Primary Animated Card applying user's data-lax */}
                  <div
                    style={customComputation.styles}
                    className="w-full max-w-md bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-amber-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                  >
                    {/* Glowing highlight border */}
                    <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white tracking-wide">
                            Live Subject Element
                          </h2>
                          <span className="text-[11px] text-slate-400">
                            Driven by active <code className="text-amber-400">data-lax</code>
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                        Active Target
                      </span>
                    </div>

                    <div className="bg-black/50 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] mb-4">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                        data-lax attribute:
                      </span>
                      <span className="text-amber-300 break-all font-semibold">
                        &quot;{customSpec}&quot;
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Scroll Position</span>
                        <span className="font-mono text-cyan-300 font-bold text-sm">
                          {Math.round(scrollY)} px
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">CSS Transform</span>
                        <span className="font-mono text-emerald-300 text-[11px] truncate block">
                          {customComputation.styles.transform
                            ? String(customComputation.styles.transform)
                            : 'none'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Staggered Multi-Depth Story Cards */}
                <div className="py-12 flex flex-col gap-8 relative">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                    <span className="text-xs uppercase font-mono tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                      Scroll Milestone 300px &ndash; 600px
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700 via-slate-700 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card A: Parallax Left-Float */}
                    <LaxBox
                      data-lax="translateX 0 -60 | 400 0 | translateY 0 80 | 500 0 | opacity 150 0 | 350 1"
                      scrollY={scrollY}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl"
                    >
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">
                        Lateral Float Parallax
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Slides from left on scroll axis with smooth opacity ingress.
                      </p>
                      <code className="text-[10px] font-mono text-cyan-300 bg-black/50 px-2 py-1 rounded border border-slate-800 block">
                        data-lax=&quot;translateX 0 -60 | 400 0&quot;
                      </code>
                    </LaxBox>

                    {/* Card B: Parallax Right-Scale */}
                    <LaxBox
                      data-lax="translateX 0 60 | 400 0 | scale 0 0.8 | 400 1.05 | 600 1.0 | opacity 150 0 | 350 1"
                      scrollY={scrollY}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">
                        Scale &amp; Snapping
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        Scales gently into focus, compensating scroll momentum.
                      </p>
                      <code className="text-[10px] font-mono text-purple-300 bg-black/50 px-2 py-1 rounded border border-slate-800 block">
                        data-lax=&quot;scale 0 0.8 | 400 1.05&quot;
                      </code>
                    </LaxBox>
                  </div>

                  {/* SECTION 3: Deep Scroll Finale Banner */}
                  <LaxBox
                    data-lax="scale 300 0.9 | 600 1.0 | opacity 300 0.2 | 550 1 | translateY 300 60 | 600 0"
                    scrollY={scrollY}
                    className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 text-center flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
                      Scroll Destination Reached
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Zero Runtime Bloat &bull; Pure Declarative Parallax
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md">
                      Using standard CSS Custom Properties and hardware-accelerated transforms,
                      animations execute on the compositor thread without layout thrashing.
                    </p>
                  </LaxBox>
                </div>

                {/* Extra scroll height padding */}
                <div className="h-40 flex items-center justify-center text-slate-600 text-xs font-mono">
                  &mdash; End of Scroll Stream &mdash;
                </div>
              </div>
            </div>
          )}

          {/* MULTI-LAYER CHOREOGRAPHY TAB */}
          {activeTab === 'multi' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-amber-400" />
                  Staggered Parallax Speed Layers
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Demonstrating 3 independent parallax speed planes (Foreground, Midground,
                  Background) driven purely by data-lax speeds.
                </p>
              </div>

              {/* Parallax Planes Simulator */}
              <div className="relative h-72 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* Background Plane: Slow Speed (0.2x) */}
                <LaxBox
                  data-lax="translateY 0 0 | 600 -40 | opacity 0 0.5 | 600 0.8"
                  scrollY={scrollY}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-64 h-64 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xs font-mono text-indigo-400 block font-bold">
                        LAYER 01 (Background)
                      </span>
                      <span className="text-[10px] text-slate-500">Speed: 0.2x (-40px)</span>
                    </div>
                  </div>
                </LaxBox>

                {/* Midground Plane: Standard Speed (1.0x) */}
                <LaxBox
                  data-lax="translateY 0 0 | 600 -120 | rotate 0 0 | 600 90"
                  scrollY={scrollY}
                  className="absolute w-44 h-44 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 backdrop-blur-md flex items-center justify-center p-3 shadow-xl"
                >
                  <div className="text-center">
                    <span className="text-xs font-mono text-cyan-300 block font-bold">
                      LAYER 02 (Midground)
                    </span>
                    <span className="text-[10px] text-slate-400">Speed: 1.0x (-120px)</span>
                  </div>
                </LaxBox>

                {/* Foreground Plane: Rapid Speed (2.5x) */}
                <LaxBox
                  data-lax="translateY 0 0 | 600 -260 | scale 0 0.9 | 600 1.25"
                  scrollY={scrollY}
                  className="absolute bottom-4 right-8 w-36 h-24 rounded-2xl border border-amber-500/60 bg-gradient-to-br from-amber-500/20 to-rose-500/20 backdrop-blur-lg flex items-center justify-center p-2 shadow-2xl"
                >
                  <div className="text-center">
                    <span className="text-xs font-mono text-amber-300 block font-bold">
                      LAYER 03 (Fore)
                    </span>
                    <span className="text-[10px] text-amber-200">Speed: 2.5x (-260px)</span>
                  </div>
                </LaxBox>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/40">
                  <span className="text-indigo-400 font-bold block mb-1">BG Plane</span>
                  <code className="text-[10px] text-slate-400">translateY 0 -40</code>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-900/40">
                  <span className="text-cyan-400 font-bold block mb-1">Mid Plane</span>
                  <code className="text-[10px] text-slate-400">translateY 0 -120 | rotate 0 90</code>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/40">
                  <span className="text-amber-400 font-bold block mb-1">Fore Plane</span>
                  <code className="text-[10px] text-slate-400">translateY 0 -260 | scale 0.9 1.25</code>
                </div>
              </div>
            </div>
          )}

          {/* CODE / SPEC GUIDE TAB */}
          {activeTab === 'code' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-400" />
                  Integration &amp; Technical Spec
                </h2>
                <span className="text-xs font-mono bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Vanilla JS + React TSX
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                The parser parses declarative HTML data attributes into continuous linear
                interpolation arrays and applies them straight to CSS transforms and custom
                properties via <code className="text-amber-300">requestAnimationFrame</code>.
              </p>

              {/* Code Snippet Display */}
              <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre className="leading-relaxed">
{`// 1. Declarative HTML / React JSX Syntax
<LaxBox data-lax="translateY 0 200 | opacity 1 0" scrollY={scrollY}>
  <div className="hero-card">
    Parallax Element (Drops 200px and fades out over scroll)
  </div>
</LaxBox>

// 2. Multi-Property Kinetic Chaining
<LaxBox 
  data-lax="rotate 0 0 | 500 360 | scale 0 0.8 | 300 1.2 | blur 0 10 | 300 0" 
  scrollY={scrollY}
>
  <div className="vortex-element" />
</LaxBox>

// 3. Technical Spec
- Category: Scroll Parallax
- Specification: data-lax: 'translateY 0 200 | opacity 1 0'
- Footprint: ~2.5kb (Zero external dependencies)
- Performance: 60 FPS GPU-accelerated transforms (translate3d)`}
                </pre>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Performance Tip:</strong> For smooth mobile and desktop rendering,
                  all transforms use <code className="text-white font-mono">translate3d</code> to
                  force dedicated GPU compositor layers without causing document reflow.
                </span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-6xl mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Lax.js Parallax Component &bull; Scroll Animation Category</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          data-lax: &quot;translateY 0 200 | opacity 1 0&quot;
        </div>
      </footer>
    </div>
  );
}
