import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import ColorPicker, {
  Panel1,
  HueSlider,
} from 'reanimated-color-picker';
import type {RenderThumbProps} from 'reanimated-color-picker';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {
  StudyRecordTheme,
} from '../themes/studyRecordThemes';
import {sp, hp, fp, iconSize} from '../utils/responsive';

interface Subject {
  id: string;
  name: string;
  color: string;
}

type TimeBlockStatus = 'incomplete' | 'completed';

interface TimeBlock {
  hour: number;
  minute: number; // 0, 10, 20, 30, 40, 50
  subjectId: string | null;
  memo?: string; // 블록별 메모
  status?: TimeBlockStatus; // 블록 완료 상태
}

interface TenMinutePlannerProps {
  isDark: boolean;
  subjects: Subject[];
  blocks: TimeBlock[];
  onBlockChange?: (blocks: TimeBlock[]) => void;
  onBlockStatusChange?: (hour: number, minute: number) => void;
  onAddSubject?: (subject: {name: string; color: string}) => void;
  onUpdateSubject?: (id: string, subject: {name: string; color: string}) => void;
  onDeleteSubject?: (id: string) => void;
  startHour?: number;
  endHour?: number;
  editable?: boolean;
  theme?: StudyRecordTheme;
  showSubjectModalExternal?: boolean;
  onCloseSubjectModal?: () => void;
  showManageModalExternal?: boolean;
  onCloseManageModal?: () => void;
}

const SUBJECT_COLORS = [
  '#007AFF', '#4CAF50', '#FF9500', '#9C27B0', '#E91E63',
  '#00BCD4', '#FF5722', '#795548', '#607D8B', '#3F51B5',
];

// 커스텀 thumb 컴포넌트 - 선택된 색상을 동적으로 표시
const CustomThumb = ({
  width,
  height,
  positionStyle,
  currentColor,
  adaptiveColor,
}: RenderThumbProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: currentColor.value,
    borderColor: adaptiveColor.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: width / 2,
          borderWidth: 2,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 3,
        },
        animatedStyle,
        positionStyle,
      ]}
    />
  );
};

const TenMinutePlanner: React.FC<TenMinutePlannerProps> = ({
  isDark,
  subjects,
  blocks,
  onBlockChange,
  onBlockStatusChange,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  startHour = 0,
  endHour: _endHour = 24,
  editable = true,
  theme,
  showSubjectModalExternal = false,
  onCloseSubjectModal,
  showManageModalExternal = false,
  onCloseManageModal,
}) => {
  // 테마 기반 색상
  const gridBorderColor = isDark
    ? theme?.card.borderColor.dark || '#3A3A3A'
    : theme?.card.borderColor.light || '#E0E0E0';
  const emptyBlockBg = isDark
    ? theme?.grid.emptyBlock.dark || '#2A2A2A'
    : theme?.grid.emptyBlock.light || '#F5F5F5';
  const textColor = isDark
    ? theme?.text.primary.dark || '#FFFFFF'
    : theme?.text.primary.light || '#1A1A1A';
  const subtextColor = isDark
    ? theme?.text.secondary.dark || '#666666'
    : theme?.text.secondary.light || '#999999';
  const accentColor = theme?.colors.accent || '#007AFF';
  const cardBg = isDark
    ? theme?.card.dark || '#2A2A2A'
    : theme?.card.light || '#FFFFFF';
  const dividerColor = isDark
    ? theme?.card.borderColor.dark || '#3A3A3A'
    : theme?.card.borderColor.light || '#E0E0E0';

  // 테마별 timetable 스타일 - 고정값으로 더 크게 설정
  const cellBorderRadius = theme?.timetable.cell.borderRadius || theme?.grid.borderRadius || 4;
  const cellBorderWidth = theme?.timetable.cell.borderWidth || theme?.grid.borderWidth || 0.5;
  const cellMinHeight = 36; // 세로 높이 증가 (기존 28)
  const timeColumnWidth = 18; // 시간 컬럼 너비 더 축소
  const timeColumnMargin = 2; // 여백 최소화
  const timeColumnFontSize = theme?.timetable.timeColumn.fontSize || 10;
  const filledOpacity = theme?.timetable.filled.opacity || 0.9;
  const modalBorderRadius = theme?.modal.borderRadius || 16;
  const buttonBorderRadius = theme?.button.borderRadius || 8;
  const inputBorderRadius = theme?.input.borderRadius || 8;
  const inputBorderStyle = theme?.input.borderStyle || 'solid';

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(
    subjects[0] || null
  );

  // 과목 추가/수정 모달 상태
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);

  // 커스텀 색상 피커 모달 상태
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [tempCustomColor, setTempCustomColor] = useState('#007AFF');

  // 선택된 블록 상태 (인라인 편집용)
  const [editingBlock, setEditingBlock] = useState<{hour: number; minute: number} | null>(null);
  const [blockMemo, setBlockMemo] = useState('');
  const [isEditingMemo, setIsEditingMemo] = useState(false); // 메모 수정 모드

  // 외부에서 추가 모달 열기
  useEffect(() => {
    if (showSubjectModalExternal) {
      setEditingSubject(null);
      setNewSubjectName('');
      setNewSubjectColor(SUBJECT_COLORS[0]);
      setShowSubjectModal(true);
    }
  }, [showSubjectModalExternal]);

  // 외부에서 관리 모달 열기
  useEffect(() => {
    if (showManageModalExternal) {
      setShowManageModal(true);
    }
  }, [showManageModalExternal]);

  // 추가/수정 모달 닫기 핸들러
  const closeModal = useCallback(() => {
    setShowSubjectModal(false);
    setNewSubjectName('');
    setNewSubjectColor(SUBJECT_COLORS[0]);
    setEditingSubject(null);
    onCloseSubjectModal?.();
  }, [onCloseSubjectModal]);

  // 관리 모달 닫기 핸들러
  const closeManageModal = useCallback(() => {
    setShowManageModal(false);
    onCloseManageModal?.();
  }, [onCloseManageModal]);

  // 관리 모달에서 수정 버튼 클릭
  const handleEditFromManage = (subject: Subject) => {
    setShowManageModal(false);
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectColor(subject.color);
    setShowSubjectModal(true);
  };

  // 관리 모달에서 삭제
  const handleDeleteFromManage = (subject: Subject) => {
    Alert.alert(
      '과목 삭제',
      `'${subject.name}' 과목을 삭제하시겠습니까?\n해당 과목의 기록은 유지됩니다.`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            onDeleteSubject?.(subject.id);
            if (selectedSubject?.id === subject.id) {
              setSelectedSubject(subjects.filter(s => s.id !== subject.id)[0] || null);
            }
          },
        },
      ]
    );
  };

  // startHour부터 시작해서 24시간 순환 표시 (예: 6시 시작 → 6,7,...,23,0,1,2,3,4,5)
  const hours = Array.from({length: 24}, (_, i) => (startHour + i) % 24);
  const minutes = [0, 10, 20, 30, 40, 50];

  // 블록 상태 가져오기
  const getBlockState = (hour: number, minute: number): string | null => {
    const block = blocks.find(b => b.hour === hour && b.minute === minute);
    return block?.subjectId || null;
  };

  // 블록 색상 가져오기
  const getBlockColor = (subjectId: string | null): string => {
    if (!subjectId) {return 'transparent';}
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#007AFF';
  };

  // 블록 메모 가져오기
  const getBlockMemo = (hour: number, minute: number): string | undefined => {
    const block = blocks.find(b => b.hour === hour && b.minute === minute);
    return block?.memo;
  };

  // 블록 완료 상태 가져오기
  const getBlockStatus = (hour: number, minute: number): TimeBlockStatus => {
    const block = blocks.find(b => b.hour === hour && b.minute === minute);
    return block?.status || 'incomplete';
  };

  // 블록 롱프레스 핸들러 (인라인 편집 열기)
  const handleBlockLongPress = (hour: number, minute: number) => {
    if (!editable || !onBlockChange) {return;}

    const block = blocks.find(b => b.hour === hour && b.minute === minute);
    if (!block) {return;} // 색칠된 블록만 선택 가능

    setEditingBlock({hour, minute});
    setBlockMemo(block.memo || '');
  };

  // 메모 저장
  const handleSaveMemo = () => {
    if (!editingBlock || !onBlockChange) {return;}

    const newBlocks = blocks.map(b => {
      if (b.hour === editingBlock.hour && b.minute === editingBlock.minute) {
        return {...b, memo: blockMemo.trim() || undefined};
      }
      return b;
    });

    onBlockChange(newBlocks);
    setIsEditingMemo(false);
  };


  // 블록 터치 핸들러
  const handleBlockPress = (hour: number, minute: number) => {
    if (!editable || !onBlockChange) {return;}

    const existingBlock = blocks.find(b => b.hour === hour && b.minute === minute);

    if (existingBlock) {
      // 이미 색칠된 블록: 선택하여 메모 보기/삭제 가능
      setEditingBlock({hour, minute});
      setBlockMemo(existingBlock.memo || '');
    } else if (selectedSubject) {
      // 빈 블록 + 과목 선택됨: 색칠
      const newBlocks = [...blocks, {hour, minute, subjectId: selectedSubject.id}];
      onBlockChange(newBlocks);
    }
    // 빈 블록 + 과목 선택 안 됨: 아무 동작 안 함
  };

  // 총 공부 시간 계산 (분)
  const getTotalMinutes = () => blocks.length * 10;

  // 과목별 시간 계산
  const getSubjectMinutes = (subjectId: string) => {
    return blocks.filter(b => b.subjectId === subjectId).length * 10;
  };

  // 시간 포맷
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {return `${h}시간 ${m > 0 ? `${m}분` : ''}`;}
    return `${m}분`;
  };

  // 과목 수정 모달 열기
  const openEditSubjectModal = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectColor(subject.color);
    setShowSubjectModal(true);
  };

  // 과목 저장
  const handleSaveSubject = () => {
    if (!newSubjectName.trim()) {
      Alert.alert('알림', '과목 이름을 입력해주세요.');
      return;
    }

    if (editingSubject) {
      // 수정
      onUpdateSubject?.(editingSubject.id, {
        name: newSubjectName.trim(),
        color: newSubjectColor,
      });
    } else {
      // 추가
      onAddSubject?.({
        name: newSubjectName.trim(),
        color: newSubjectColor,
      });
    }

    closeModal();
  };

  // 과목 삭제
  const handleDeleteSubject = () => {
    if (!editingSubject) {return;}

    Alert.alert(
      '과목 삭제',
      `'${editingSubject.name}' 과목을 삭제하시겠습니까?\n해당 과목의 기록은 유지됩니다.`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            onDeleteSubject?.(editingSubject.id);
            if (selectedSubject?.id === editingSubject.id) {
              setSelectedSubject(subjects[0] || null);
            }
            closeModal();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.innerContainer}>
      {/* 헤더 - NotebookCard에서 이미 제목 표시하므로 간소화 */}
      <View style={styles.header}>
        <View style={styles.totalTime}>
          <Text style={[styles.totalTimeText, {color: textColor}]}>
            총 {formatMinutes(getTotalMinutes())}
          </Text>
        </View>
      </View>

      {/* 과목 선택 */}
      {editable && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subjectSelector}
            contentContainerStyle={styles.subjectSelectorContent}>
            {subjects.map(subject => {
              const isSelected = selectedSubject?.id === subject.id;
              return (
                <View key={subject.id} style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TouchableOpacity
                    style={[
                      styles.subjectChip,
                      {
                        backgroundColor: subject.color + '20',
                        borderColor: isSelected ? subject.color : 'transparent',
                        marginRight: isSelected ? sp(4) : undefined,
                      },
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedSubject(null);
                      } else {
                        setSelectedSubject(subject);
                      }
                    }}>
                    <View style={[styles.subjectDot, {backgroundColor: subject.color}]} />
                    <Text style={[styles.subjectName, {color: subject.color}]}>
                      {subject.name}
                    </Text>
                    <Text style={[styles.subjectTime, {color: subject.color}]}>
                      {formatMinutes(getSubjectMinutes(subject.id))}
                    </Text>
                  </TouchableOpacity>
                  {/* 선택된 과목에 수정/삭제 버튼 표시 */}
                  {isSelected && (
                    <View style={{flexDirection: 'row', gap: sp(4), marginRight: sp(8)}}>
                      <TouchableOpacity
                        style={{
                          backgroundColor: subject.color + '30',
                          paddingHorizontal: sp(8),
                          paddingVertical: sp(6),
                          borderRadius: sp(8),
                        }}
                        onPress={() => openEditSubjectModal(subject)}>
                        <Icon name="pencil" size={iconSize(14)} color={subject.color} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#FF3B30' + '20',
                          paddingHorizontal: sp(8),
                          paddingVertical: sp(6),
                          borderRadius: sp(8),
                        }}
                        onPress={() => handleDeleteFromManage(subject)}>
                        <Icon name="trash-outline" size={iconSize(14)} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 타임테이블 그리드 */}
      <View style={styles.gridWrapper}>
        {/* 분 라벨 (상단) */}
        <View style={styles.minuteLabelsTop}>
          <View style={{width: timeColumnWidth + timeColumnMargin}} />
          <View style={styles.minuteLabelsRow}>
            {minutes.map(minute => (
              <Text
                key={minute}
                style={[styles.minuteLabel, {color: subtextColor}]}>
                {minute}분
              </Text>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.gridScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          <View style={styles.gridContainer}>
            {/* 시간 라벨 */}
            <View style={[styles.timeLabels, {width: timeColumnWidth, marginRight: timeColumnMargin}]}>
              {hours.map(hour => (
                <View key={hour} style={[styles.timeLabelRow, {height: cellMinHeight}]}>
                  <Text style={[styles.timeLabel, {color: subtextColor, fontSize: timeColumnFontSize}]}>
                    {hour}
                  </Text>
                </View>
              ))}
            </View>

            {/* 그리드 */}
            <View style={styles.grid}>
              {hours.map(hour => (
                <View key={hour} style={[styles.hourRow, {gap: theme?.grid.gap || 2, height: cellMinHeight}]}>
                  {minutes.map(minute => {
                    const subjectId = getBlockState(hour, minute);
                    const color = getBlockColor(subjectId);
                    const isFilled = !!subjectId;
                    const hasMemo = !!getBlockMemo(hour, minute);
                    const status = getBlockStatus(hour, minute);

                    return (
                      <TouchableOpacity
                        key={`${hour}-${minute}`}
                        style={[
                          styles.block,
                          {
                            backgroundColor: emptyBlockBg,
                            borderColor: gridBorderColor,
                            borderWidth: cellBorderWidth,
                            borderRadius: cellBorderRadius,
                          },
                        ]}
                        onPress={() => handleBlockPress(hour, minute)}
                        onLongPress={() => handleBlockLongPress(hour, minute)}
                        delayLongPress={300}
                        activeOpacity={0.7}>
                        {/* 색칠된 내부 영역 */}
                        {isFilled && (
                          <View
                            style={[
                              styles.blockFill,
                              {
                                backgroundColor: color,
                                borderRadius: Math.max(0, cellBorderRadius - 2),
                                opacity: status === 'completed' ? filledOpacity : 0.5,
                              },
                            ]}
                          />
                        )}
                        {/* 메모가 있으면 점 표시 */}
                        {hasMemo && (
                          <View style={styles.memoDot} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 선택된 블록 정보 또는 범례 */}
      {editingBlock ? (() => {
        const block = blocks.find(b => b.hour === editingBlock.hour && b.minute === editingBlock.minute);
        const subject = block ? subjects.find(s => s.id === block.subjectId) : null;
        const hasMemo = !!block?.memo;
        const blockStatus = getBlockStatus(editingBlock.hour, editingBlock.minute);
        return (
          <View style={[styles.selectedBlockInfo, {backgroundColor: subject ? subject.color + '10' : cardBg, borderColor: dividerColor}]}>
            {/* 상단: 시간 + 과목 + 닫기 버튼 */}
            <View style={styles.selectedBlockHeader}>
              <View style={styles.selectedBlockLeft}>
                <Text style={[styles.selectedBlockTime, {color: textColor}]}>
                  {editingBlock.hour}:{String(editingBlock.minute).padStart(2, '0')}
                </Text>
                {subject && (
                  <View style={[styles.selectedBlockSubject, {backgroundColor: subject.color + '20'}]}>
                    <View style={[styles.subjectDot, {backgroundColor: subject.color}]} />
                    <Text style={[styles.selectedBlockSubjectText, {color: subject.color}]}>{subject.name}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.closeButton, {backgroundColor: dividerColor}]}
                onPress={() => {
                  setEditingBlock(null);
                  setBlockMemo('');
                  setIsEditingMemo(false);
                }}>
                <Icon name="close" size={iconSize(16)} color={textColor} />
              </TouchableOpacity>
            </View>
            {/* 중간: 메모 표시 또는 입력 */}
            {isEditingMemo ? (
              <View style={styles.memoEditContainer}>
                <TextInput
                  style={[
                    styles.inlineMemoInput,
                    {
                      color: textColor,
                      borderColor: dividerColor,
                      backgroundColor: emptyBlockBg,
                    },
                  ]}
                  placeholder="메모를 입력하세요..."
                  placeholderTextColor={subtextColor}
                  value={blockMemo}
                  onChangeText={setBlockMemo}
                  multiline
                  numberOfLines={2}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.memoSaveButton, {backgroundColor: accentColor}]}
                  onPress={handleSaveMemo}>
                  <Text style={styles.memoSaveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            ) : hasMemo ? (
              <TouchableOpacity
                style={styles.memoDisplayContainer}
                onPress={() => setIsEditingMemo(true)}>
                <Text style={[styles.memoQuote, {color: subtextColor}]}>"</Text>
                <Text style={[styles.memoDisplayText, {color: textColor}]}>{block?.memo}</Text>
                <Text style={[styles.memoQuote, styles.memoQuoteEnd, {color: subtextColor}]}>"</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addMemoButton, {borderColor: dividerColor}]}
                onPress={() => setIsEditingMemo(true)}>
                <Icon name="add" size={iconSize(16)} color={subtextColor} />
                <Text style={[styles.addMemoButtonText, {color: subtextColor}]}>메모 추가</Text>
              </TouchableOpacity>
            )}
            {/* 하단: 삭제 + 완료 토글 버튼 */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.deleteActionButton, {borderColor: '#FF6B6B'}]}
                onPress={() => {
                  if (block) {
                    const newBlocks = blocks.filter(b => !(b.hour === editingBlock.hour && b.minute === editingBlock.minute));
                    onBlockChange?.(newBlocks);
                  }
                  setEditingBlock(null);
                  setBlockMemo('');
                  setIsEditingMemo(false);
                }}>
                <Icon name="trash-outline" size={iconSize(16)} color="#FF6B6B" />
                <Text style={styles.deleteActionText}>삭제</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    borderColor: blockStatus === 'completed' ? '#4CAF50' : subtextColor,
                    backgroundColor: blockStatus === 'completed' ? '#4CAF50' : 'transparent',
                  },
                ]}
                onPress={() => onBlockStatusChange?.(editingBlock.hour, editingBlock.minute)}>
                <Icon
                  name={blockStatus === 'completed' ? 'checkmark' : 'ellipse-outline'}
                  size={iconSize(16)}
                  color={blockStatus === 'completed' ? '#FFFFFF' : subtextColor}
                />
                <Text style={[
                  styles.statusButtonText,
                  {color: blockStatus === 'completed' ? '#FFFFFF' : subtextColor},
                ]}>
                  {blockStatus === 'completed' ? '완료됨' : '미완료'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })() : (
        <View style={[styles.legend, {borderTopColor: gridBorderColor}]}>
          <Text style={[styles.legendText, {color: subtextColor}]}>
            터치: 기록/선택
          </Text>
        </View>
      )}

      {/* 과목 추가/수정 모달 */}
      <Modal
        visible={showSubjectModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (showColorPickerModal) {
            setShowColorPickerModal(false);
          } else {
            closeModal();
          }
        }}>
        <TouchableOpacity
          style={showColorPickerModal ? styles.colorPickerModalOverlay : styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (showColorPickerModal) {
              setShowColorPickerModal(false);
            } else {
              closeModal();
            }
          }}>
          <TouchableOpacity
            activeOpacity={1}
            style={showColorPickerModal
              ? [styles.colorPickerContainer, {backgroundColor: cardBg, borderRadius: modalBorderRadius}]
              : [styles.modalContent, {backgroundColor: cardBg, borderRadius: modalBorderRadius}]
            }>
            {showColorPickerModal ? (
              <>
                <Text style={[styles.modalTitle, {color: textColor}]}>커스텀 색상</Text>

                {/* 색상 미리보기 + Hex 입력 */}
                <View style={styles.colorPreviewContainer}>
                  <View style={[styles.colorPreviewBox, {backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(tempCustomColor) ? tempCustomColor : '#007AFF'}]} />
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        color: textColor,
                        borderColor: dividerColor,
                        backgroundColor: emptyBlockBg,
                      },
                    ]}
                    value={tempCustomColor.toUpperCase()}
                    onChangeText={(text) => {
                      // # 없으면 추가
                      let hex = text.startsWith('#') ? text : '#' + text;
                      // 유효한 hex 형식인지 확인
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                        setTempCustomColor(hex.toUpperCase());
                      }
                    }}
                    onEndEditing={() => {
                      // 입력 완료시 유효한 6자리 hex가 아니면 기본값으로
                      if (!/^#[0-9A-Fa-f]{6}$/.test(tempCustomColor)) {
                        setTempCustomColor('#007AFF');
                      }
                    }}
                    placeholder="#000000"
                    placeholderTextColor={subtextColor}
                    maxLength={7}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                {/* 색상 피커 */}
                <View style={styles.colorPickerWrapper}>
                  <ColorPicker
                    value={/^#[0-9A-Fa-f]{6}$/.test(tempCustomColor) ? tempCustomColor : '#007AFF'}
                    onCompleteJS={(colors) => setTempCustomColor(colors.hex.toUpperCase())}
                    thumbSize={28}
                    renderThumb={CustomThumb}
                    boundedThumb>
                    <Panel1 style={styles.colorPanel} />
                    <HueSlider
                      style={styles.hueSlider}
                      renderThumb={CustomThumb}
                    />
                  </ColorPicker>
                  {/* 프리셋 색상 (ColorPicker 외부) */}
                  <View style={styles.presetColorsContainer}>
                    {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3', '#FF69B4', '#00CED1', '#8B4513'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.presetColor, {backgroundColor: color}]}
                        onPress={() => setTempCustomColor(color)}
                      />
                    ))}
                  </View>
                </View>

                {/* 버튼들 */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: dividerColor, borderRadius: buttonBorderRadius}]}
                    onPress={() => setShowColorPickerModal(false)}>
                    <Text style={[styles.modalButtonText, {color: textColor}]}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: accentColor, borderRadius: buttonBorderRadius}]}
                    onPress={() => {
                      setNewSubjectColor(tempCustomColor);
                      setShowColorPickerModal(false);
                    }}>
                    <Text style={styles.saveButtonText}>선택</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, {color: textColor}]}>
                  {editingSubject ? '과목 수정' : '과목 추가'}
                </Text>

                {/* 과목 이름 입력 */}
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: textColor,
                      borderColor: dividerColor,
                      backgroundColor: emptyBlockBg,
                      borderRadius: inputBorderRadius,
                      borderStyle: inputBorderStyle as any,
                    },
                  ]}
                  placeholder="과목 이름"
                  placeholderTextColor={subtextColor}
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  autoFocus
                />

                {/* 색상 선택 */}
                <Text style={[styles.colorLabel, {color: subtextColor}]}>색상 선택</Text>
                <View style={styles.colorGrid}>
                  {SUBJECT_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        {backgroundColor: color},
                        newSubjectColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewSubjectColor(color)}>
                      {newSubjectColor === color && (
                        <Icon name="checkmark" size={iconSize(16)} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {/* 커스텀 색상 버튼 */}
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      styles.customColorButton,
                      {borderColor: dividerColor},
                      !SUBJECT_COLORS.includes(newSubjectColor) && {
                        backgroundColor: newSubjectColor,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: 3,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setTempCustomColor(newSubjectColor);
                      setShowColorPickerModal(true);
                    }}>
                    {SUBJECT_COLORS.includes(newSubjectColor) ? (
                      <Icon name="color-palette" size={iconSize(18)} color={subtextColor} />
                    ) : (
                      <Icon name="checkmark" size={iconSize(16)} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* 버튼들 */}
                <View style={styles.modalButtons}>
                  {editingSubject && (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton, {borderRadius: buttonBorderRadius}]}
                      onPress={handleDeleteSubject}>
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: dividerColor, borderRadius: buttonBorderRadius}]}
                    onPress={closeModal}>
                    <Text style={[styles.modalButtonText, {color: textColor}]}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, {backgroundColor: accentColor, borderRadius: buttonBorderRadius}]}
                    onPress={handleSaveSubject}>
                    <Text style={styles.saveButtonText}>
                      {editingSubject ? '수정' : '추가'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 과목 관리 모달 */}
      <Modal
        visible={showManageModal}
        transparent
        animationType="fade"
        onRequestClose={closeManageModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeManageModal}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, styles.manageModalContent, {backgroundColor: cardBg, borderRadius: modalBorderRadius}]}>
            <Text style={[styles.modalTitle, {color: textColor}]}>과목 관리</Text>

            {subjects.length === 0 ? (
              <View style={styles.emptySubjects}>
                <Icon name="book-outline" size={iconSize(40)} color={subtextColor} />
                <Text style={[styles.emptySubjectsText, {color: subtextColor}]}>
                  등록된 과목이 없습니다
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.subjectList} showsVerticalScrollIndicator={false}>
                {subjects.map(subject => (
                  <View
                    key={subject.id}
                    style={[styles.subjectItem, {backgroundColor: emptyBlockBg}]}>
                    <View style={[styles.subjectItemDot, {backgroundColor: subject.color}]} />
                    <Text style={[styles.subjectItemName, {color: textColor}]} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    <Text style={[styles.subjectItemTime, {color: subtextColor}]}>
                      {formatMinutes(getSubjectMinutes(subject.id))}
                    </Text>
                    <TouchableOpacity
                      style={styles.subjectItemButton}
                      onPress={() => handleEditFromManage(subject)}>
                      <Icon name="pencil" size={iconSize(18)} color={accentColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.subjectItemButton}
                      onPress={() => handleDeleteFromManage(subject)}>
                      <Icon name="trash-outline" size={iconSize(18)} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.manageCloseButton, {backgroundColor: dividerColor, borderRadius: buttonBorderRadius}]}
              onPress={closeManageModal}>
              <Text style={[styles.manageCloseButtonText, {color: textColor}]}>닫기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: sp(16),
    padding: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.05,
    shadowRadius: sp(8),
    elevation: 2,
  },
  innerContainer: {
    // NotebookCard 내부에서 사용될 때
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  totalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  totalTimeText: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  subjectSelector: {
    marginBottom: hp(12),
  },
  subjectSelectorContent: {
    gap: sp(8),
    paddingRight: sp(8),
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(20),
    borderWidth: 2,
    gap: sp(6),
  },
  subjectDot: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
  },
  subjectName: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  subjectTime: {
    fontSize: fp(10),
    fontWeight: '500',
    opacity: 0.7,
  },
  gridScrollView: {
    maxHeight: hp(400),
  },
  gridContainer: {
    flexDirection: 'row',
  },
  timeLabels: {
    width: sp(22),
    marginRight: sp(4),
  },
  timeLabelRow: {
    height: hp(44),
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: sp(2),
  },
  timeLabel: {
    fontSize: fp(10),
    fontWeight: '500',
  },
  grid: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: hp(44),
    gap: sp(3),
  },
  block: {
    flex: 1,
    borderRadius: sp(4),
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(1),
  },
  blockFill: {
    position: 'absolute',
    top: sp(1),
    left: sp(1),
    right: sp(1),
    bottom: sp(1),
  },
  memoDot: {
    width: sp(8),
    height: sp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{rotate: '-15deg'}],
  },
  statusIcon: {
    zIndex: 2,
  },
  gridWrapper: {
    // 그리드와 상단 분 라벨을 감싸는 컨테이너
  },
  minuteLabelsTop: {
    flexDirection: 'row',
    marginBottom: hp(4),
  },
  minuteLabelSpacer: {
    width: sp(26), // timeLabels 너비 + marginRight와 동일
  },
  minuteLabelsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  minuteLabel: {
    flex: 1,
    fontSize: fp(9),
    fontWeight: '500',
    textAlign: 'center',
  },
  legend: {
    marginTop: hp(20),
    paddingTop: hp(12),
    borderTopWidth: 1,
    alignItems: 'center',
  },
  legendText: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  // 선택된 블록 정보 (인라인)
  selectedBlockInfo: {
    marginTop: hp(12),
    padding: sp(12),
    borderRadius: sp(12),
    borderWidth: 1,
    gap: sp(10),
  },
  selectedBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  selectedBlockTime: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  selectedBlockSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(4),
    borderRadius: sp(12),
    gap: sp(6),
  },
  selectedBlockSubjectText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  selectedBlockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  blockActionButton: {
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockActionButtonText: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '600',
  },
  inlineMemoInput: {
    flex: 1,
    padding: sp(10),
    borderRadius: sp(8),
    borderWidth: 1,
    fontSize: fp(13),
    minHeight: hp(50),
    textAlignVertical: 'top',
  },
  memoEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(8),
  },
  memoSaveButton: {
    paddingHorizontal: sp(14),
    paddingVertical: hp(12),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoSaveButtonText: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '600',
  },
  memoDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp(8),
    paddingHorizontal: sp(4),
  },
  memoQuote: {
    fontSize: fp(24),
    fontStyle: 'italic',
    opacity: 0.4,
    marginTop: hp(-4),
  },
  memoQuoteEnd: {
    alignSelf: 'flex-end',
    marginBottom: hp(-4),
  },
  memoDisplayText: {
    flex: 1,
    fontSize: fp(14),
    fontStyle: 'italic',
    lineHeight: fp(20),
    paddingHorizontal: sp(6),
  },
  addMemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(6),
    paddingVertical: hp(10),
    borderRadius: sp(8),
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addMemoButtonText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  // 닫기 버튼
  closeButton: {
    padding: sp(8),
    borderRadius: sp(8),
  },
  // 하단 액션 버튼들
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(4),
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingVertical: hp(6),
    paddingHorizontal: sp(12),
    borderRadius: sp(16),
    borderWidth: 1.5,
  },
  deleteActionText: {
    fontSize: fp(13),
    fontWeight: '500',
    color: '#FF6B6B',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: sp(8),
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingVertical: hp(6),
    paddingHorizontal: sp(12),
    borderRadius: sp(16),
    borderWidth: 1.5,
  },
  statusButtonActive: {
    // 활성화 시 배경색은 인라인으로 적용
  },
  statusButtonText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  colorPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  modalContent: {
    width: '100%',
    maxWidth: sp(340),
    borderRadius: sp(16),
    padding: sp(20),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(16),
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: sp(8),
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    fontSize: fp(14),
    marginBottom: hp(16),
  },
  colorLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    marginBottom: hp(8),
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
    marginBottom: hp(20),
  },
  colorOption: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  customColorButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: sp(10),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 관리 모달 스타일
  manageModalContent: {
    maxHeight: '70%',
  },
  emptySubjects: {
    alignItems: 'center',
    paddingVertical: hp(32),
    gap: sp(12),
  },
  emptySubjectsText: {
    fontSize: fp(14),
  },
  subjectList: {
    maxHeight: hp(300),
    marginBottom: hp(16),
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(8),
    marginBottom: hp(8),
  },
  subjectItemDot: {
    width: sp(14),
    height: sp(14),
    borderRadius: sp(7),
    marginRight: sp(10),
  },
  subjectItemName: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '600',
  },
  subjectItemTime: {
    fontSize: fp(12),
    marginRight: sp(8),
  },
  subjectItemButton: {
    padding: sp(8),
  },
  manageCloseButton: {
    paddingVertical: hp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  manageCloseButtonText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 메모 모달 스타일
  memoSubjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(14),
    marginBottom: hp(12),
    gap: sp(6),
  },
  memoSubjectText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  memoInput: {
    borderWidth: 1,
    borderRadius: sp(8),
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    fontSize: fp(14),
    marginBottom: hp(16),
    minHeight: hp(80),
  },
  colorPickerContainer: {
    width: '90%',
    maxWidth: sp(340),
    padding: sp(20),
    maxHeight: '85%',
  },
  colorPickerModalContent: {
    maxHeight: '85%',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(12),
    marginBottom: hp(16),
  },
  colorPreviewBox: {
    width: sp(50),
    height: sp(50),
    borderRadius: sp(12),
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorPreviewText: {
    fontSize: fp(16),
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  hexInput: {
    fontSize: fp(16),
    fontWeight: '600',
    fontFamily: 'monospace',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderWidth: 1,
    borderRadius: sp(8),
    minWidth: sp(100),
    textAlign: 'center',
  },
  colorPickerWrapper: {
    marginBottom: hp(20),
  },
  colorPanel: {
    height: hp(180),
    borderRadius: sp(12),
    marginBottom: hp(12),
  },
  hueSlider: {
    height: hp(30),
    borderRadius: sp(8),
    marginBottom: hp(12),
  },
  presetColorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: hp(8),
    gap: sp(8),
  },
  presetColor: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
  },
});

export default TenMinutePlanner;
