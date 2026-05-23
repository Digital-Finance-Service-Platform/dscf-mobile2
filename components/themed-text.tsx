import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default'| 'default2' | 'default3' | 'input' | 'view' | 'defaultSemiBold2'| 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'default2' ? styles.default2 : undefined,
        type === 'default3' ? styles.default3 : undefined,
        type === 'view' ? styles.view : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'defaultSemiBold2' ? styles.defaultSemiBold2 : undefined,
        type === 'input' ? styles.input : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  default2: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    color: '#5A413D',
  },
   default3: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    color: '#5A413D',
  },
    input: {
    fontSize: 14,
    backgroundColor: '#E3E2E1',
    paddingHorizontal: 19,
    
    paddingVertical: 14,
    borderRadius: 8,
    },
   view: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    color: '#5A413D',

  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    color: '#800000',

  },
  defaultSemiBold2: {
    fontSize: 25,
    lineHeight: 24,
    fontWeight: '900',
    color: '#800000',

  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 32,
    color:'#1A1C1C'

  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1C',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
