import {create} from 'zustand';

// ============ 타입 정의 ============

export type FeedCategory = 'all' | 'popular' | 'study_done' | 'general' | 'question' | 'info' | 'recommend' | 'success' | 'study_group' | 'free';

export type CardFrameType = 'default' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'neon' | 'space' | 'fire';

export interface Badge {
  id: string;
  icon: string;
  color: string;
}

export interface FeedAuthor {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  level?: number;
  tier?: string;
  title?: string;
  cardFrame?: CardFrameType;
  badges?: Badge[];
}

export interface StudyDoneData {
  totalMinutes: number;
  subjects: Array<{name: string; color: string; minutes: number}>;
  streak?: number;
  date: string;
}

export interface StudyGroupData {
  title: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
  tags: string[];
  startDate?: string;
}

export interface FeedItem {
  id: string;
  category: FeedCategory;
  author: FeedAuthor;
  title?: string; // 자유게시판용 제목
  content: string;
  image?: string;
  studyDoneData?: StudyDoneData;
  studyGroupData?: StudyGroupData;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  feedId: string;
  parentId?: string; // 대댓글인 경우 부모 댓글 ID
  author: FeedAuthor;
  content: string;
  image?: string; // 댓글 이미지
  likes: number;
  isLiked: boolean;
  replies?: Comment[]; // 대댓글 목록
  createdAt: Date;
}

// ============ Store 인터페이스 ============

interface CommunityState {
  feeds: FeedItem[];
  comments: Record<string, Comment[]>;
  selectedCategory: FeedCategory;
  isLoading: boolean;

  // Actions
  setCategory: (category: FeedCategory) => void;
  toggleLike: (feedId: string) => void;
  addFeed: (feed: Omit<FeedItem, 'id' | 'createdAt' | 'likes' | 'comments' | 'isLiked'>) => void;
  addComment: (feedId: string, content: string, image?: string, parentId?: string) => void;
  toggleCommentLike: (feedId: string, commentId: string) => void;
  getFilteredFeeds: () => FeedItem[];
  getFeedComments: (feedId: string) => Comment[];
}

// ============ 유틸 함수 ============

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ============ 더미 데이터 ============

const dummyFeeds: FeedItem[] = [
  {
    id: '1',
    category: 'study_done',
    author: {
      id: 'user1',
      nickname: '열공러',
      level: 15,
      tier: '학사 II',
      title: '꾸준한 학습자',
      cardFrame: 'gold',
      badges: [
        {id: 'study', icon: 'school', color: '#4CAF50'},
        {id: 'streak', icon: 'flame', color: '#FF5722'},
      ],
    },
    content: '오늘도 목표 달성! 수학 집중해서 풀었더니 시간 가는 줄 몰랐네요',
    studyDoneData: {
      totalMinutes: 320,
      subjects: [
        {name: '수학', color: '#007AFF', minutes: 180},
        {name: '영어', color: '#4CAF50', minutes: 90},
        {name: '국어', color: '#FF9500', minutes: 50},
      ],
      streak: 15,
      date: new Date().toISOString().split('T')[0],
    },
    likes: 24,
    comments: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
  },
  {
    id: '2',
    category: 'study_group',
    author: {
      id: 'user2',
      nickname: '스터디장',
      level: 22,
      tier: '석사 I',
      title: '스터디 리더',
      cardFrame: 'space',
      badges: [
        {id: 'leader', icon: 'people', color: '#2196F3'},
        {id: 'focus', icon: 'eye', color: '#9C27B0'},
      ],
    },
    content: '같이 공부하실 분 구합니다! 평일 저녁 2시간씩 온라인으로 진행해요.',
    studyGroupData: {
      title: '평일 저녁 공부방',
      description: '매일 저녁 8-10시 줌으로 캠스터디',
      maxMembers: 6,
      currentMembers: 3,
      tags: ['캠스터디', '평일저녁', '온라인'],
    },
    likes: 12,
    comments: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
  },
  {
    id: '3',
    category: 'question',
    author: {
      id: 'user3',
      nickname: '수험생A',
      level: 8,
      tier: '고등학생',
      title: '열정가득',
      cardFrame: 'silver',
      badges: [
        {id: 'book', icon: 'book', color: '#607D8B'},
      ],
    },
    title: '슬럼프 극복 방법 공유해주세요',
    content: '요즘 집중이 안 돼서 힘드네요... 슬럼프 극복하신 분들 어떻게 하셨나요? 공부하려고 앉으면 자꾸 딴 생각이 나고, 핸드폰만 보게 돼요. 좋은 방법 있으면 알려주세요!',
    likes: 45,
    comments: 23,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
  },
  // 일반 게시판 추가 더미 데이터 (페이징 테스트용)
  ...Array.from({length: 30}, (_, i) => ({
    id: `general_${i + 1}`,
    category: ['general', 'question', 'info', 'recommend', 'success'][i % 5] as FeedCategory,
    author: {
      id: `user_free_${i}`,
      nickname: ['열공이', '공부왕', '수험생', '고시생', '자격증러'][i % 5],
      level: Math.floor(Math.random() * 30) + 1,
      tier: ['중학생', '고등학생', '학사 I', '학사 II', '석사 I'][i % 5],
      title: ['초보학습자', '성실한노력가', '집중의달인', '공부마스터', '전설의학습자'][i % 5],
      cardFrame: (['default', 'bronze', 'silver', 'gold', 'diamond'] as CardFrameType[])[i % 5],
      badges: i % 3 === 0 ? [
        {id: 'badge1', icon: ['flame', 'star', 'trophy'][i % 3], color: ['#FF5722', '#FFD700', '#4CAF50'][i % 3]},
      ] : i % 3 === 1 ? [
        {id: 'badge1', icon: 'flame', color: '#FF5722'},
        {id: 'badge2', icon: 'star', color: '#FFD700'},
      ] : [],
    },
    title: [
      '공부 자극 좀 주세요',
      '오늘 카페 가서 공부할 사람?',
      '좋은 공부 음악 추천 부탁드려요',
      '집중 안 될 때 어떻게 하시나요?',
      '시험 D-30 같이 화이팅해요',
      '새벽 공부 vs 아침 공부',
      '공부 계획 세우는 팁 공유',
      '오늘의 공부 명언',
      '공부하다 지칠 때 뭐하세요?',
      '다들 화이팅!!',
    ][i % 10],
    content: [
      '요즘 공부 의욕이 없어요ㅠㅠ 자극 좀 주세요! 여러분은 어떻게 동기부여 하시나요?',
      '혼자 공부하기 심심한데, 오늘 강남역 근처 카페 가서 공부할 사람 있나요?',
      '공부할 때 듣기 좋은 음악 추천해주세요! 저는 요즘 lo-fi 많이 듣는데 다른 장르도 궁금해요.',
      '집중이 안 될 때 어떻게 하시나요? 저는 산책 다녀오는데 다른 방법도 알고 싶어요.',
      '시험까지 한 달 남았어요! 같이 열심히 해봐요. 서로 응원해요!',
      '새벽에 공부하는 게 효율적인가요, 아침에 일찍 일어나서 하는 게 좋은가요? 의견 주세요!',
      '공부 계획 어떻게 세우시나요? 저는 항상 계획만 세우고 못 지켜서요...',
      '"오늘 하루를 낭비하는 것은 내일을 훔치는 것이다" - 오늘의 명언입니다!',
      '공부하다 지치면 뭐하세요? 저는 잠깐 유튜브 보는데 시간이 훅 가버려요ㅠㅠ',
      '다들 화이팅입니다!! 오늘도 열심히 공부해봐요!',
    ][i % 10],
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 30),
    isLiked: Math.random() > 0.5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * (i + 6)), // 6시간 전부터
  })),
  {
    id: '4',
    category: 'study_done',
    author: {
      id: 'user4',
      nickname: '새벽공부러',
      level: 31,
      tier: '석사 II',
      title: '100일의 기적',
      cardFrame: 'diamond',
      badges: [
        {id: 'streak100', icon: 'flame', color: '#FF5722'},
        {id: 'early', icon: 'moon', color: '#3F51B5'},
        {id: 'master', icon: 'trophy', color: '#FFD700'},
      ],
    },
    content: '100일 연속 달성!! 드디어 해냈어요 ㅠㅠ',
    studyDoneData: {
      totalMinutes: 240,
      subjects: [
        {name: '토익', color: '#9C27B0', minutes: 120},
        {name: '회화', color: '#E91E63', minutes: 120},
      ],
      streak: 100,
      date: new Date().toISOString().split('T')[0],
    },
    likes: 156,
    comments: 42,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8시간 전
  },
  {
    id: '5',
    category: 'study_group',
    author: {
      id: 'user5',
      nickname: '코딩마스터',
      level: 19,
      tier: '학사 II',
      title: '코드마스터',
      cardFrame: 'gold',
      badges: [
        {id: 'code', icon: 'code-slash', color: '#2196F3'},
        {id: 'study', icon: 'school', color: '#4CAF50'},
      ],
    },
    content: '개발 공부하시는 분들! 알고리즘 스터디 함께해요',
    studyGroupData: {
      title: '알고리즘 스터디',
      description: '매주 토요일 오전 백준 문제 풀이',
      maxMembers: 8,
      currentMembers: 5,
      tags: ['알고리즘', '백준', '주말'],
    },
    likes: 28,
    comments: 15,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
  },
];

const dummyComments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      feedId: '1',
      author: {id: 'user10', nickname: '화이팅', level: 5, tier: '고등학생', badges: [{id: 'study', icon: 'book', color: '#607D8B'}]},
      content: '대단해요! 저도 열심히 해야겠어요',
      likes: 3,
      isLiked: false,
      replies: [
        {
          id: 'c1-r1',
          feedId: '1',
          parentId: 'c1',
          author: {id: 'user1', nickname: '열공러', level: 15, tier: '학사 II', badges: [{id: 'streak', icon: 'flame', color: '#FF5722'}]},
          content: '감사합니다! 같이 화이팅해요 💪',
          likes: 1,
          isLiked: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
          id: 'c1-r2',
          feedId: '1',
          parentId: 'c1',
          author: {id: 'user12', nickname: '스터디러', level: 8, tier: '중학생', badges: [{id: 'newbie', icon: 'sparkles', color: '#00BCD4'}]},
          content: '저도 동기부여 받고 갑니다!',
          likes: 0,
          isLiked: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      id: 'c2',
      feedId: '1',
      author: {id: 'user11', nickname: '공부왕', level: 12, tier: '학사 I', badges: [{id: 'focus', icon: 'eye', color: '#9C27B0'}, {id: 'trophy', icon: 'trophy', color: '#FFD700'}]},
      content: '5시간 넘게 하시다니 존경합니다',
      image: 'https://picsum.photos/200/150', // 샘플 이미지
      likes: 8,
      isLiked: true,
      replies: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    },
  ],
};

// ============ Store 생성 ============

export const useCommunityStore = create<CommunityState>((set, get) => ({
  feeds: dummyFeeds,
  comments: dummyComments,
  selectedCategory: 'all',
  isLoading: false,

  setCategory: (category) => {
    set({selectedCategory: category});
  },

  toggleLike: (feedId) => {
    set((state) => ({
      feeds: state.feeds.map((feed) =>
        feed.id === feedId
          ? {
              ...feed,
              isLiked: !feed.isLiked,
              likes: feed.isLiked ? feed.likes - 1 : feed.likes + 1,
            }
          : feed
      ),
    }));
  },

  addFeed: (feedData) => {
    const newFeed: FeedItem = {
      ...feedData,
      id: generateId(),
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date(),
    };
    set((state) => ({
      feeds: [newFeed, ...state.feeds],
    }));
  },

  addComment: (feedId, content, image, parentId) => {
    const newComment: Comment = {
      id: generateId(),
      feedId,
      parentId,
      author: {
        id: 'currentUser',
        nickname: '나',
        level: 10,
        tier: '고등학생',
      },
      content,
      image,
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    set((state) => {
      const existingComments = state.comments[feedId] || [];

      // 대댓글인 경우
      if (parentId) {
        const updatedComments = existingComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        });
        return {
          comments: {
            ...state.comments,
            [feedId]: updatedComments,
          },
          feeds: state.feeds.map((feed) =>
            feed.id === feedId ? {...feed, comments: feed.comments + 1} : feed
          ),
        };
      }

      // 일반 댓글인 경우
      return {
        comments: {
          ...state.comments,
          [feedId]: [...existingComments, newComment],
        },
        feeds: state.feeds.map((feed) =>
          feed.id === feedId ? {...feed, comments: feed.comments + 1} : feed
        ),
      };
    });
  },

  toggleCommentLike: (feedId, commentId) => {
    set((state) => {
      const existingComments = state.comments[feedId] || [];

      const toggleLikeInComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        // 대댓글에서도 찾기
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(toggleLikeInComment),
          };
        }
        return comment;
      };

      return {
        comments: {
          ...state.comments,
          [feedId]: existingComments.map(toggleLikeInComment),
        },
      };
    });
  },

  getFilteredFeeds: () => {
    const {feeds, selectedCategory} = get();
    if (selectedCategory === 'all') {return feeds;}
    // 인기 게시판은 모든 피드를 반환 (정렬은 CommunityScreen의 displayFeeds에서 처리)
    if (selectedCategory === 'popular') {return feeds;}
    return feeds.filter((feed) => feed.category === selectedCategory);
  },

  getFeedComments: (feedId) => {
    return get().comments[feedId] || [];
  },
}));
