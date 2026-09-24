// shadcn-style chart wrappers over Recharts.
// Visual conventions lifted from shadcn/ui charts: hairline dashed grid, no axis
// lines, muted tick labels, a bordered tooltip card with an indicator swatch,
// and colour driven by CSS custom properties so it re-themes with the app.

// Resolve Recharts members on EVERY render. Destructuring at module scope
// captured `undefined` when <x-import> evaluated this file before the UMD
// bundle finished loading, and never recovered.
const RC = () => window.Recharts || {};

const css = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return (v && v.trim()) || fallback;
};

const T = () => ({
  ink: css('--color-text', '#e8eaee'),
  muted: css('--color-neutral-600', '#8b93a1'),
  grid: css('--color-divider', '#2a2e37'),
  surface: css('--color-surface', '#13151a'),
  pos: css('--color-neutral-500', '#59616f'),
  neg: css('--color-accent', '#ff5f3d'),
  bg: css('--color-bg', '#0b0c0f')
});

const PALETTE = () => {
  const t = T();
  return [t.ink, t.neg, css('--color-neutral-500', '#59616f'), css('--color-accent-500', '#d14a2a'),
          css('--color-neutral-700', '#aab1bd'), css('--color-accent-800', '#ff9d85')];
};

const fmtMoney = n => {
  const v = Math.abs(Math.round(n));
  const s = v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : String(v);
  return (n < 0 ? '−$' : '$') + s;
};

function ChartTooltip(props) {
  const { active, payload, label, valueFormat } = props;
  if (!active || !payload || !payload.length) return null;
  const t = T();
  return React.createElement('div', {
    style: {
      background: t.surface, border: '1px solid ' + t.grid, padding: '8px 10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.55)', minWidth: 140,
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif'
    }
  }, [
    React.createElement('div', {
      key: 'l',
      style: { fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.muted, marginBottom: 6 }
    }, label),
    ...payload.map((p, i) => React.createElement('div', {
      key: i,
      style: { display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }
    }, [
      React.createElement('span', {
        key: 's',
        style: { width: 8, height: 8, flex: 'none', background: p.color || p.fill || t.ink }
      }),
      React.createElement('span', {
        key: 'n', style: { fontSize: 12, color: t.muted, flex: 1 }
      }, p.name),
      React.createElement('span', {
        key: 'v',
        style: {
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12,
          fontWeight: 600, color: t.ink
        }
      }, valueFormat === 'money' ? fmtMoney(p.value) : p.value)
    ]))
  ]);
}

const axisProps = t => ({
  stroke: t.grid,
  tick: { fill: t.muted, fontSize: 10, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
  tickLine: false,
  axisLine: false
});

function LmrChart(props) {
  const {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
  } = RC();

  // Recharts may still be in flight; poll briefly and re-render when it lands.
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    if (ResponsiveContainer) return undefined;
    let n = 0;
    const id = setInterval(() => {
      if ((window.Recharts || {}).ResponsiveContainer || ++n > 100) {
        clearInterval(id);
        bump(v => v + 1);
      }
    }, 100);
    return () => clearInterval(id);
  }, [ResponsiveContainer]);

  const type = props.type || 'bar';
  const data = props.data || [];
  const valueFormat = props.valueFormat || 'money';
  const height = Number(props.height) || 240;
  const t = T();

  if (!ResponsiveContainer) {
    return React.createElement('div', {
      style: { padding: 14, fontSize: 12, color: t.muted }
    }, 'Chart library still loading…');
  }

  const tip = React.createElement(Tooltip, {
    cursor: { fill: 'rgba(255,255,255,0.04)' },
    content: React.createElement(ChartTooltip, { valueFormat })
  });

  let chart;

  if (type === 'pie' || type === 'donut') {
    const colors = PALETTE();
    chart = React.createElement(PieChart, {}, [
      React.createElement(Pie, {
        key: 'p', data, dataKey: 'value', nameKey: 'label',
        innerRadius: type === 'donut' ? '55%' : 0, outerRadius: '80%',
        paddingAngle: 1, stroke: t.bg, strokeWidth: 2, isAnimationActive: false
      }, data.map((d, i) => React.createElement(Cell, { key: i, fill: colors[i % colors.length] }))),
      tip,
      React.createElement(Legend, {
        key: 'l', verticalAlign: 'bottom', height: 28,
        formatter: v => React.createElement('span', {
          style: { fontSize: 11, color: t.muted }
        }, v)
      })
    ]);
  } else if (type === 'line' || type === 'area') {
    const Root = type === 'area' ? AreaChart : LineChart;
    chart = React.createElement(Root, { data, margin: { top: 8, right: 8, bottom: 0, left: 0 } }, [
      React.createElement(CartesianGrid, { key: 'g', stroke: t.grid, strokeDasharray: '3 3', vertical: false }),
      React.createElement(XAxis, Object.assign({ key: 'x', dataKey: 'label', interval: 'preserveStartEnd', minTickGap: 24 }, axisProps(t))),
      React.createElement(YAxis, Object.assign({ key: 'y', width: 52, tickFormatter: v => valueFormat === 'money' ? fmtMoney(v) : v }, axisProps(t))),
      tip,
      type === 'area'
        ? React.createElement(Area, {
            key: 'a', type: 'monotone', dataKey: 'value', name: props.seriesName || 'Value',
            stroke: t.ink, strokeWidth: 2, fill: t.pos, fillOpacity: 0.28, dot: false, isAnimationActive: false
          })
        : React.createElement(Line, {
            key: 'a', type: 'monotone', dataKey: 'value', name: props.seriesName || 'Value',
            stroke: t.ink, strokeWidth: 2, dot: false, activeDot: { r: 3, fill: t.ink }, isAnimationActive: false
          })
    ]);
  } else {
    const horizontal = type === 'hbar';
    chart = React.createElement(BarChart, {
      data, layout: horizontal ? 'vertical' : 'horizontal',
      margin: { top: 8, right: 12, bottom: 0, left: horizontal ? 8 : 0 }
    }, [
      React.createElement(CartesianGrid, {
        key: 'g', stroke: t.grid, strokeDasharray: '3 3',
        vertical: horizontal, horizontal: !horizontal
      }),
      horizontal
        ? React.createElement(XAxis, Object.assign({ key: 'x', type: 'number', tickFormatter: v => valueFormat === 'money' ? fmtMoney(v) : v }, axisProps(t)))
        : React.createElement(XAxis, Object.assign({ key: 'x', dataKey: 'label', interval: 0, angle: data.length > 6 ? -30 : 0, textAnchor: data.length > 6 ? 'end' : 'middle', height: data.length > 6 ? 62 : 28 }, axisProps(t))),
      horizontal
        ? React.createElement(YAxis, Object.assign({ key: 'y', type: 'category', dataKey: 'label', width: 132 }, axisProps(t)))
        : React.createElement(YAxis, Object.assign({ key: 'y', width: 52, tickFormatter: v => valueFormat === 'money' ? fmtMoney(v) : v }, axisProps(t))),
      tip,
      React.createElement(Bar, {
        key: 'b', dataKey: 'value', name: props.seriesName || 'Value', maxBarSize: horizontal ? 20 : 42, isAnimationActive: false
      }, data.map((d, i) => React.createElement(Cell, {
        key: i,
        fill: d.color || (typeof d.value === 'number' && d.value < 0 ? t.neg : t.ink)
      })))
    ]);
  }

  return React.createElement(ResponsiveContainer, { width: '100%', height }, chart);
}

window.LmrCharts = { LmrChart };
module.exports = { LmrChart };
