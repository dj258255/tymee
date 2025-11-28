export interface Theme {
  name: string;
  colors: {
    idle: string;
    running: string;
    completed: string;
    background: string;
    text: string;
    textSecondary: string;
  };
}

export const THEMES: Record<string, Theme> = {
  oceanBlue: {
    name: 'Ocean Blue',
    colors: {
      idle: '#E8F4F8',
      running: '#0066FF',
      completed: '#00BFFF',
      background: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
    },
  },
  fireRed: {
    name: 'Fire Red',
    colors: {
      idle: '#FFE8E8',
      running: '#FF4444',
      completed: '#FF8C00',
      background: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
    },
  },
  forestGreen: {
    name: 'Forest Green',
    colors: {
      idle: '#E8F5E9',
      running: '#2ECC71',
      completed: '#27AE60',
      background: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
    },
  },
  purpleDream: {
    name: 'Purple Dream',
    colors: {
      idle: '#F3E8FF',
      running: '#9B59B6',
      completed: '#8E44AD',
      background: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
    },
  },
  darkNight: {
    name: 'Dark Night',
    colors: {
      idle: '#34495E',
      running: '#9B59B6',
      completed: '#8E44AD',
      background: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#999999',
    },
  },
  sunsetOrange: {
    name: 'Sunset Orange',
    colors: {
      idle: '#FFF3E0',
      running: '#FF6B6B',
      completed: '#FFA500',
      background: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
    },
  },
};

export const DEFAULT_THEME = 'oceanBlue';
