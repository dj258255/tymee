// Type declarations for modules without TypeScript definitions

declare module '@shopify/react-native-skia' {
  import {ViewProps} from 'react-native';

  export interface CanvasProps extends ViewProps {
    children?: React.ReactNode;
  }
  export const Canvas: React.FC<CanvasProps>;
  export const Circle: React.FC<any>;
  export const Path: React.FC<any>;
  export const Group: React.FC<any>;
  export const Text: React.FC<any>;
  export const Line: React.FC<any>;
  export const Rect: React.FC<any>;
  export const RoundedRect: React.FC<any>;
  export const Paint: React.FC<any>;
  export const Shader: React.FC<any>;
  export const LinearGradient: React.FC<any>;
  export const vec: (x: number, y: number) => {x: number; y: number};
  export const useFont: (font: any, size: number) => any;
  export const Skia: {
    Path: {
      Make: () => any;
    };
    RuntimeEffect: {
      Make: (source: string) => any;
    };
  };
}

// Extend Icon name type to accept any string
declare module '@react-native-vector-icons/ionicons' {
  import {Component} from 'react';
  import {TextProps} from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

// Global type augmentation for __DEV__
declare const __DEV__: boolean;
