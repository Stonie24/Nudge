import Svg, { Path, Circle, Line } from 'react-native-svg'
import type { StyleProp, ViewStyle } from 'react-native'

// Stroked icon set on a 24px grid, replacing the Unicode glyphs used as
// icons throughout the app (tab bar, onboarding, calendar integrations).
// Every icon shares the same visual language: round caps/joins, no fill,
// ~1.8 stroke weight by default.
export type IconName =
  | 'today'
  | 'calendar'
  | 'list'
  | 'settings'
  | 'check'
  | 'plus'
  | 'repeat'
  | 'search'
  | 'trash'
  | 'chevron'
  | 'close'
  | 'bell'
  | 'streak'
  | 'tag'
  | 'sort'
  | 'more'

export function Icon({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 1.8,
  rotate,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  /** Degrees. Lets the single chevron double as left/right/up/down. */
  rotate?: number
  style?: StyleProp<ViewStyle>
}) {
  const props = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={[rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null, style]}
    >
      {name === 'today' && (
        <>
          <Circle cx={12} cy={12} r={4} {...props} />
          <Line x1={12} y1={2} x2={12} y2={4.5} {...props} />
          <Line x1={12} y1={19.5} x2={12} y2={22} {...props} />
          <Line x1={2} y1={12} x2={4.5} y2={12} {...props} />
          <Line x1={19.5} y1={12} x2={22} y2={12} {...props} />
          <Line x1={4.9} y1={4.9} x2={6.6} y2={6.6} {...props} />
          <Line x1={17.4} y1={17.4} x2={19.1} y2={19.1} {...props} />
          <Line x1={4.9} y1={19.1} x2={6.6} y2={17.4} {...props} />
          <Line x1={17.4} y1={6.6} x2={19.1} y2={4.9} {...props} />
        </>
      )}

      {name === 'calendar' && (
        <>
          <Path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20V6A1.5 1.5 0 0 1 5 4.5z" {...props} />
          <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} {...props} />
          <Line x1={8} y1={2.5} x2={8} y2={6.5} {...props} />
          <Line x1={16} y1={2.5} x2={16} y2={6.5} {...props} />
        </>
      )}

      {name === 'list' && (
        <>
          <Line x1={4} y1={6} x2={20} y2={6} {...props} />
          <Line x1={4} y1={12} x2={20} y2={12} {...props} />
          <Line x1={4} y1={18} x2={20} y2={18} {...props} />
        </>
      )}

      {name === 'settings' && (
        <>
          <Line x1={4} y1={6} x2={20} y2={6} {...props} />
          <Circle cx={15} cy={6} r={2} {...props} />
          <Line x1={4} y1={12} x2={20} y2={12} {...props} />
          <Circle cx={9} cy={12} r={2} {...props} />
          <Line x1={4} y1={18} x2={20} y2={18} {...props} />
          <Circle cx={17} cy={18} r={2} {...props} />
        </>
      )}

      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7" {...props} />}

      {name === 'plus' && (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...props} />
          <Line x1={5} y1={12} x2={19} y2={12} {...props} />
        </>
      )}

      {name === 'repeat' && (
        <>
          <Path d="M4 12a8 8 0 0 1 8-8h5" {...props} />
          <Path d="M14.5 1.5 17 4l-2.5 2.5" {...props} />
          <Path d="M20 12a8 8 0 0 1-8 8H7" {...props} />
          <Path d="M9.5 22.5 7 20l2.5-2.5" {...props} />
        </>
      )}

      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...props} />
          <Line x1={15.8} y1={15.8} x2={21} y2={21} {...props} />
        </>
      )}

      {name === 'trash' && (
        <>
          <Line x1={4} y1={7} x2={20} y2={7} {...props} />
          <Path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" {...props} />
          <Path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" {...props} />
          <Line x1={10} y1={11} x2={10} y2={17} {...props} />
          <Line x1={14} y1={11} x2={14} y2={17} {...props} />
        </>
      )}

      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...props} />}

      {name === 'close' && (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...props} />
          <Line x1={18} y1={6} x2={6} y2={18} {...props} />
        </>
      )}

      {name === 'bell' && (
        <>
          <Path d="M12 3a5 5 0 0 0-5 5v2.5l-2 4.5h14l-2-4.5V8a5 5 0 0 0-5-5z" {...props} />
          <Path d="M9.5 18a2.5 2.5 0 0 0 5 0" {...props} />
        </>
      )}

      {name === 'streak' && (
        <Path
          d="M12 2c1 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c1 1 1.5 2.3 1.5 3.5a4 4 0 1 1-8 0C8 8.5 11 7 12 2z"
          {...props}
        />
      )}

      {name === 'tag' && (
        <>
          <Path d="M11.5 3H5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3z" {...props} />
          <Circle cx={8} cy={8} r={1.3} {...props} />
        </>
      )}

      {name === 'sort' && (
        <>
          <Line x1={4} y1={7} x2={17} y2={7} {...props} />
          <Line x1={4} y1={12} x2={13} y2={12} {...props} />
          <Line x1={4} y1={17} x2={9} y2={17} {...props} />
        </>
      )}

      {name === 'more' && (
        <>
          <Circle cx={5.5} cy={12} r={1.3} fill={color} stroke="none" />
          <Circle cx={12} cy={12} r={1.3} fill={color} stroke="none" />
          <Circle cx={18.5} cy={12} r={1.3} fill={color} stroke="none" />
        </>
      )}
    </Svg>
  )
}
