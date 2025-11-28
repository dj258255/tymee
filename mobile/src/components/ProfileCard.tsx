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

          {/* Center: Badge, Tier, Nickname */}
          <View style={styles.centerContent}>
            {/* Top Row: Badge, Tier */}
            <View style={styles.badgeTierRow}>
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
            </View>

            {/* Bottom: Nickname Card */}
            <View
              style={[
                styles.nicknameCard,
                {
                  backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
                },
              ]}>
              <Text
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
          </View>

          {/* Right: Title */}
          <View
            style={[
              styles.titleSlot,
              {backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5'},
            ]}>
            <Icon name="ribbon" size={isLarge ? 16 : 12} color="#9C27B0" />
            <Text
              style={[
                styles.titleText,
                {
                  color: isDark ? '#CE93D8' : '#9C27B0',
                  fontSize: isLarge ? 10 : 9,
                },
              ]}>
              집중의 달인
            </Text>
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
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeTierRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
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
  titleSlot: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1BEE7',
    minWidth: 50,
  },
  titleText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  nicknameCard: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});

export default ProfileCard;
