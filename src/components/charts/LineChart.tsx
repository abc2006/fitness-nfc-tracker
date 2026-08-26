import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors } from '../../theme/colors';

export interface LineChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: LineChartPoint[];
  height?: number;
  lineColor?: string;
  labelColor?: string;
  emptyColor?: string;
}

export function LineChart({
  data,
  height = 160,
  lineColor = colors.primary,
  labelColor = colors.textMuted,
  emptyColor = colors.textMuted,
}: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padding = 12;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const chartHeight = height - padding * 2;

  const points =
    width > 0 && data.length > 0
      ? data.map((d, i) => {
          const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
          const y = padding + chartHeight - (d.value / maxValue) * chartHeight;
          return { x, y };
        })
      : [];

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && data.length > 0 && (
          <Svg width={width} height={height}>
            <Line x1={0} y1={padding + chartHeight} x2={width} y2={padding + chartHeight} stroke={colors.border} strokeWidth={1} />
            {points.length > 1 && (
              <Polyline
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={lineColor}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} />
            ))}
          </Svg>
        )}
        {data.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: emptyColor }]}>Noch keine Daten</Text>
          </View>
        )}
      </View>
      {data.length > 0 && (
        <View style={styles.labelsRow}>
          <Text style={[styles.labelText, { color: labelColor }]}>{data[0]?.label}</Text>
          <Text style={[styles.labelText, { color: labelColor }]}>{data[data.length - 1]?.label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  labelText: {
    fontSize: 11,
  },
});
