import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import {useTimer} from '../../hooks/useTimer';
import {THEMES, DEFAULT_THEME} from '../../constants/themes';

const PRESET_TIMES = [
  {label: '포모도로', minutes: 25},
  {label: '30분', minutes: 30},
  {label: '1시간', minutes: 60},
  {label: '90분', minutes: 90},
  {label: '2시간', minutes: 120},
];

export const TimerControls: React.FC = () => {
  const {status, start, pause, resume, stop} = useTimer();
  const [showModal, setShowModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const theme = THEMES[DEFAULT_THEME];

  const handleStart = (minutes: number) => {
    start(minutes);
    setShowModal(false);
  };

  const handleCustomStart = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes && minutes > 0 && minutes <= 999) {
      handleStart(minutes);
      setCustomMinutes('');
    }
  };

  return (
    <View style={styles.container}>
      {status === 'idle' && (
        <TouchableOpacity
          style={[styles.button, styles.startButton, {backgroundColor: theme.colors.running}]}
          onPress={() => setShowModal(true)}>
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
      )}

      {status === 'running' && (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.pauseButton]}
            onPress={pause}>
            <Text style={styles.buttonText}>일시정지</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stop}>
            <Text style={styles.buttonText}>중지</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'paused' && (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.resumeButton, {backgroundColor: theme.colors.running}]}
            onPress={resume}>
            <Text style={styles.buttonText}>재개</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stop}>
            <Text style={styles.buttonText}>중지</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'completed' && (
        <View style={styles.completedContainer}>
          <Text style={[styles.completedText, {color: theme.colors.completed}]}>
            🎉 완료!
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.startButton, {backgroundColor: theme.colors.running}]}
            onPress={() => setShowModal(true)}>
            <Text style={styles.buttonText}>다시 시작</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Time Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
              타이머 시간 설정
            </Text>

            <ScrollView style={styles.presetContainer}>
              {PRESET_TIMES.map(preset => (
                <TouchableOpacity
                  key={preset.minutes}
                  style={[styles.presetButton, {borderColor: theme.colors.running}]}
                  onPress={() => handleStart(preset.minutes)}>
                  <Text style={[styles.presetText, {color: theme.colors.text}]}>
                    {preset.label}
                  </Text>
                  <Text style={[styles.presetMinutes, {color: theme.colors.textSecondary}]}>
                    {preset.minutes}분
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.customSection}>
              <Text style={[styles.customLabel, {color: theme.colors.text}]}>
                커스텀 시간 (분)
              </Text>
              <View style={styles.customInput}>
                <TextInput
                  style={[styles.input, {color: theme.colors.text, borderColor: theme.colors.running}]}
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  keyboardType="number-pad"
                  placeholder="예: 45"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={3}
                />
                <TouchableOpacity
                  style={[styles.customButton, {backgroundColor: theme.colors.running}]}
                  onPress={handleCustomStart}
                  disabled={!customMinutes}>
                  <Text style={styles.buttonText}>시작</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}>
              <Text style={[styles.cancelText, {color: theme.colors.textSecondary}]}>
                취소
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  resumeButton: {},
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
    gap: 16,
  },
  completedText: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  presetContainer: {
    maxHeight: 300,
  },
  presetButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '600',
  },
  presetMinutes: {
    fontSize: 16,
  },
  customSection: {
    marginTop: 24,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customInput: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
  },
  customButton: {
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});
