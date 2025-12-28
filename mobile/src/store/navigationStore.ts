import {create} from 'zustand';

export type CommunitySubTab = 'Feed' | 'Matching' | 'Group' | 'Friends';
export type MainTab = 'Timer' | 'StudyRecord' | 'Community' | 'More';

interface NavigationState {
  // 커뮤니티 서브탭 모드 활성화 여부
  isCommunityMode: boolean;
  // 현재 선택된 커뮤니티 서브탭
  activeCommunityTab: CommunitySubTab;
  // 커뮤니티 들어가기 전 마지막 탭 (뒤로가기용)
  previousTab: MainTab;
  // 모임 상세 페이지 표시 여부 (탭바 숨김용)
  isGroupDetailVisible: boolean;

  // Actions
  enterCommunityMode: (fromTab?: MainTab) => void;
  exitCommunityMode: () => MainTab;
  setCommunityTab: (tab: CommunitySubTab) => void;
  setGroupDetailVisible: (visible: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  isCommunityMode: false,
  activeCommunityTab: 'Feed',
  previousTab: 'StudyRecord',
  isGroupDetailVisible: false,

  enterCommunityMode: (fromTab?: MainTab) => set({
    isCommunityMode: true,
    previousTab: fromTab || get().previousTab,
  }),
  exitCommunityMode: () => {
    const prevTab = get().previousTab;
    // activeCommunityTab은 유지 (다시 커뮤니티 들어가면 같은 탭으로)
    set({isCommunityMode: false});
    return prevTab;
  },
  setCommunityTab: (tab: CommunitySubTab) => set({activeCommunityTab: tab}),
  setGroupDetailVisible: (visible: boolean) => set({isGroupDetailVisible: visible}),
}));
