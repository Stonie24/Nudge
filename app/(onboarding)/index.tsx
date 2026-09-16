import React, { useRef, useState, useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { AppText as Text } from '../../components/AppText'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/ThemeContext'
import { triggerHaptic } from '../../hooks/useAnimation'
import type { Colors } from '../../lib/theme'
import { space, radius } from '../../lib/theme'
import { displayFont } from '../../lib/fonts'
import { Icon, type IconName } from '../../components/Icon'

const SCREEN_WIDTH = Dimensions.get('window').width

type Step = {
  id: string
  // 'dot' is the plain brand mark used for the welcome step — none of the
  // named icons fit "welcome" well enough to force one.
  icon: IconName | 'dot'
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    icon: 'dot',
    title: 'Welcome to Nudge',
    body: 'A calm, focused task manager. No notifications shouting at you — just gentle nudges to keep you on track.',
  },
  {
    id: 'today',
    icon: 'today',
    title: 'Your daily board',
    body: 'Every day starts fresh. Add tasks to your board and check them off as you go. Simple and distraction-free.',
  },
  {
    id: 'tags',
    icon: 'tag',
    title: 'Stay organised with tags',
    body: 'Group tasks by project, habit, or area of your life. Create custom tags with your own colours.',
  },
  {
    id: 'recurring',
    icon: 'repeat',
    title: 'Build daily habits',
    body: 'Mark any task as recurring and it will appear on your board every day — perfect for morning routines and healthy habits.',
  },
  {
    id: 'ready',
    icon: 'check',
    title: "You're all set",
    body: "That's everything you need to know. Start small — add one task and see how it feels.",
  },
]

export default function OnboardingScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [finishing, setFinishing] = useState(false)

  // Slide animation
  const slideX = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(1)).current

  function animateToStep(nextStep: number) {
    const direction = nextStep > step ? -1 : 1
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: direction * 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep)
      slideX.setValue(-direction * 40)
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideX, {
          toValue: 0,
          tension: 120,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  async function handleNext() {
    triggerHaptic('light')
    if (step < STEPS.length - 1) {
      animateToStep(step + 1)
      return
    }
    // Last step — mark onboarding complete and navigate to the app
    setFinishing(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { onboarding_completed: true } })
      if (error) {
        console.warn('Failed to persist onboarding completion:', error.message)
        return
      }
      router.replace('/(tabs)/')
    } finally {
      setFinishing(false)
    }
  }

  function handleBack() {
    if (step === 0) return
    triggerHaptic('light')
    animateToStep(step - 1)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>

        {/* Animated content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: contentOpacity, transform: [{ translateX: slideX }] },
          ]}
        >
          <View style={styles.icon}>
            {current.icon === 'dot'
              ? <View style={[styles.iconDot, { backgroundColor: colors.accent }]} />
              : <Icon name={current.icon} size={40} color={colors.accent} strokeWidth={1.6} />
            }
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, finishing && styles.btnDisabled]}
            onPress={handleNext}
            disabled={finishing}
            activeOpacity={0.85}
          >
            {finishing
              ? <ActivityIndicator color={colors.btnPrimaryText} />
              : <Text style={styles.primaryBtnText}>
                  {isLast ? 'Get started' : 'Continue'}
                </Text>
            }
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {!isLast && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={async () => {
                triggerHaptic('light')
                setFinishing(true)
                try {
                  const { error } = await supabase.auth.updateUser({ data: { onboarding_completed: true } })
                  if (error) {
                    console.warn('Failed to persist onboarding completion:', error.message)
                    return
                  }
                  router.replace('/(tabs)/')
                } finally {
                  setFinishing(false)
                }
              }}
              activeOpacity={0.7}
              disabled={finishing}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  )
}

function createStyles(c: Colors) {
  const isDesktop = SCREEN_WIDTH >= 768
  const contentWidth = isDesktop ? 480 : SCREEN_WIDTH

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: space.huge,
      paddingHorizontal: space.xxxl,
      maxWidth: contentWidth,
      alignSelf: 'center',
      width: '100%',
    },
    dots: {
      flexDirection: 'row',
      gap: space.sm,
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.borderLight,
    },
    dotActive: {
      width: 20,
      backgroundColor: c.accent,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      gap: space.xl,
    },
    icon: {
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.sm,
    },
    iconDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    title: {
      fontFamily: displayFont.bold,
      fontSize: isDesktop ? 36 : 30,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.8,
      textAlign: 'center',
    },
    body: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: '300',
      maxWidth: 360,
    },
    actions: {
      width: '100%',
      gap: space.md,
      alignItems: 'center',
    },
    primaryBtn: {
      height: 52,
      backgroundColor: c.btnPrimary,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      color: c.btnPrimaryText,
      fontSize: 15,
      fontWeight: '500',
    },
    backBtn: {
      paddingVertical: space.sm,
      paddingHorizontal: space.xl,
    },
    backBtnText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    skipBtn: {
      paddingVertical: space.sm,
      paddingHorizontal: space.xl,
    },
    skipBtnText: {
      fontSize: 14,
      color: c.textMuted,
    },
  })
}
