import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

export interface BarChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarChartPoint[];
  height?: number;
  barColor?: string;
  showLabels?: boolean;
  labelColor?: string;
  emptyColor?: string;
}

export function BarChart({
  data,
  height = 140,
  barColor = colors.primary,
  showLabels = true,
  labelColor = colors.textMuted,
  emptyColor = colors.textMuted,
}: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const barGap = 6;
  const barWidth = data.length > 0 && width > 0 ? Math.max(3, width / data.length - barGap) : 0;

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && data.length > 0 && (
          <Svg width={width} height={height}>
            {data.map((point, index) => {
              const barHeight = Math.max(2, (point.value / maxValue) * (height - 4));
              const x = index * (barWidth + barGap);
              const y = height - barHeight;
              return (
                <Rect
                  key={index}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={barColor}
                  opacity={point.value > 0 ? 1 : 0.15}
                />
              );
            })}
          </Svg>
        )}
        {data.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: emptyColor }]}>Noch keine Daten</Text>
          </View>
        )}
      </View>
      {showLabels && data.length > 0 && (
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
