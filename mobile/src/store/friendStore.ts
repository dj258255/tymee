import {create} from 'zustand';

// 친구 상태
export type FriendStatus = 'online' | 'studying' | 'offline';

// 친구 요청 상태
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// 뱃지 타입
export interface Badge {
  id: string;
  icon: string;
  color: string;
  name?: string;
}

// 친구 정보
export interface Friend {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  status: FriendStatus;
  statusMessage?: string;
  level: number;
  tier?: string;
  todayStudyTime?: number; // 오늘 공부 시간 (분)
  lastActive?: Date;
  badges?: Badge[]; // 뱃지 목록
}

// 친구 요청
export interface FriendRequest {
  id: string;
  from: {
    id: string;
    nickname: string;
    profileImage?: string;
    level: number;
  };
  message?: string;
  createdAt: Date;
  status: FriendRequestStatus;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

// 채팅방
export interface ChatRoom {
  id: string;
  friendId: string;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface FriendState {
  // 친구 목록
  friends: Friend[];
  // 친구 요청 목록
  friendRequests: FriendRequest[];
  // 보낸 요청 목록
  sentRequests: FriendRequest[];
  // 채팅방 목록
  chatRooms: ChatRoom[];
  // 현재 열린 채팅방
  activeChatRoomId: string | null;
  // 검색 결과
  searchResults: Friend[];
  // 로딩 상태
  isLoading: boolean;

  // Actions
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  updateFriendStatus: (friendId: string, status: FriendStatus) => void;

  // 친구 요청 관련
  setFriendRequests: (requests: FriendRequest[]) => void;
  addFriendRequest: (request: FriendRequest) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  sendFriendRequest: (toUserId: string, message?: string) => void;

  // 검색 관련
  searchUsers: (query: string) => void;
  clearSearchResults: () => void;

  // 채팅 관련
  setChatRooms: (rooms: ChatRoom[]) => void;
  openChat: (friendId: string) => void;
  closeChat: () => void;
  sendMessage: (friendId: string, content: string) => void;
  markAsRead: (chatRoomId: string) => void;

  // 로딩
  setIsLoading: (loading: boolean) => void;
}

// 더미 친구 데이터
const dummyFriends: Friend[] = [
  {
    id: '1',
    nickname: '공부왕김공부',
    status: 'studying',
    statusMessage: '정처기 실기 준비 중',
    level: 42,
    tier: '석사 II',
    todayStudyTime: 180,
    lastActive: new Date(),
    badges: [
      {id: '1', icon: 'flame', color: '#FF6B6B'},
      {id: '2', icon: 'trophy', color: '#FFD700'},
    ],
  },
  {
    id: '2',
    nickname: '새벽형인간',
    status: 'online',
    statusMessage: '오늘도 파이팅!',
    level: 28,
    tier: '학사 III',
    todayStudyTime: 90,
    lastActive: new Date(),
    badges: [
      {id: '1', icon: 'moon', color: '#9C27B0'},
    ],
  },
  {
    id: '3',
    nickname: '토익마스터',
    status: 'offline',
    statusMessage: '토익 900+ 목표',
    level: 35,
    tier: '석사 I',
    todayStudyTime: 0,
    lastActive: new Date(Date.now() - 3600000 * 2), // 2시간 전
    badges: [
      {id: '1', icon: 'book', color: '#4CAF50'},
      {id: '2', icon: 'star', color: '#00BCD4'},
    ],
  },
  {
    id: '4',
    nickname: '열공이',
    status: 'studying',
    statusMessage: '수능까지 D-100',
    level: 55,
    tier: '박사',
    todayStudyTime: 240,
    lastActive: new Date(),
    badges: [
      {id: '1', icon: 'diamond', color: '#9C27B0'},
      {id: '2', icon: 'flame', color: '#FF6B6B'},
      {id: '3', icon: 'trophy', color: '#FFD700'},
    ],
  },
  {
    id: '5',
    nickname: '의대생지망',
    status: 'offline',
    statusMessage: '',
    level: 18,
    tier: '고등학생',
    todayStudyTime: 30,
    lastActive: new Date(Date.now() - 3600000 * 24), // 하루 전
  },
];

// 더미 친구 요청 데이터
const dummyRequests: FriendRequest[] = [
  {
    id: 'req1',
    from: {
      id: 'user1',
      nickname: '수학천재',
      level: 22,
    },
    message: '같이 공부해요!',
    createdAt: new Date(Date.now() - 3600000),
    status: 'pending',
  },
  {
    id: 'req2',
    from: {
      id: 'user2',
      nickname: '코딩러버',
      level: 31,
    },
    message: '개발자 준비생입니다. 친구해요~',
    createdAt: new Date(Date.now() - 7200000),
    status: 'pending',
  },
];

// 더미 채팅 데이터
const dummyChatRooms: ChatRoom[] = [
  {
    id: 'chat1',
    friendId: '1',
    messages: [
      {
        id: 'msg1',
        senderId: '1',
        content: '오늘 공부 어떻게 됐어?',
        createdAt: new Date(Date.now() - 3600000),
        isRead: true,
      },
      {
        id: 'msg2',
        senderId: 'me',
        content: '3시간 했어! 너는?',
        createdAt: new Date(Date.now() - 3500000),
        isRead: true,
      },
      {
        id: 'msg3',
        senderId: '1',
        content: '나도 비슷해 ㅎㅎ 내일도 화이팅!',
        createdAt: new Date(Date.now() - 3400000),
        isRead: false,
      },
    ],
    lastMessage: {
      id: 'msg3',
      senderId: '1',
      content: '나도 비슷해 ㅎㅎ 내일도 화이팅!',
      createdAt: new Date(Date.now() - 3400000),
      isRead: false,
    },
    unreadCount: 1,
  },
  {
    id: 'chat2',
    friendId: '2',
    messages: [
      {
        id: 'msg4',
        senderId: '2',
        content: '새벽에 같이 공부할래?',
        createdAt: new Date(Date.now() - 86400000),
        isRead: true,
      },
    ],
    lastMessage: {
      id: 'msg4',
      senderId: '2',
      content: '새벽에 같이 공부할래?',
      createdAt: new Date(Date.now() - 86400000),
      isRead: true,
    },
    unreadCount: 0,
  },
];

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: dummyFriends,
  friendRequests: dummyRequests,
  sentRequests: [],
  chatRooms: dummyChatRooms,
  activeChatRoomId: null,
  searchResults: [],
  isLoading: false,

  setFriends: (friends) => set({friends}),

  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),

  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
      chatRooms: state.chatRooms.filter((r) => r.friendId !== friendId),
    })),

  updateFriendStatus: (friendId, status) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === friendId ? {...f, status, lastActive: new Date()} : f
      ),
    })),

  setFriendRequests: (requests) => set({friendRequests: requests}),

  addFriendRequest: (request) =>
    set((state) => ({
      friendRequests: [request, ...state.friendRequests],
    })),

  acceptFriendRequest: (requestId) => {
    const state = get();
    const request = state.friendRequests.find((r) => r.id === requestId);
    if (request) {
      // 친구로 추가
      const newFriend: Friend = {
        id: request.from.id,
        nickname: request.from.nickname,
        profileImage: request.from.profileImage,
        status: 'offline',
        level: request.from.level,
      };
      set({
        friends: [...state.friends, newFriend],
        friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
      });
    }
  },

  rejectFriendRequest: (requestId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    })),

  sendFriendRequest: (toUserId, message) => {
    // 실제 구현에서는 API 호출
    const newRequest: FriendRequest = {
      id: Date.now().toString(),
      from: {
        id: 'me',
        nickname: '나',
        level: 1,
      },
      message,
      createdAt: new Date(),
      status: 'pending',
    };
    set((state) => ({
      sentRequests: [...state.sentRequests, newRequest],
    }));
  },

  searchUsers: (query) => {
    if (!query.trim()) {
      set({searchResults: []});
      return;
    }
    // 더미 검색 결과
    const results: Friend[] = [
      {
        id: 'search1',
        nickname: query + '님',
        status: 'online',
        level: Math.floor(Math.random() * 50) + 1,
        tier: '학사 II',
      },
      {
        id: 'search2',
        nickname: '공부하는' + query,
        status: 'studying',
        level: Math.floor(Math.random() * 50) + 1,
        tier: '중학생',
      },
    ];
    set({searchResults: results});
  },

  clearSearchResults: () => set({searchResults: []}),

  setChatRooms: (rooms) => set({chatRooms: rooms}),

  openChat: (friendId) => {
    const state = get();
    let room = state.chatRooms.find((r) => r.friendId === friendId);
    if (!room) {
      // 새 채팅방 생성
      room = {
        id: `chat_${friendId}_${Date.now()}`,
        friendId,
        messages: [],
        unreadCount: 0,
      };
      set({
        chatRooms: [...state.chatRooms, room],
        activeChatRoomId: room.id,
      });
    } else {
      set({activeChatRoomId: room.id});
    }
  },

  closeChat: () => set({activeChatRoomId: null}),

  sendMessage: (friendId, content) => {
    const state = get();
    const room = state.chatRooms.find((r) => r.friendId === friendId);
    if (room) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        content,
        createdAt: new Date(),
        isRead: false,
      };
      set({
        chatRooms: state.chatRooms.map((r) =>
          r.friendId === friendId
            ? {
                ...r,
                messages: [...r.messages, newMessage],
                lastMessage: newMessage,
              }
            : r
        ),
      });
    }
  },

  markAsRead: (chatRoomId) =>
    set((state) => ({
      chatRooms: state.chatRooms.map((r) =>
        r.id === chatRoomId
          ? {
              ...r,
              unreadCount: 0,
              messages: r.messages.map((m) => ({...m, isRead: true})),
            }
          : r
      ),
    })),

  setIsLoading: (loading) => set({isLoading: loading}),
}));
