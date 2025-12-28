import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 640);
import Icon from '@react-native-vector-icons/ionicons';
import {sp, hp, fp, iconSize, touchSize} from '../utils/responsive';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import {launchImageLibrary} from 'react-native-image-picker';
import {Canvas, LinearGradient as SkiaLinearGradient, Rect, vec} from '@shopify/react-native-skia';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

interface StudyStoryCardProps {
  isDark: boolean;
  selectedDate: Date;
  totalStudyTime: number; // 분 단위
  studyCount: number; // 공부 세션 수
  onClose: () => void;
}

const StudyStoryCard: React.FC<StudyStoryCardProps> = ({
  isDark,
  selectedDate,
  totalStudyTime,
  studyCount,
  onClose,
}) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('꾸준히 하면 성공이에요!');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(customMessage);

  // 사용자 추가 텍스트 목록
  const [customTexts, setCustomTexts] = useState<Array<{
    id: string;
    text: string;
    position: Animated.ValueXY;
    scale: number;
    color: string;
    fontSize: number;
    currentY: number;
  }>>([]);

  // customText responders를 저장
  const customTextRespondersRef = useRef<{[key: string]: any}>({});

  // 편집 모드
  const [isEditingCustomText, setIsEditingCustomText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [tempCustomText, setTempCustomText] = useState('');
  const [selectedCustomTextId, setSelectedCustomTextId] = useState<string | null>(null);

  const colorOptions = ['#FFFFFF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8ED4'];
  const fontSizeOptions = [16, 20, 24, 28, 32, 40];

  // Draggable positions
  const datePosition = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const mainStatPosition = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const sessionPosition = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const avgTimePosition = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const messagePosition = useRef(new Animated.ValueXY({x: 0, y: 0})).current;

  // Scales
  const [dateScale, setDateScale] = useState(1);
  const [mainStatScale, setMainStatScale] = useState(1);
  const [sessionScale, setSessionScale] = useState(1);
  const [avgTimeScale, setAvgTimeScale] = useState(1);
  const [messageScale, setMessageScale] = useState(1);

  // Date styling
  const [dateColor, setDateColor] = useState('#FFFFFF');
  const [dateFontSize, setDateFontSize] = useState(18);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [dateFormat, setDateFormat] = useState(0); // 0: 기본, 1: 시간 포함, 2: 년도 포함, 3: 간단
  const [isDateVisible, setIsDateVisible] = useState(true);
  const [dateCurrentY, setDateCurrentY] = useState(0);

  // Main Stat (Focus Time) styling
  const [mainStatColor, setMainStatColor] = useState('#FFFFFF');
  const [mainStatFontSize, setMainStatFontSize] = useState(40);
  const [isMainStatSelected, setIsMainStatSelected] = useState(false);
  const [isMainStatVisible, setIsMainStatVisible] = useState(true);
  const [mainStatCurrentY, setMainStatCurrentY] = useState(0);

  // Session styling
  const [sessionColor, setSessionColor] = useState('#FFFFFF');
  const [sessionFontSize, setSessionFontSize] = useState(22);
  const [isSessionSelected, setIsSessionSelected] = useState(false);
  const [isSessionVisible, setIsSessionVisible] = useState(true);
  const [sessionCurrentY, setSessionCurrentY] = useState(0);

  // Average Time styling
  const [avgTimeColor, setAvgTimeColor] = useState('#FFFFFF');
  const [avgTimeFontSize, setAvgTimeFontSize] = useState(22);
  const [isAvgTimeSelected, setIsAvgTimeSelected] = useState(false);
  const [isAvgTimeVisible, setIsAvgTimeVisible] = useState(true);
  const [avgTimeCurrentY, setAvgTimeCurrentY] = useState(0);

  // Message styling
  const [messageColor, setMessageColor] = useState('#FFFFFF');
  const [messageFontSize, setMessageFontSize] = useState(15);
  const [isMessageSelected, setIsMessageSelected] = useState(false);
  const [messageCurrentY, setMessageCurrentY] = useState(0);

  // Scroll control
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const createCombinedResponder = (
    position: Animated.ValueXY,
    scaleState: number,
    setScaleState: (scale: number) => void,
    setCurrentY?: (y: number) => void,
    onSingleTap?: () => void,
    _onDoubleTap?: () => void // 더블탭은 사용하지 않음
  ) => {
    let initialDistance = 0;
    let initialScale = 1;
    let isPinching = false;
    let hasMoved = false;
    let offsetY = 0;
    let offsetSet = false;

    return PanResponder.create({
      onStartShouldSetPanResponder: (evt) => true,
      onStartShouldSetPanResponderCapture: (evt) => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 두 손가락이거나 움직임이 있으면 드래그 시작
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        if (moved || evt.nativeEvent.touches.length === 2) {
          setScrollEnabled(false);
        }
        return evt.nativeEvent.touches.length === 2 || moved;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        return evt.nativeEvent.touches.length === 2 || moved;
      },
      onPanResponderGrant: (evt) => {
        hasMoved = false;
        offsetSet = false;
        setScrollEnabled(false);
        if (evt.nativeEvent.touches.length === 2) {
          // 핀치 시작
          isPinching = true;
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          initialDistance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          initialScale = scaleState;
        } else {
          // 드래그 준비 (아직 offset 설정 안함)
          isPinching = false;
          offsetY = position.y._value;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        if (moved) {
          hasMoved = true;
        }

        if (evt.nativeEvent.touches.length === 2) {
          // 핀치 동작
          isPinching = true;
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          if (initialDistance > 0) {
            const scale = (distance / initialDistance) * initialScale;
            setScaleState(Math.max(0.5, Math.min(scale, 3)));
          }
        } else if (!isPinching && hasMoved) {
          // 드래그 동작 - 실제로 움직일 때만 offset 설정
          if (!offsetSet) {
            position.setOffset({
              x: position.x._value,
              y: position.y._value,
            });
            position.setValue({x: 0, y: 0});
            offsetSet = true;
          }
          position.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });
          // 현재 Y 위치 업데이트 (offset + current value)
          if (setCurrentY) {
            const currentY = offsetY + gestureState.dy;
            setCurrentY(currentY);
          }
        }
      },
      onPanResponderRelease: () => {
        if (!isPinching && hasMoved && offsetSet) {
          position.flattenOffset();
          // 최종 Y 위치 업데이트
          if (setCurrentY) {
            setCurrentY(position.y._value);
          }
        } else if (!isPinching && !hasMoved) {
          // 탭 이벤트 처리 - 싱글탭만 지원
          if (onSingleTap) {
            onSingleTap();
          }
        }
        isPinching = false;
        hasMoved = false;
        offsetSet = false;
        initialDistance = 0;
        setScrollEnabled(true);
      },
    });
  };

  const dateResponder = useRef(createCombinedResponder(datePosition, dateScale, setDateScale, setDateCurrentY)).current;
  const mainStatResponder = useRef(createCombinedResponder(mainStatPosition, mainStatScale, setMainStatScale, setMainStatCurrentY)).current;
  const sessionResponder = useRef(createCombinedResponder(sessionPosition, sessionScale, setSessionScale, setSessionCurrentY)).current;
  const avgTimeResponder = useRef(createCombinedResponder(avgTimePosition, avgTimeScale, setAvgTimeScale, setAvgTimeCurrentY)).current;
  const messageResponder = useRef(createCombinedResponder(messagePosition, messageScale, setMessageScale, setMessageCurrentY)).current;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  const formatDate = (date: Date, format: number) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    switch (format) {
      case 1: // 시간 포함
        return `${month}월 ${day}일 (${weekDay}) ${ampm} ${displayHours}:${displayMinutes}`;
      case 2: // 년도 포함
        return `${year}년 ${month}월 ${day}일 ${weekDay}요일`;
      case 3: // 간단
        return `${month}.${day} (${weekDay})`;
      default: // 기본
        return `${month}월 ${day}일 ${weekDay}요일`;
    }
  };

  const selectBackgroundImage = async () => {
    // Android 권한 확인
    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;

      if (androidVersion >= 33) {
        // Android 13+ : READ_MEDIA_IMAGES 권한 필요
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: '사진 접근 권한 필요',
            message: '배경 사진을 선택하려면 사진 접근 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            '권한 필요',
            '설정에서 사진 접근 권한을 허용해주세요.',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => {
                const {Linking} = require('react-native');
                Linking.openSettings();
              }},
            ]
          );
          return;
        }
      } else {
        // Android 12 이하 : READ_EXTERNAL_STORAGE 권한 필요
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: '저장소 권한 필요',
            message: '배경 사진을 선택하려면 저장소 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            '권한 필요',
            '설정에서 저장소 권한을 허용해주세요.',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => {
                const {Linking} = require('react-native');
                Linking.openSettings();
              }},
            ]
          );
          return;
        }
      }
    }

    // iOS는 react-native-image-picker가 자동으로 권한 요청함
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          if (response.errorCode === 'permission') {
            Alert.alert(
              '권한 필요',
              '설정에서 사진 접근 권한을 허용해주세요.',
              [
                {text: '취소', style: 'cancel'},
                {text: '설정으로 이동', onPress: () => {
                  const {Linking} = require('react-native');
                  Linking.openSettings();
                }},
              ]
            );
          } else {
            Alert.alert('오류', '이미지를 불러올 수 없습니다.');
          }
          return;
        }
        if (response.assets && response.assets[0].uri) {
          setBackgroundImage(response.assets[0].uri);
        }
      }
    );
  };

  const addCustomText = (x: number = 0, y: number = 0) => {
    const newText = {
      id: Date.now().toString(),
      text: '텍스트 입력',
      position: new Animated.ValueXY({x, y}),
      scale: 1,
      color: '#FFFFFF',
      fontSize: 20,
      currentY: y,
    };
    setCustomTexts([...customTexts, newText]);
    setSelectedCustomTextId(newText.id);
    setIsMessageSelected(false);
    // 바로 편집 모드로
    setEditingTextId(newText.id);
    setTempCustomText('텍스트 입력');
    setIsEditingCustomText(true);
  };

  const deleteCustomText = (id: string) => {
    setCustomTexts(prev => prev.filter(t => t.id !== id));
    // responder도 삭제
    delete customTextRespondersRef.current[id];
  };

  const updateCustomTextScale = (id: string, newScale: number) => {
    setCustomTexts(prev => prev.map(t =>
      t.id === id ? {...t, scale: newScale} : t
    ));
  };

  const updateCustomTextColor = (id: string, newColor: string) => {
    setCustomTexts(prev => prev.map(t =>
      t.id === id ? {...t, color: newColor} : t
    ));
  };

  const updateCustomTextFontSize = (id: string, newSize: number) => {
    setCustomTexts(prev => prev.map(t =>
      t.id === id ? {...t, fontSize: newSize} : t
    ));
  };

  const updateCustomTextCurrentY = (id: string, newY: number) => {
    setCustomTexts(prev => prev.map(t =>
      t.id === id ? {...t, currentY: newY} : t
    ));
  };

  const editCustomTextContent = (id: string) => {
    const text = customTexts.find(t => t.id === id);
    if (text) {
      setEditingTextId(id);
      setTempCustomText(text.text);
      setIsEditingCustomText(true);
    }
  };

  const saveCustomTextContent = () => {
    if (editingTextId) {
      setCustomTexts(prev => prev.map(t =>
        t.id === editingTextId ? {...t, text: tempCustomText} : t
      ));
      setIsEditingCustomText(false);
      setEditingTextId(null);
    }
  };

  const handleShare = async () => {
    try {
      // 선택 상태 저장
      const wasDateSelected = isDateSelected;
      const wasMainStatSelected = isMainStatSelected;
      const wasSessionSelected = isSessionSelected;
      const wasAvgTimeSelected = isAvgTimeSelected;
      const wasMessageSelected = isMessageSelected;
      const wasCustomTextSelected = selectedCustomTextId;

      // 모든 선택 해제
      setIsDateSelected(false);
      setIsMainStatSelected(false);
      setIsSessionSelected(false);
      setIsAvgTimeSelected(false);
      setIsMessageSelected(false);
      setSelectedCustomTextId(null);

      // 상태가 반영될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      setIsCapturing(true);

      // 뷰를 이미지로 캡처
      const uri = await viewShotRef.current?.capture?.();

      if (!uri) {
        Alert.alert('오류', '이미지 생성에 실패했습니다.');
        return;
      }

      // 공유 옵션
      const shareOptions = {
        title: '오늘 공부 완료!',
        message: `${formatDate(selectedDate, 0)}\n오늘 ${formatTime(totalStudyTime)} 집중했어요! 🔥`,
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
        type: 'image/png',
      };

      await Share.open(shareOptions);

      // 선택 상태 복원
      setIsDateSelected(wasDateSelected);
      setIsMainStatSelected(wasMainStatSelected);
      setIsSessionSelected(wasSessionSelected);
      setIsAvgTimeSelected(wasAvgTimeSelected);
      setIsMessageSelected(wasMessageSelected);
      setSelectedCustomTextId(wasCustomTextSelected);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleScreenshot = async () => {
    try {
      // Android 권한 확인 (API 33 이상은 READ_MEDIA_IMAGES, 이하는 WRITE_EXTERNAL_STORAGE)
      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version;

        if (androidVersion >= 33) {
          // Android 13+ : READ_MEDIA_IMAGES 권한 필요
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: '사진 접근 권한 필요',
              message: '스크린샷을 갤러리에 저장하려면 사진 접근 권한이 필요합니다.',
              buttonNeutral: '나중에',
              buttonNegative: '취소',
              buttonPositive: '확인',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              '권한 필요',
              '설정에서 사진 접근 권한을 허용해주세요.',
              [
                {text: '취소', style: 'cancel'},
                {text: '설정으로 이동', onPress: () => {
                  const {Linking} = require('react-native');
                  Linking.openSettings();
                }},
              ]
            );
            return;
          }
        } else {
          // Android 12 이하 : WRITE_EXTERNAL_STORAGE 권한 필요
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: '저장소 권한 필요',
              message: '스크린샷을 저장하려면 저장소 권한이 필요합니다.',
              buttonNeutral: '나중에',
              buttonNegative: '취소',
              buttonPositive: '확인',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              '권한 필요',
              '설정에서 저장소 권한을 허용해주세요.',
              [
                {text: '취소', style: 'cancel'},
                {text: '설정으로 이동', onPress: () => {
                  const {Linking} = require('react-native');
                  Linking.openSettings();
                }},
              ]
            );
            return;
          }
        }
      }

      // 선택 상태 저장
      const wasDateSelected = isDateSelected;
      const wasMainStatSelected = isMainStatSelected;
      const wasSessionSelected = isSessionSelected;
      const wasAvgTimeSelected = isAvgTimeSelected;
      const wasMessageSelected = isMessageSelected;
      const wasCustomTextSelected = selectedCustomTextId;

      // 모든 선택 해제
      setIsDateSelected(false);
      setIsMainStatSelected(false);
      setIsSessionSelected(false);
      setIsAvgTimeSelected(false);
      setIsMessageSelected(false);
      setSelectedCustomTextId(null);

      // 상태가 반영될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      setIsCapturing(true);

      // 뷰를 이미지로 캡처
      const uri = await viewShotRef.current?.capture?.();

      if (!uri) {
        Alert.alert('오류', '이미지 생성에 실패했습니다.');
        return;
      }

      // 갤러리에 저장
      await CameraRoll.saveToCameraRoll(uri, 'photo');

      Alert.alert('성공', '스크린샷이 갤러리에 저장되었습니다!', [
        {text: '확인', onPress: () => {}},
      ]);

      // 선택 상태 복원
      setIsDateSelected(wasDateSelected);
      setIsMainStatSelected(wasMainStatSelected);
      setIsSessionSelected(wasSessionSelected);
      setIsAvgTimeSelected(wasAvgTimeSelected);
      setIsMessageSelected(wasMessageSelected);
      setSelectedCustomTextId(wasCustomTextSelected);
    } catch (error: any) {
      console.error('Screenshot error:', error);
      Alert.alert('오류', '스크린샷 저장에 실패했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.container}>
        {/* 캡처될 카드 - 고정 */}
        <ViewShot
          ref={viewShotRef}
          options={{
            format: 'png',
            quality: 1,
          }}
          style={styles.viewShot}>
          {/* Background Image or Gradient */}
          {backgroundImage ? (
            <ImageBackground
              source={{uri: backgroundImage}}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ) : (
            <Canvas style={styles.defaultBackground}>
              <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT}>
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(CARD_WIDTH, CARD_HEIGHT)}
                  colors={['#667eea', '#764ba2', '#f093fb']}
                />
              </Rect>
            </Canvas>
          )}

          {/* Close Button - Top Right X */}
          <TouchableOpacity
            style={styles.closeButtonX}
            onPress={onClose}>
            <Icon name="close" size={iconSize(24)} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Background Touch Area - 빈 공간 클릭용 */}
          <TouchableOpacity
            style={styles.backgroundTouchArea}
            activeOpacity={1}
            onPress={(e) => {
              setSelectedCustomTextId(null);
              setIsMessageSelected(false);
              setIsDateSelected(false);
              setIsMainStatSelected(false);
              setIsSessionSelected(false);
              setIsAvgTimeSelected(false);
              // 터치 위치 계산: ViewShot 기준 좌표를 cardContent의 중앙 기준 좌표로 변환
              const touchX = e.nativeEvent.locationX;
              const touchY = e.nativeEvent.locationY;

              // cardContent의 중앙 좌표 계산
              const cardContentCenterX = CARD_WIDTH / 2;
              const cardContentCenterY = CARD_HEIGHT / 2;

              // 터치 위치를 cardContent 중앙 기준으로 변환
              const relativeX = touchX - cardContentCenterX;
              const relativeY = touchY - cardContentCenterY;

              addCustomText(relativeX, relativeY);
            }}
          />

          {/* Content Layer - 터치 이벤트 통과 */}
          <View style={styles.contentLayer} pointerEvents="box-none">
          {/* Content */}
          <View style={styles.cardContent} pointerEvents="box-none">
            {/* Date - Draggable */}
            {isDateVisible && (
              <Animated.View
                style={[
                  styles.dateContainer,
                  {
                    transform: [
                      ...datePosition.getTranslateTransform(),
                      {scale: dateScale},
                    ],
                  },
                ]}
                pointerEvents="auto"
                {...dateResponder.panHandlers}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    isDateSelected && styles.selectedTextContainer,
                  ]}
                  onPress={() => {
                    setIsDateSelected(true);
                    setIsMainStatSelected(false);
                    setIsSessionSelected(false);
                    setIsAvgTimeSelected(false);
                    setIsMessageSelected(false);
                    setSelectedCustomTextId(null);
                  }}
                  delayPressIn={0}>
                  <View style={styles.textWithButtons}>
                    <Text style={[styles.dateLabel, {color: dateColor, fontSize: dateFontSize}]}>{formatDate(selectedDate, dateFormat)}</Text>
                    {isDateSelected && (
                      <View style={(80 + dateCurrentY) < (CARD_HEIGHT / 2) ? styles.textButtonGroupBottom : styles.textButtonGroup}>
                        <TouchableOpacity
                          style={styles.textButton}
                          onPress={() => {
                            setIsDateVisible(false);
                            setIsDateSelected(false);
                          }}>
                          <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.textButton}
                          onPress={() => {
                            setIsDateSelected(false);
                          }}>
                          <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Center Section - Main Stats */}
            <View style={styles.centerSection} pointerEvents="box-none">
              {isMainStatVisible && (
                <Animated.View
                  style={[
                    styles.mainStatCard,
                    {
                      transform: [
                        ...mainStatPosition.getTranslateTransform(),
                        {scale: mainStatScale},
                      ],
                    },
                  ]}
                  pointerEvents="auto"
                  {...mainStatResponder.panHandlers}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      isMainStatSelected && styles.selectedTextContainer,
                    ]}
                    onPress={() => {
                      setIsMainStatSelected(true);
                      setIsDateSelected(false);
                      setIsSessionSelected(false);
                      setIsAvgTimeSelected(false);
                      setIsMessageSelected(false);
                      setSelectedCustomTextId(null);
                    }}
                    delayPressIn={0}>
                    <View style={styles.textWithButtons}>
                      <Text style={[styles.mainStatValue, {color: mainStatColor, fontSize: mainStatFontSize}]}>{formatTime(totalStudyTime)}</Text>
                      <Text style={[styles.mainStatLabel, {color: mainStatColor, fontSize: mainStatFontSize * 0.35}]}>집중 시간</Text>
                      {isMainStatSelected && (
                        <View style={(CARD_HEIGHT * 0.35 + mainStatCurrentY) < (CARD_HEIGHT / 2) ? styles.textButtonGroupBottom : styles.textButtonGroup}>
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => {
                              setIsMainStatVisible(false);
                              setIsMainStatSelected(false);
                            }}>
                            <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => {
                              setIsMainStatSelected(false);
                            }}>
                            <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Sub Stats Row */}
              <View style={styles.subStatsRow} pointerEvents="box-none">
                {/* Session Card - Individual Draggable */}
                {isSessionVisible && (
                  <Animated.View
                    style={[
                      styles.subStatCardIndividual,
                      {
                        transform: [
                          ...sessionPosition.getTranslateTransform(),
                          {scale: sessionScale},
                        ],
                      },
                    ]}
                    pointerEvents="auto"
                    {...sessionResponder.panHandlers}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        isSessionSelected && styles.selectedTextContainer,
                      ]}
                      onPress={() => {
                        setIsSessionSelected(true);
                        setIsDateSelected(false);
                        setIsMainStatSelected(false);
                        setIsAvgTimeSelected(false);
                        setIsMessageSelected(false);
                        setSelectedCustomTextId(null);
                      }}
                      delayPressIn={0}>
                      <View style={styles.textWithButtons}>
                        <Text style={[styles.subStatValue, {color: sessionColor, fontSize: sessionFontSize}]}>{studyCount}</Text>
                        <Text style={[styles.subStatLabel, {color: sessionColor, fontSize: sessionFontSize * 0.55}]}>세션</Text>
                        {isSessionSelected && (
                          <View style={(CARD_HEIGHT * 0.35 + sessionCurrentY) < (CARD_HEIGHT / 2) ? styles.textButtonGroupBottom : styles.textButtonGroup}>
                            <TouchableOpacity
                              style={styles.textButton}
                              onPress={() => {
                                setIsSessionVisible(false);
                                setIsSessionSelected(false);
                              }}>
                              <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.textButton}
                              onPress={() => {
                                setIsSessionSelected(false);
                              }}>
                              <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Average Time Card - Individual Draggable */}
                {isAvgTimeVisible && (
                  <Animated.View
                    style={[
                      styles.subStatCardIndividual,
                      {
                        transform: [
                          ...avgTimePosition.getTranslateTransform(),
                          {scale: avgTimeScale},
                        ],
                      },
                    ]}
                    pointerEvents="auto"
                    {...avgTimeResponder.panHandlers}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        isAvgTimeSelected && styles.selectedTextContainer,
                      ]}
                      onPress={() => {
                        setIsAvgTimeSelected(true);
                        setIsDateSelected(false);
                        setIsMainStatSelected(false);
                        setIsSessionSelected(false);
                        setIsMessageSelected(false);
                        setSelectedCustomTextId(null);
                      }}
                      delayPressIn={0}>
                      <View style={styles.textWithButtons}>
                        <Text style={[styles.subStatValue, {color: avgTimeColor, fontSize: avgTimeFontSize}]}>{Math.floor(totalStudyTime / studyCount) || 0}분</Text>
                        <Text style={[styles.subStatLabel, {color: avgTimeColor, fontSize: avgTimeFontSize * 0.55}]}>평균 시간</Text>
                        {isAvgTimeSelected && (
                          <View style={(CARD_HEIGHT * 0.35 + avgTimeCurrentY) < (CARD_HEIGHT / 2) ? styles.textButtonGroupBottom : styles.textButtonGroup}>
                            <TouchableOpacity
                              style={styles.textButton}
                              onPress={() => {
                                setIsAvgTimeVisible(false);
                                setIsAvgTimeSelected(false);
                              }}>
                              <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.textButton}
                              onPress={() => {
                                setIsAvgTimeSelected(false);
                              }}>
                              <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Bottom Section - Motivational Message */}
            {customMessage && (
              <Animated.View
                style={[
                  styles.bottomSection,
                  {
                    transform: [
                      ...messagePosition.getTranslateTransform(),
                      {scale: messageScale},
                    ],
                  },
                ]}
                pointerEvents="auto"
                {...messageResponder.panHandlers}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  isMessageSelected && styles.selectedTextContainer,
                ]}
                onPress={() => {
                  if (!isMessageSelected) {
                    setIsMessageSelected(true);
                    setIsDateSelected(false);
                    setIsMainStatSelected(false);
                    setIsSessionSelected(false);
                    setIsAvgTimeSelected(false);
                    setSelectedCustomTextId(null);
                  }
                }}
                delayPressIn={0}>
                <View style={styles.textWithButtons}>
                  <Text style={[
                    styles.motivationText,
                    {
                      color: messageColor,
                      fontSize: messageFontSize,
                    }
                  ]}>{customMessage}</Text>
                  {isMessageSelected && (
                    <View style={(CARD_HEIGHT - 40 + messageCurrentY) < (CARD_HEIGHT / 2) ? styles.textButtonGroupBottom : styles.textButtonGroup}>
                      <TouchableOpacity
                        style={styles.textButton}
                        onPress={() => {
                          setTempMessage(customMessage);
                          setIsEditingMessage(true);
                        }}>
                        <Icon name="pencil" size={iconSize(20)} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.textButton}
                        onPress={() => {
                          setCustomMessage('');
                          setIsMessageSelected(false);
                        }}>
                        <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.textButton}
                        onPress={() => {
                          setIsMessageSelected(false);
                        }}>
                        <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
            )}
          </View>

          {/* Custom Text Layers - 별도 레이어 */}
          <View style={styles.customTextLayer} pointerEvents="box-none">
            {customTexts.map((customText) => {
              const isSelected = selectedCustomTextId === customText.id;

              // responder가 없으면 생성, 있으면 재사용
              if (!customTextRespondersRef.current[customText.id]) {
                customTextRespondersRef.current[customText.id] = createCombinedResponder(
                  customText.position,
                  customText.scale,
                  (newScale) => updateCustomTextScale(customText.id, newScale),
                  (newY) => updateCustomTextCurrentY(customText.id, newY),
                  undefined, // 싱글탭은 TouchableOpacity로 처리
                  undefined // 더블 탭 비활성화
                );
              }
              const textResponder = customTextRespondersRef.current[customText.id];
              // customText는 카드 중앙 기준 좌표 사용, 화면 좌표로 변환: CARD_HEIGHT/2 + currentY
              // 화면 중앙보다 위에 있으면 버튼 아래, 아래에 있으면 버튼 위
              const absoluteY = CARD_HEIGHT / 2 + customText.currentY;
              const isInBottomHalf = absoluteY >= (CARD_HEIGHT / 2);

              return (
                <Animated.View
                  key={customText.id}
                  style={[
                    styles.customTextContainer,
                    {
                      left: CARD_WIDTH / 2,
                      top: CARD_HEIGHT / 2,
                    },
                  ]}
                  {...textResponder.panHandlers}>
                  <Animated.View
                    style={[
                      {
                        transform: [
                          ...customText.position.getTranslateTransform(),
                          {translateX: '-50%'},
                          {translateY: '-50%'},
                          {scale: customText.scale},
                        ],
                      },
                      isSelected && styles.selectedTextContainer,
                    ]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (selectedCustomTextId === customText.id) {
                        // 이미 선택된 상태면 선택 해제
                        setSelectedCustomTextId(null);
                      } else {
                        // 선택
                        setSelectedCustomTextId(customText.id);
                        setIsMessageSelected(false);
                        setIsDateSelected(false);
                        setIsMainStatSelected(false);
                        setIsSessionSelected(false);
                        setIsAvgTimeSelected(false);
                      }
                    }}
                    style={styles.customTextWrapper}>
                    <View style={styles.textWithButtons}>
                        <Text style={{
                          color: customText.color,
                          fontSize: customText.fontSize,
                          fontWeight: '700',
                          textShadowColor: 'rgba(0, 0, 0, 0.3)',
                          textShadowOffset: {width: 0, height: 2},
                          textShadowRadius: 4,
                        }}>
                          {customText.text}
                        </Text>
                      {isSelected && (
                        <View style={isInBottomHalf ? styles.textButtonGroup : styles.textButtonGroupBottom}>
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => {
                              editCustomTextContent(customText.id);
                            }}>
                            <Icon name="pencil" size={iconSize(20)} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => {
                              deleteCustomText(customText.id);
                              setSelectedCustomTextId(null);
                            }}>
                            <Icon name="close-circle" size={iconSize(24)} color="#FF6B6B" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => {
                              setSelectedCustomTextId(null);
                              setIsMessageSelected(false);
                            }}>
                            <Icon name="checkmark-circle" size={iconSize(24)} color="#4CAF50" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </View>
        </ViewShot>

        {/* 스크롤 가능한 하단 영역 */}
        <ScrollView
          style={styles.bottomScrollArea}
          contentContainerStyle={styles.bottomScrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}>
          {/* Editing Options - Show when text is selected */}
          {(selectedCustomTextId || isMessageSelected || isDateSelected || isMainStatSelected || isSessionSelected || isAvgTimeSelected) && (
            <View style={styles.editingPanel}>
            <Text style={styles.editingPanelTitle}>
              {isDateSelected ? '날짜 편집' : isMainStatSelected ? '집중 시간 편집' : isSessionSelected ? '세션 편집' : isAvgTimeSelected ? '평균 시간 편집' : '텍스트 편집'}
            </Text>
            <View style={styles.editingRow}>
              <Text style={styles.editingLabel}>색상</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPickerBottom}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      {backgroundColor: color},
                      (isMessageSelected
                        ? messageColor === color
                        : isDateSelected
                        ? dateColor === color
                        : isMainStatSelected
                        ? mainStatColor === color
                        : isSessionSelected
                        ? sessionColor === color
                        : isAvgTimeSelected
                        ? avgTimeColor === color
                        : customTexts.find(t => t.id === selectedCustomTextId)?.color === color) && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      if (isMessageSelected) {
                        setMessageColor(color);
                      } else if (isDateSelected) {
                        setDateColor(color);
                      } else if (isMainStatSelected) {
                        setMainStatColor(color);
                      } else if (isSessionSelected) {
                        setSessionColor(color);
                      } else if (isAvgTimeSelected) {
                        setAvgTimeColor(color);
                      } else if (selectedCustomTextId) {
                        updateCustomTextColor(selectedCustomTextId, color);
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
            <View style={styles.editingRow}>
              <Text style={styles.editingLabel}>크기</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontSizePickerBottom}>
                {fontSizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeOption,
                      (isMessageSelected
                        ? messageFontSize === size
                        : isDateSelected
                        ? dateFontSize === size
                        : isMainStatSelected
                        ? mainStatFontSize === size
                        : isSessionSelected
                        ? sessionFontSize === size
                        : isAvgTimeSelected
                        ? avgTimeFontSize === size
                        : customTexts.find(t => t.id === selectedCustomTextId)?.fontSize === size) && styles.fontSizeOptionSelected,
                    ]}
                    onPress={() => {
                      if (isMessageSelected) {
                        setMessageFontSize(size);
                      } else if (isDateSelected) {
                        setDateFontSize(size);
                      } else if (isMainStatSelected) {
                        setMainStatFontSize(size);
                      } else if (isSessionSelected) {
                        setSessionFontSize(size);
                      } else if (isAvgTimeSelected) {
                        setAvgTimeFontSize(size);
                      } else if (selectedCustomTextId) {
                        updateCustomTextFontSize(selectedCustomTextId, size);
                      }
                    }}>
                    <Text style={styles.fontSizeText}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {isDateSelected && (
              <View style={styles.editingRow}>
                <Text style={styles.editingLabel}>날짜 형식</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontSizePickerBottom}>
                  {['기본', '시간 포함', '년도 포함', '간단'].map((format, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.fontSizeOption,
                        dateFormat === index && styles.fontSizeOptionSelected,
                      ]}
                      onPress={() => setDateFormat(index)}>
                      <Text style={styles.fontSizeText}>{format}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.imageButton]}
              onPress={selectBackgroundImage}>
              <Icon name="image" size={iconSize(20)} color="#FFFFFF" />
              <Text style={styles.buttonText}>배경 사진 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
              disabled={isCapturing}>
              <Icon name="share-social" size={iconSize(20)} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                {isCapturing ? '생성 중...' : '공유하기'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.screenshotButton]}
              onPress={handleScreenshot}
              disabled={isCapturing}>
              <Icon name="camera" size={iconSize(20)} color="#FFFFFF" />
              <Text style={styles.buttonText}>스크린샷</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Text Edit Modal */}
      <Modal
        visible={isEditingMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingMessage(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>메시지 편집</Text>
            <TextInput
              style={styles.modalInput}
              value={tempMessage}
              onChangeText={setTempMessage}
              placeholder="메시지를 입력하세요"
              placeholderTextColor="#888"
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsEditingMessage(false)}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  setCustomMessage(tempMessage);
                  setIsEditingMessage(false);
                }}>
                <Text style={[styles.modalButtonText, {color: '#FFF'}]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Text Edit Modal */}
      <Modal
        visible={isEditingCustomText}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingCustomText(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>텍스트 편집</Text>
            <TextInput
              style={styles.modalInput}
              value={tempCustomText}
              onChangeText={setTempCustomText}
              placeholder="텍스트를 입력하세요"
              placeholderTextColor="#888"
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsEditingCustomText(false);
                  setEditingTextId(null);
                }}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={saveCustomTextContent}>
                <Text style={[styles.modalButtonText, {color: '#FFF'}]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: hp(20),
    paddingHorizontal: sp(20),
  },
  bottomScrollArea: {
    flex: 1,
    width: '100%',
    maxWidth: CARD_WIDTH,
  },
  bottomScrollContent: {
    paddingTop: hp(12),
    paddingBottom: hp(20),
  },
  viewShot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: sp(24),
    overflow: 'hidden',
  },
  closeButtonX: {
    position: 'absolute',
    top: hp(16),
    right: sp(16),
    width: touchSize(36),
    height: touchSize(36),
    borderRadius: sp(18),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlayBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  defaultBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundTouchArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  contentLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  customTextLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 3,
  },
  cardContent: {
    flex: 1,
    padding: sp(28),
    paddingTop: hp(50),
    justifyContent: 'space-between',
  },
  dateContainer: {
    position: 'absolute',
    alignItems: 'center',
    top: hp(80),
    alignSelf: 'center',
  },
  dateLabel: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: 0.5,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: hp(-10),
    right: sp(-10),
    width: sp(30),
    height: sp(30),
    borderRadius: sp(15),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    position: 'absolute',
    alignItems: 'center',
    gap: sp(16),
    width: '100%',
    top: '35%',
    alignSelf: 'center',
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: sp(12),
    width: '100%',
  },
  mainStatCard: {
    alignItems: 'center',
    width: '100%',
  },
  mainStatValue: {
    fontSize: fp(40),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: sp(2)},
    textShadowRadius: sp(4),
    marginBottom: hp(6),
  },
  mainStatLabel: {
    fontSize: fp(14),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  subStatCardIndividual: {
    alignItems: 'center',
    flex: 1,
  },
  subStatValue: {
    fontSize: fp(22),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: sp(1)},
    textShadowRadius: sp(2),
    marginBottom: hp(4),
  },
  subStatLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.85,
  },
  bottomSection: {
    position: 'absolute',
    bottom: hp(40),
    alignItems: 'center',
    alignSelf: 'center',
  },
  motivationText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: {width: 0, height: sp(1)},
    textShadowRadius: sp(2),
  },
  editHint: {
    fontSize: fp(11),
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: hp(4),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: sp(12),
    width: '100%',
    marginTop: hp(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: sp(16),
    padding: sp(24),
    width: '100%',
    maxWidth: sp(400),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#000',
    marginBottom: hp(16),
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: sp(12),
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    fontSize: fp(15),
    color: '#000',
    minHeight: hp(80),
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: sp(12),
    marginTop: hp(20),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(12),
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#E0E0E0',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#000',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(16),
    paddingHorizontal: sp(12),
    borderRadius: sp(12),
    gap: sp(8),
  },
  imageButton: {
    backgroundColor: '#6B6B6B',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  screenshotButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  toolbar: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: sp(12),
    padding: sp(12),
    marginBottom: hp(12),
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: sp(12),
  },
  toolbarButton: {
    width: touchSize(44),
    height: touchSize(44),
    borderRadius: sp(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: '#007AFF',
  },
  toolbarButtonText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: touchSize(44),
    height: touchSize(44),
    borderRadius: sp(22),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarRight: {
    marginTop: hp(12),
    gap: sp(8),
  },
  toolbarLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: hp(4),
  },
  colorPicker: {
    flexDirection: 'row',
  },
  colorOption: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(16),
    marginRight: sp(8),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  fontSizePicker: {
    flexDirection: 'row',
  },
  fontSizeOption: {
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: sp(8),
  },
  fontSizeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  fontSizeText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customTextContainer: {
    position: 'absolute',
    zIndex: 999,
    elevation: 999,
  },
  customTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTextContainer: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: sp(8),
    padding: sp(4),
  },
  textWithButtons: {
    position: 'relative',
  },
  textButtonGroup: {
    position: 'absolute',
    top: hp(-38),
    right: sp(-10),
    flexDirection: 'row',
    gap: sp(4),
  },
  textButtonGroupBottom: {
    position: 'absolute',
    bottom: hp(-38),
    right: sp(-10),
    flexDirection: 'row',
    gap: sp(4),
  },
  textButton: {
    width: touchSize(28),
    height: touchSize(28),
    borderRadius: sp(14),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editingPanel: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: sp(12),
    padding: sp(16),
    marginBottom: hp(12),
  },
  editingPanelTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp(12),
  },
  editingRow: {
    marginBottom: hp(12),
  },
  editingLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: hp(8),
  },
  colorPickerBottom: {
    flexDirection: 'row',
  },
  fontSizePickerBottom: {
    flexDirection: 'row',
  },
});

export default StudyStoryCard;
