import {create} from 'zustand';

// 모임 카테고리
export type GroupCategory =
  | 'exam' // 시험/자격증
  | 'language' // 어학
  | 'coding' // 코딩/개발
  | 'career' // 취업/이직
  | 'school' // 학교공부
  | 'hobby' // 취미/자기계발
  | 'other'; // 기타

// 모임 상태
export type GroupStatus = 'recruiting' | 'active' | 'closed';

// 모임 멤버
export interface GroupMember {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  level?: number;
  tier?: string;
  cardFrame?: string; // 프로필 카드 프레임
  badges?: Array<{id: string; icon: string; color: string}>; // 뱃지 목록
  role: 'leader' | 'manager' | 'member';
  joinedAt: Date;
  totalStudyMinutes: number; // 모임 내 총 공부시간
  weeklyStudyMinutes: number; // 이번 주 공부시간
  todayStudyMinutes?: number; // 오늘 공부시간
  currentSessionMinutes?: number; // 현재 세션 공부시간
  isStudying?: boolean; // 현재 공부중 여부
  lastActiveAt: Date;
}

// 모임 규칙
export interface GroupRule {
  minStudyMinutesPerWeek?: number; // 주당 최소 공부시간 (분)
  maxAbsenceDays?: number; // 최대 미접속 일수
  requireDailyReport?: boolean; // 일일 보고 필수 여부
  customRules?: string[]; // 커스텀 규칙
}

// 모임 게시글 (공지 포함)
export interface GroupPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  authorLevel?: number;
  authorTier?: string;
  isPinned: boolean; // 공지로 고정
  image?: string; // 첨부 이미지
  likes: number;
  likedBy: string[]; // 좋아요 누른 사용자 ID
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 게시글 댓글
export interface GroupPostComment {
  id: string;
  postId: string;
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

// 기존 GroupNotice를 GroupPost로 alias (호환성)
export type GroupNotice = GroupPost;

// 모임 일정
export interface GroupSchedule {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'none';
  participants: string[]; // 참가자 ID 목록
  createdBy: string;
}

// 모임 채팅 메시지
export interface GroupMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  senderAvatar?: string;
  content: string;
  image?: string;
  createdAt: Date;
  isSystemMessage?: boolean;
}

// 모임
export interface Group {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  tags: string[];
  coverImage?: string;
  status: GroupStatus;

  // 멤버 관련
  leaderId: string;
  members: GroupMember[];
  maxMembers: number;

  // 규칙
  rules: GroupRule;

  // 가입 조건
  isPrivate: boolean; // 비공개 모임
  requireApproval: boolean; // 가입 승인 필요
  minLevel?: number; // 최소 레벨

  // 통계
  totalStudyMinutes: number; // 모임 전체 공부시간
  weeklyStudyMinutes: number; // 이번 주 공부시간
  averageStudyMinutes: number; // 멤버 평균 공부시간

  // 게시판 및 일정
  posts: GroupPost[]; // 게시글 목록 (공지 포함)
  notices: GroupNotice[]; // 호환성을 위해 유지 (posts와 동일)
  schedules: GroupSchedule[];

  // 채팅
  messages: GroupMessage[];
  unreadCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// 가입 신청
export interface GroupApplication {
  id: string;
  groupId: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  userLevel?: number;
  message?: string; // 가입 신청 메시지
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

// 카테고리 정보
export const GROUP_CATEGORIES: Array<{
  id: GroupCategory;
  label: string;
  icon: string;
  color: string;
}> = [
  {id: 'exam', label: '시험/자격증', icon: 'document-text', color: '#FF6B6B'},
  {id: 'language', label: '어학', icon: 'language', color: '#4ECDC4'},
  {id: 'coding', label: '코딩/개발', icon: 'code-slash', color: '#45B7D1'},
  {id: 'career', label: '취업/이직', icon: 'briefcase', color: '#96CEB4'},
  {id: 'school', label: '학교공부', icon: 'school', color: '#FFEAA7'},
  {id: 'hobby', label: '취미/자기계발', icon: 'color-palette', color: '#DDA0DD'},
  {id: 'other', label: '기타', icon: 'ellipsis-horizontal', color: '#95A5A6'},
];

interface GroupStore {
  // 모임 목록
  groups: Group[];
  myGroups: Group[]; // 내가 가입한 모임

  // 선택된 모임
  selectedGroup: Group | null;

  // 필터
  selectedCategory: GroupCategory | 'all';
  searchQuery: string;
  showRecruitingOnly: boolean;

  // 가입 신청 목록 (리더용)
  applications: GroupApplication[];

  // Actions
  setSelectedCategory: (category: GroupCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  setShowRecruitingOnly: (show: boolean) => void;
  selectGroup: (group: Group | null) => void;

  // 모임 CRUD
  createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'members' | 'notices' | 'schedules' | 'messages' | 'unreadCount' | 'totalStudyMinutes' | 'weeklyStudyMinutes' | 'averageStudyMinutes'>) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;

  // 멤버 관리
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  applyToGroup: (groupId: string, message?: string) => void;
  processApplication: (applicationId: string, approve: boolean) => void;
  kickMember: (groupId: string, memberId: string) => void;
  promoteMember: (groupId: string, memberId: string, role: 'manager' | 'member') => void;

  // 게시글
  addPost: (groupId: string, post: Omit<GroupPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'commentCount'>) => void;
  updatePost: (groupId: string, postId: string, updates: Partial<GroupPost>) => void;
  deletePost: (groupId: string, postId: string) => void;
  togglePostPin: (groupId: string, postId: string) => void;
  togglePostLike: (groupId: string, postId: string, userId: string) => void;

  // 공지 (레거시 - posts로 대체됨)
  addNotice: (groupId: string, notice: Omit<GroupNotice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNotice: (groupId: string, noticeId: string, updates: Partial<GroupNotice>) => void;
  deleteNotice: (groupId: string, noticeId: string) => void;

  // 일정
  addSchedule: (groupId: string, schedule: Omit<GroupSchedule, 'id'>) => void;
  updateSchedule: (groupId: string, scheduleId: string, updates: Partial<GroupSchedule>) => void;
  deleteSchedule: (groupId: string, scheduleId: string) => void;

  // 채팅
  sendMessage: (groupId: string, content: string, image?: string) => void;
  markAsRead: (groupId: string) => void;

  // 필터링된 모임 가져오기
  getFilteredGroups: () => Group[];
}

// 샘플 데이터
const sampleGroups: Group[] = [
  {
    id: '1',
    name: '정보처리기사 합격반',
    description: '2024년 정보처리기사 시험을 준비하는 모임입니다. 매일 2시간 이상 공부하고 서로 질문하며 함께 합격해요!',
    category: 'exam',
    tags: ['정보처리기사', 'IT자격증', '2024'],
    status: 'recruiting',
    leaderId: 'leader1',
    members: [
      {
        id: 'leader1',
        nickname: '공부왕',
        level: 25,
        tier: '학사 II',
        role: 'leader',
        joinedAt: new Date('2024-01-01'),
        totalStudyMinutes: 12000,
        weeklyStudyMinutes: 840,
        todayStudyMinutes: 180,
        currentSessionMinutes: 45,
        isStudying: true,
        lastActiveAt: new Date(),
      },
      {
        id: 'member1',
        nickname: '열공러',
        level: 18,
        tier: '고등학생',
        role: 'member',
        joinedAt: new Date('2024-01-15'),
        totalStudyMinutes: 8000,
        weeklyStudyMinutes: 600,
        todayStudyMinutes: 120,
        currentSessionMinutes: 0,
        isStudying: false,
        lastActiveAt: new Date(),
      },
    ],
    maxMembers: 20,
    rules: {
      minStudyMinutesPerWeek: 600,
      maxAbsenceDays: 3,
      requireDailyReport: true,
      customRules: ['매일 최소 1시간 공부', '주 3회 이상 인증'],
    },
    isPrivate: false,
    requireApproval: true,
    minLevel: 5,
    totalStudyMinutes: 20000,
    weeklyStudyMinutes: 1440,
    averageStudyMinutes: 720,
    posts: [
      {
        id: 'p1',
        title: '환영합니다!',
        content: '정보처리기사 합격을 위해 함께 달려봐요!',
        authorId: 'leader1',
        authorNickname: '공부왕',
        authorLevel: 25,
        authorTier: '학사 II',
        isPinned: true,
        likes: 5,
        likedBy: ['member1'],
        commentCount: 2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'p2',
        title: '이번 주 스터디 계획',
        content: '이번 주는 데이터베이스 파트를 집중적으로 공부합니다. 각자 문제집 3-5장 풀어오세요!',
        authorId: 'leader1',
        authorNickname: '공부왕',
        authorLevel: 25,
        authorTier: '학사 II',
        isPinned: true,
        likes: 3,
        likedBy: [],
        commentCount: 5,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'p3',
        title: '오늘 공부 인증합니다!',
        content: 'SQL 문제 50문제 풀었습니다. 어려운 문제 있으면 같이 풀어요~',
        authorId: 'member1',
        authorNickname: '열공러',
        authorLevel: 18,
        authorTier: '고등학생',
        isPinned: false,
        likes: 2,
        likedBy: ['leader1'],
        commentCount: 1,
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
      },
    ],
    notices: [
      {
        id: 'p1',
        title: '환영합니다!',
        content: '정보처리기사 합격을 위해 함께 달려봐요!',
        authorId: 'leader1',
        authorNickname: '공부왕',
        authorLevel: 25,
        authorTier: '학사 II',
        isPinned: true,
        likes: 5,
        likedBy: ['member1'],
        commentCount: 2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'p2',
        title: '2024년 1회 필기시험 일정 공유',
        content: '2월 17일 필기시험입니다! 다들 화이팅!',
        authorId: 'leader1',
        authorNickname: '공부왕',
        authorLevel: 25,
        authorTier: '학사 II',
        isPinned: true,
        likes: 8,
        likedBy: ['member1'],
        commentCount: 5,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'p3',
        title: 'SQL 기출문제 정리본 공유해요',
        content: '최근 5개년 SQL 기출문제 정리했습니다. 도움이 되셨으면 좋겠어요!',
        authorId: 'member1',
        authorNickname: '열공러',
        authorLevel: 18,
        authorTier: '고등학생',
        isPinned: false,
        likes: 12,
        likedBy: ['leader1'],
        commentCount: 8,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'p4',
        title: '실기 준비 언제부터 하시나요?',
        content: '필기 끝나고 바로 실기 준비하려는데, 다들 계획이 어떻게 되시나요?',
        authorId: 'member1',
        authorNickname: '열공러',
        authorLevel: 18,
        authorTier: '고등학생',
        isPinned: false,
        likes: 3,
        likedBy: [],
        commentCount: 4,
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
      },
      {
        id: 'p5',
        title: '데이터베이스 파트 질문있어요',
        content: '정규화 3NF까지는 이해했는데, BCNF가 헷갈리네요ㅠ',
        authorId: 'member1',
        authorNickname: '열공러',
        authorLevel: 18,
        authorTier: '고등학생',
        isPinned: false,
        likes: 2,
        likedBy: [],
        commentCount: 6,
        createdAt: new Date('2024-01-23'),
        updatedAt: new Date('2024-01-23'),
      },
    ],
    schedules: [
      {
        id: 's1',
        title: '필기시험 D-Day',
        description: '2024년 1회 정보처리기사 필기시험',
        startDate: new Date('2024-02-17'),
        isAllDay: true,
        repeatType: 'none',
        participants: ['leader1', 'member1'],
        createdBy: 'leader1',
      },
    ],
    messages: [],
    unreadCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'TOEIC 900+ 스터디',
    description: '토익 900점 이상 목표! 매일 단어 암기, 주 2회 모의고사 풀이를 함께해요.',
    category: 'language',
    tags: ['토익', 'TOEIC', '900점'],
    status: 'recruiting',
    leaderId: 'leader2',
    members: [
      {
        id: 'leader2',
        nickname: '영어고수',
        level: 30,
        tier: '석사 I',
        role: 'leader',
        joinedAt: new Date('2024-01-10'),
        totalStudyMinutes: 15000,
        weeklyStudyMinutes: 1200,
        lastActiveAt: new Date(),
      },
    ],
    maxMembers: 15,
    rules: {
      minStudyMinutesPerWeek: 420,
      customRules: ['매일 단어 50개 암기', '주 2회 LC/RC 풀이'],
    },
    isPrivate: false,
    requireApproval: false,
    totalStudyMinutes: 15000,
    weeklyStudyMinutes: 1200,
    averageStudyMinutes: 1200,
    posts: [],
    notices: [],
    schedules: [],
    messages: [],
    unreadCount: 0,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: '개발자 취준생 모임',
    description: '프론트엔드/백엔드 개발자 취업을 준비하는 분들의 모임입니다. 코딩테스트, 포트폴리오, 면접 준비 함께해요!',
    category: 'coding',
    tags: ['개발자', '취업', '코딩테스트', 'React'],
    status: 'active',
    leaderId: 'leader3',
    members: [
      {
        id: 'leader3',
        nickname: '코딩마스터',
        level: 35,
        tier: '박사',
        role: 'leader',
        joinedAt: new Date('2023-12-01'),
        totalStudyMinutes: 25000,
        weeklyStudyMinutes: 1500,
        lastActiveAt: new Date(),
      },
      {
        id: 'member2',
        nickname: '주니어개발자',
        level: 20,
        tier: '학사 II',
        role: 'manager',
        joinedAt: new Date('2023-12-15'),
        totalStudyMinutes: 18000,
        weeklyStudyMinutes: 1200,
        lastActiveAt: new Date(),
      },
      {
        id: 'member3',
        nickname: '프론트지망생',
        level: 15,
        tier: '고등학생',
        role: 'member',
        joinedAt: new Date('2024-01-01'),
        totalStudyMinutes: 10000,
        weeklyStudyMinutes: 900,
        lastActiveAt: new Date(),
      },
    ],
    maxMembers: 10,
    rules: {
      minStudyMinutesPerWeek: 840,
      requireDailyReport: true,
      customRules: ['주 3회 알고리즘 문제 풀이', '코드리뷰 참여 필수'],
    },
    isPrivate: true,
    requireApproval: true,
    minLevel: 10,
    totalStudyMinutes: 53000,
    weeklyStudyMinutes: 3600,
    averageStudyMinutes: 1200,
    posts: [
      {
        id: 'p4',
        title: '코딩테스트 준비 가이드',
        content: '백준, 프로그래머스 문제 추천 리스트입니다. 난이도별로 정리했어요!',
        authorId: 'leader3',
        authorNickname: '코딩마스터',
        authorLevel: 35,
        authorTier: '박사',
        isPinned: true,
        likes: 12,
        likedBy: ['member2', 'member3'],
        commentCount: 8,
        createdAt: new Date('2023-12-05'),
        updatedAt: new Date('2023-12-05'),
      },
    ],
    notices: [],
    schedules: [],
    messages: [],
    unreadCount: 0,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: '공시생 새벽반',
    description: '새벽 5시 기상! 공무원 시험 준비하는 모임입니다.',
    category: 'exam',
    tags: ['공무원', '공시생', '새벽'],
    status: 'recruiting',
    leaderId: 'leader4',
    members: [
      {
        id: 'leader4',
        nickname: '새벽형인간',
        level: 28,
        tier: '학사 II',
        role: 'leader',
        joinedAt: new Date('2024-01-05'),
        totalStudyMinutes: 20000,
        weeklyStudyMinutes: 2100,
        lastActiveAt: new Date(),
      },
    ],
    maxMembers: 30,
    rules: {
      minStudyMinutesPerWeek: 1260, // 하루 3시간
      maxAbsenceDays: 2,
      customRules: ['새벽 5시 기상 인증', '하루 3시간 이상 공부'],
    },
    isPrivate: false,
    requireApproval: true,
    totalStudyMinutes: 20000,
    weeklyStudyMinutes: 2100,
    averageStudyMinutes: 2100,
    posts: [],
    notices: [],
    schedules: [],
    messages: [],
    unreadCount: 0,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'CPA 회계사 스터디',
    description: '공인회계사 시험 준비 모임입니다. 회계원리부터 세법까지 함께 공부해요.',
    category: 'exam',
    tags: ['CPA', '회계사', '회계'],
    status: 'recruiting',
    leaderId: 'leader5',
    members: [
      {
        id: 'leader5',
        nickname: '회계전문가',
        level: 22,
        tier: '학사 II',
        role: 'leader',
        joinedAt: new Date('2024-01-08'),
        totalStudyMinutes: 14000,
        weeklyStudyMinutes: 1400,
        lastActiveAt: new Date(),
      },
    ],
    maxMembers: 15,
    rules: {
      minStudyMinutesPerWeek: 840,
      customRules: ['주간 진도 체크', '월 1회 모의고사'],
    },
    isPrivate: false,
    requireApproval: true,
    minLevel: 8,
    totalStudyMinutes: 14000,
    weeklyStudyMinutes: 1400,
    averageStudyMinutes: 1400,
    posts: [],
    notices: [],
    schedules: [],
    messages: [],
    unreadCount: 0,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date(),
  },
];

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: sampleGroups,
  myGroups: [sampleGroups[0]], // 첫 번째 모임에 가입되어 있다고 가정
  selectedGroup: null,
  selectedCategory: 'all',
  searchQuery: '',
  showRecruitingOnly: false,
  applications: [],

  setSelectedCategory: (category) => set({selectedCategory: category}),
  setSearchQuery: (query) => set({searchQuery: query}),
  setShowRecruitingOnly: (show) => set({showRecruitingOnly: show}),
  selectGroup: (group) => set({selectedGroup: group}),

  createGroup: (groupData) => {
    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      members: [
        {
          id: 'currentUser',
          nickname: '나',
          level: 10,
          role: 'leader',
          joinedAt: new Date(),
          totalStudyMinutes: 0,
          weeklyStudyMinutes: 0,
          lastActiveAt: new Date(),
        },
      ],
      totalStudyMinutes: 0,
      weeklyStudyMinutes: 0,
      averageStudyMinutes: 0,
      posts: [],
      notices: [],
      schedules: [],
      messages: [],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      groups: [newGroup, ...state.groups],
      myGroups: [newGroup, ...state.myGroups],
    }));
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? {...g, ...updates, updatedAt: new Date()} : g
      ),
      myGroups: state.myGroups.map((g) =>
        g.id === groupId ? {...g, ...updates, updatedAt: new Date()} : g
      ),
      selectedGroup:
        state.selectedGroup?.id === groupId
          ? {...state.selectedGroup, ...updates, updatedAt: new Date()}
          : state.selectedGroup,
    }));
  },

  deleteGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      myGroups: state.myGroups.filter((g) => g.id !== groupId),
      selectedGroup: state.selectedGroup?.id === groupId ? null : state.selectedGroup,
    }));
  },

  joinGroup: (groupId) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (!group) {return;}

    const newMember: GroupMember = {
      id: 'currentUser',
      nickname: '나',
      level: 10,
      role: 'member',
      joinedAt: new Date(),
      totalStudyMinutes: 0,
      weeklyStudyMinutes: 0,
      lastActiveAt: new Date(),
    };

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, members: [...g.members, newMember], updatedAt: new Date()}
          : g
      ),
      myGroups: [...state.myGroups, {...group, members: [...group.members, newMember]}],
    }));
  },

  leaveGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, members: g.members.filter((m) => m.id !== 'currentUser'), updatedAt: new Date()}
          : g
      ),
      myGroups: state.myGroups.filter((g) => g.id !== groupId),
    }));
  },

  applyToGroup: (groupId, message) => {
    const newApplication: GroupApplication = {
      id: Date.now().toString(),
      groupId,
      userId: 'currentUser',
      userNickname: '나',
      userLevel: 10,
      message,
      status: 'pending',
      createdAt: new Date(),
    };
    set((state) => ({
      applications: [...state.applications, newApplication],
    }));
  },

  processApplication: (applicationId, approve) => {
    set((state) => {
      const application = state.applications.find((a) => a.id === applicationId);
      if (!application) {return state;}

      if (approve) {
        // 승인 시 멤버로 추가
        const newMember: GroupMember = {
          id: application.userId,
          nickname: application.userNickname,
          level: application.userLevel,
          role: 'member',
          joinedAt: new Date(),
          totalStudyMinutes: 0,
          weeklyStudyMinutes: 0,
          lastActiveAt: new Date(),
        };

        return {
          applications: state.applications.map((a) =>
            a.id === applicationId
              ? {...a, status: 'approved', processedAt: new Date()}
              : a
          ),
          groups: state.groups.map((g) =>
            g.id === application.groupId
              ? {...g, members: [...g.members, newMember], updatedAt: new Date()}
              : g
          ),
        };
      } else {
        return {
          applications: state.applications.map((a) =>
            a.id === applicationId
              ? {...a, status: 'rejected', processedAt: new Date()}
              : a
          ),
        };
      }
    });
  },

  kickMember: (groupId, memberId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, members: g.members.filter((m) => m.id !== memberId), updatedAt: new Date()}
          : g
      ),
    }));
  },

  promoteMember: (groupId, memberId, role) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId ? {...m, role} : m
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }));
  },

  // 게시글 액션
  addPost: (groupId, post) => {
    const newPost: GroupPost = {
      ...post,
      id: Date.now().toString(),
      likes: 0,
      likedBy: [],
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, posts: [newPost, ...g.posts], updatedAt: new Date()}
          : g
      ),
    }));
  },

  updatePost: (groupId, postId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              posts: g.posts.map((p) =>
                p.id === postId ? {...p, ...updates, updatedAt: new Date()} : p
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }));
  },

  deletePost: (groupId, postId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, posts: g.posts.filter((p) => p.id !== postId), updatedAt: new Date()}
          : g
      ),
    }));
  },

  togglePostPin: (groupId, postId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              posts: g.posts.map((p) =>
                p.id === postId ? {...p, isPinned: !p.isPinned, updatedAt: new Date()} : p
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }));
  },

  togglePostLike: (groupId, postId, userId) => {
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) {return g;}
        return {
          ...g,
          posts: g.posts.map((p) => {
            if (p.id !== postId) {return p;}
            const hasLiked = p.likedBy.includes(userId);
            return {
              ...p,
              likes: hasLiked ? p.likes - 1 : p.likes + 1,
              likedBy: hasLiked
                ? p.likedBy.filter((id) => id !== userId)
                : [...p.likedBy, userId],
            };
          }),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  addNotice: (groupId, notice) => {
    const newNotice: GroupNotice = {
      ...notice,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, notices: [newNotice, ...g.notices], updatedAt: new Date()}
          : g
      ),
    }));
  },

  updateNotice: (groupId, noticeId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              notices: g.notices.map((n) =>
                n.id === noticeId ? {...n, ...updates, updatedAt: new Date()} : n
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }));
  },

  deleteNotice: (groupId, noticeId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, notices: g.notices.filter((n) => n.id !== noticeId), updatedAt: new Date()}
          : g
      ),
    }));
  },

  addSchedule: (groupId, schedule) => {
    const newSchedule: GroupSchedule = {
      ...schedule,
      id: Date.now().toString(),
    };
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, schedules: [...g.schedules, newSchedule], updatedAt: new Date()}
          : g
      ),
    }));
  },

  updateSchedule: (groupId, scheduleId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              schedules: g.schedules.map((s) =>
                s.id === scheduleId ? {...s, ...updates} : s
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }));
  },

  deleteSchedule: (groupId, scheduleId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, schedules: g.schedules.filter((s) => s.id !== scheduleId), updatedAt: new Date()}
          : g
      ),
    }));
  },

  sendMessage: (groupId, content, image) => {
    const newMessage: GroupMessage = {
      id: Date.now().toString(),
      senderId: 'currentUser',
      senderNickname: '나',
      content,
      image,
      createdAt: new Date(),
    };
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {...g, messages: [...g.messages, newMessage], updatedAt: new Date()}
          : g
      ),
    }));
  },

  markAsRead: (groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? {...g, unreadCount: 0} : g
      ),
    }));
  },

  getFilteredGroups: () => {
    const {groups, selectedCategory, searchQuery, showRecruitingOnly} = get();

    return groups.filter((group) => {
      // 카테고리 필터
      if (selectedCategory !== 'all' && group.category !== selectedCategory) {
        return false;
      }

      // 모집중만 보기
      if (showRecruitingOnly && group.status !== 'recruiting') {
        return false;
      }

      // 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = group.name.toLowerCase().includes(query);
        const matchDesc = group.description.toLowerCase().includes(query);
        const matchTags = group.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchTags) {
          return false;
        }
      }

      return true;
    });
  },
}));
