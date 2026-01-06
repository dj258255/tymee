import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

interface StudyBlock {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  subject?: string;
  color?: string;
}

interface TimeTableProps {
  isDark: boolean;
  studyBlocks: StudyBlock[];
  startHour?: number; // 시작 시간 (기본 6시)
  endHour?: number; // 종료 시간 (기본 24시)
}

const TimeTable: React.FC<TimeTableProps> = ({
  isDark,
  studyBlocks,
  startHour = 6,
  endHour = 24,
}) => {
  const endHourValue = endHour;
  const hours = Array.from({length: endHourValue - startHour}, (_, i) => startHour + i);
  const cellHeight = 40; // 1시간당 높이
  const minuteHeight = cellHeight / 60; // 1분당 높이

  // 공부 블록을 픽셀 위치로 변환
  const getBlockStyle = (block: StudyBlock) => {
    const startOffset = (block.startHour - startHour) * cellHeight + block.startMinute * minuteHeight;
    const duration = (block.endHour - block.startHour) * 60 + (block.endMinute - block.startMinute);
    const height = duration * minuteHeight;

    return {
      top: startOffset,
      height: Math.max(height, 4), // 최소 높이 4px
    };
  };

  return (
    <View style={[styles.container, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
      <Text style={[styles.title, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
        오늘의 타임테이블
      </Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}>
        <View style={styles.tableContainer}>
          {/* 시간 라벨 */}
          <View style={styles.timeLabels}>
            {hours.map((hour) => (
              <View key={hour} style={[styles.timeLabelCell, {height: cellHeight}]}>
                <Text style={[styles.timeLabel, {color: isDark ? '#666666' : '#999999'}]}>
                  {hour}
                </Text>
              </View>
            ))}
          </View>

          {/* 그리드 + 공부 블록 */}
          <View style={styles.gridContainer}>
            {/* 그리드 라인 */}
            {hours.map((hour, index) => (
              <View
                key={hour}
                style={[
                  styles.gridCell,
                  {
                    height: cellHeight,
                    borderTopColor: isDark ? '#2A2A2A' : '#F0F0F0',
                    backgroundColor: index % 2 === 0
                      ? (isDark ? '#1A1A1A' : '#FAFAFA')
                      : (isDark ? '#1E1E1E' : '#FFFFFF'),
                  },
                ]}
              />
            ))}

            {/* 공부 블록들 */}
            {studyBlocks.map((block, index) => {
              const blockStyle = getBlockStyle(block);
              return (
                <View
                  key={index}
                  style={[
                    styles.studyBlock,
                    {
                      top: blockStyle.top,
                      height: blockStyle.height,
                      backgroundColor: block.color || '#007AFF',
                    },
                  ]}>
                  {blockStyle.height > 20 && (
                    <Text style={styles.blockText} numberOfLines={1}>
                      {block.subject || '공부'}
                    </Text>
                  )}
                </View>
              );
            })}

            {/* 현재 시간 인디케이터 */}
            {(() => {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();

              if (currentHour >= startHour && currentHour < endHourValue) {
                const position = (currentHour - startHour) * cellHeight + currentMinute * minuteHeight;
                return (
                  <View style={[styles.currentTimeIndicator, {top: position}]}>
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeLine} />
                  </View>
                );
              }
              return null;
            })()}
          </View>
        </View>
      </ScrollView>

      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#007AFF'}]} />
          <Text style={[styles.legendText, {color: isDark ? '#999999' : '#666666'}]}>
            공부 시간
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#FF5252'}]} />
          <View style={styles.currentTimeLine2} />
          <Text style={[styles.legendText, {color: isDark ? '#999999' : '#666666'}]}>
            현재 시간
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: 300,
  },
  tableContainer: {
    flexDirection: 'row',
  },
  timeLabels: {
    width: 30,
    marginRight: 8,
  },
  timeLabelCell: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: -6,
  },
  gridContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridCell: {
    borderTopWidth: 1,
  },
  studyBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  blockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginLeft: -4,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF5252',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  currentTimeLine2: {
    width: 12,
    height: 2,
    backgroundColor: '#FF5252',
    marginLeft: -4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TimeTable;
