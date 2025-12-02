import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

interface ProfileCardProps {
  isDark: boolean;
  onPress?: () => void;
  size?: 'small' | 'large';
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  isDark,
  onPress,
  size = 'small',
}) => {
  const isLarge = size === 'large';
  const avatarSize = isLarge ? 70 : 60;
  const badgeSize = isLarge ? 40 : 32;
  const iconSize = isLarge ? 24 : 18;
  const levelFontSize = isLarge ? 13 : 11;
  const nicknameFontSize = isLarge ? 16 : 13;
  const titleSlotSize = isLarge ? 52 : 45; // 칭호 정사각형 크기
  const nicknameCardHeight = isLarge ? 32 : 28; // 닉네임 카드 높이

  const CardContent = (
    <View style={[styles.cardFrame, {borderColor: isDark ? '#FFD700' : '#F59E0B'}]}>
      <View style={[styles.cardBackground, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <View style={styles.profileCardContent}>
          {/* Left: Profile Avatar */}
          <View
            style={[
              styles.characterAvatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}>
            <Icon name="rocket" size={avatarSize * 0.5} color="#FFFFFF" />
          </View>

          {/* Center & Right: Grid Layout */}
          <View style={styles.gridContainer}>
            {/* Top Row: Badge, Tier, Title */}
            <View style={styles.topRow}>
              {/* Badge */}
              <View style={styles.badgeContainer}>
                <View
                  style={[
                    styles.badgeSlot,
                    {
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize / 2,
                    },
                  ]}>
                  <Icon name="medal" size={iconSize} color="#FFD700" />
                </View>
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                      fontSize: levelFontSize,
                    },
                  ]}>
                  Lv.42
                </Text>
              </View>

              {/* Tier */}
              <View style={styles.tierContainer}>
                <View
                  style={[
                    styles.tierSlot,
                    {
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize / 2,
                    },
                  ]}>
                  <Icon name="trophy" size={iconSize} color="#E91E63" />
                </View>
                <Text
                  style={[
                    styles.tierText,
                    {
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                      fontSize: levelFontSize,
                    },
                  ]}>
                  플래티넘
                </Text>
              </View>

              {/* Title */}
              <View style={styles.titleOuterContainer}>
                <View style={styles.titleContainer}>
                  {/* Badge Icon Box */}
                  <View
                    style={[
                      styles.titleBadgeBox,
                      {
                        backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5',
                        borderColor: isDark ? '#3A2A3A' : '#E1BEE7',
                      },
                    ]}>
                    <Icon name="ribbon" size={isLarge ? 14 : 12} color="#9C27B0" />
                  </View>
                  {/* Title Text Box */}
                  <View
                    style={[
                      styles.titleTextBox,
                      {
                        backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5',
                        borderColor: isDark ? '#3A2A3A' : '#E1BEE7',
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                      style={[
                        styles.titleText,
                        {
                          color: isDark ? '#CE93D8' : '#9C27B0',
                          fontSize: isLarge ? 11 : 10,
                        },
                      ]}>
                      집중의 달인
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Row: Nickname, Guild */}
            <View style={styles.bottomRow}>
              {/* Nickname */}
              <View
                style={[
                  styles.nicknameCard,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
                    height: nicknameCardHeight,
                    flex: 0.75,
                  },
                ]}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.profileName,
                    {
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                      fontSize: nicknameFontSize,
                    },
                  ]}>
                  타이미유저
                </Text>
              </View>

              {/* Guild */}
              <View style={styles.guildContainer}>
                {/* Guild Icon Box */}
                <View
                  style={[
                    styles.guildIconBox,
                    {
                      backgroundColor: isDark ? '#1A2A3A' : '#E3F2FD',
                      borderColor: isDark ? '#2A3A4A' : '#BBDEFB',
                      height: nicknameCardHeight,
                    },
                  ]}>
                  <Icon name="people" size={isLarge ? 16 : 14} color={isDark ? '#64B5F6' : '#1976D2'} />
                </View>
                {/* Guild Name Box */}
                <View
                  style={[
                    styles.guildNameBox,
                    {
                      backgroundColor: isDark ? '#1A2A3A' : '#E3F2FD',
                      borderColor: isDark ? '#2A3A4A' : '#BBDEFB',
                      height: nicknameCardHeight,
                    },
                  ]}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    style={[
                      styles.guildName,
                      {
                        color: isDark ? '#64B5F6' : '#1976D2',
                        fontSize: isLarge ? 13 : 12,
                      },
                    ]}>
                    집중왕들
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Remove old rightColumn */}
          <View style={{display: 'none'}}>
            <View
              style={[
                styles.titleSlot,
                {
                  backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5',
                  width: titleSlotSize,
                  height: titleSlotSize,
                },
              ]}>
              <Icon name="ribbon" size={isLarge ? 14 : 11} color="#9C27B0" />
              <Text
                style={[
                  styles.titleText,
                  {
                    color: isDark ? '#CE93D8' : '#9C27B0',
                    fontSize: isLarge ? 9 : 8,
                  },
                ]}>
                집중의{'\n'}달인
              </Text>
            </View>
            {/* Guild Badge */}
            <View
              style={[
                styles.guildBadge,
                {
                  backgroundColor: isDark ? '#1A2A3A' : '#E3F2FD',
                  borderColor: isDark ? '#2A3A4A' : '#BBDEFB',
                  height: nicknameCardHeight,
                },
              ]}>
              <Icon name="people" size={isLarge ? 11 : 9} color={isDark ? '#64B5F6' : '#1976D2'} />
              <Text
                style={[
                  styles.guildName,
                  {
                    color: isDark ? '#64B5F6' : '#1976D2',
                    fontSize: isLarge ? 9 : 8,
                  },
                ]}>
                집중왕들
              </Text>
            </View>
          </View>

          {onPress && (
            <Icon
              name="chevron-forward"
              size={20}
              color={isDark ? '#666666' : '#AAAAAA'}
            />
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.profileCardOuter} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.profileCardOuter}>{CardContent}</View>;
};

const styles = StyleSheet.create({
  profileCardOuter: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFrame: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 2,
  },
  cardBackground: {
    borderRadius: 10,
    padding: 12,
  },
  profileCardContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeTierRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  characterAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  badgeSlot: {
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tierSlot: {
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  levelText: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tierText: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleOuterContainer: {
    paddingLeft: 6,
    paddingTop: 6,
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  titleBadgeBox: {
    position: 'absolute',
    top: -6,
    left: -6,
    borderRadius: 6,
    borderWidth: 1,
    padding: 3,
    zIndex: 1,
  },
  titleTextBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  titleSlot: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  titleText: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  rightColumn: {
    gap: 8,
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  nicknameCard: {
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  profileName: {
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  guildContainer: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  guildIconBox: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  guildNameBox: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
  guildBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  guildName: {
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});

export default ProfileCard;
