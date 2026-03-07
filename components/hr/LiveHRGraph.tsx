import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Rect, Line, Text as SvgText } from "react-native-svg";
import { COLORS } from "../../lib/constants/brand";
import { HRSample, ZONE_COLORS, getZoneBoundaries } from "../../lib/ble/hr-zones";

interface LiveHRGraphProps {
  samples: HRSample[];
  maxHR: number;
  width: number;
  height?: number;
}

export function LiveHRGraph({
  samples,
  maxHR,
  width,
  height = 140,
}: LiveHRGraphProps) {
  const padding = { top: 10, bottom: 20, left: 36, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { path, hrMin, hrMax, zoneBands, currentZone } = useMemo(() => {
    if (samples.length < 2) {
      return { path: "", hrMin: 60, hrMax: maxHR, zoneBands: [], currentZone: 1 };
    }

    // Determine Y range
    const hrs = samples.map((s) => s.hr);
    const rawMin = Math.min(...hrs);
    const rawMax = Math.max(...hrs);
    const hrMin = Math.max(Math.floor(rawMin / 10) * 10 - 10, 40);
    const hrMax = Math.min(Math.ceil(rawMax / 10) * 10 + 10, maxHR + 10);

    // Time range: last 60 seconds
    const now = samples[samples.length - 1].timestamp;
    const start = now - 60000;

    const toX = (ts: number) => padding.left + ((ts - start) / 60000) * chartW;
    const toY = (hr: number) =>
      padding.top + chartH - ((hr - hrMin) / (hrMax - hrMin)) * chartH;

    // Build SVG path
    const visibleSamples = samples.filter((s) => s.timestamp >= start);
    let path = "";
    visibleSamples.forEach((s, i) => {
      const x = toX(s.timestamp);
      const y = toY(s.hr);
      path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    });

    // Zone background bands
    const boundaries = getZoneBoundaries(maxHR);
    const zoneBands = Object.entries(boundaries)
      .map(([key, { min, max }]) => {
        const zoneNum = parseInt(key.slice(1));
        const yTop = toY(Math.min(max, hrMax));
        const yBottom = toY(Math.max(min, hrMin));
        if (yBottom <= yTop) return null;
        return {
          key,
          y: yTop,
          height: yBottom - yTop,
          color: ZONE_COLORS[zoneNum as keyof typeof ZONE_COLORS],
        };
      })
      .filter(Boolean) as { key: string; y: number; height: number; color: string }[];

    const currentZone = visibleSamples.length > 0
      ? visibleSamples[visibleSamples.length - 1].zone
      : 1;

    return { path, hrMin, hrMax, zoneBands, currentZone };
  }, [samples, maxHR, chartW, chartH]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    const labels: { hr: number; y: number }[] = [];
    const step = hrMax - hrMin > 60 ? 20 : 10;
    for (let hr = hrMin; hr <= hrMax; hr += step) {
      const y = padding.top + chartH - ((hr - hrMin) / (hrMax - hrMin)) * chartH;
      labels.push({ hr, y });
    }
    return labels;
  }, [hrMin, hrMax, chartH]);

  const lineColor = ZONE_COLORS[currentZone as keyof typeof ZONE_COLORS] || COLORS.primary;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Zone background bands */}
        {zoneBands.map((band) => (
          <Rect
            key={band.key}
            x={padding.left}
            y={band.y}
            width={chartW}
            height={band.height}
            fill={band.color}
            opacity={0.08}
          />
        ))}

        {/* Grid lines + labels */}
        {yLabels.map((l) => (
          <React.Fragment key={l.hr}>
            <Line
              x1={padding.left}
              y1={l.y}
              x2={padding.left + chartW}
              y2={l.y}
              stroke={COLORS.border}
              strokeWidth={0.5}
            />
            <SvgText
              x={padding.left - 6}
              y={l.y + 4}
              textAnchor="end"
              fill={COLORS.textMuted}
              fontSize={10}
            >
              {l.hr}
            </SvgText>
          </React.Fragment>
        ))}

        {/* HR line */}
        {path ? (
          <Path d={path} stroke={lineColor} strokeWidth={2.5} fill="none" />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
});
