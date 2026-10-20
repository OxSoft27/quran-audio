import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    LayoutChangeEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useAudio } from '@/context/AudioContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { useSharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';

const { height: screenHeight } = Dimensions.get('window');

interface InsightsCardProps {
    onPressContinue?: () => void;
    onPressMore?: () => void;
    isVisible?: boolean;
}

const RING_SIZE = 220;
const STROKE_WIDTH = 18;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const InsightsCard: React.FC<InsightsCardProps> = ({
    onPressContinue,
    onPressMore,
    isVisible = true,
}) => {
    const { isPlaying } = useAudio();
    const { scrollY } = useTabBarAnimation();

    const [streakDays, setStreakDays] = useState(1);
    const [weekMinutes, setWeekMinutes] = useState(14);
    const [recordDays, setRecordDays] = useState(3);
    const [targetMinutes, setTargetMinutes] = useState(5);
    const [todaySeconds, setTodaySeconds] = useState(218); // Default ~3:38 for rich initial state

    const [animatedRatio, setAnimatedRatio] = useState(0);

    const progressRatio = Math.min(1, todaySeconds / (targetMinutes * 60));
    const progressRatioRef = useRef(progressRatio);
    progressRatioRef.current = progressRatio;

    const animatedRatioRef = useRef(animatedRatio);
    animatedRatioRef.current = animatedRatio;

    const isInViewRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    const cardTopSV = useSharedValue(-1);
    const cardBottomSV = useSharedValue(-1);

    useEffect(() => {
        loadStats();
    }, []);

    const runRingAnimation = (toRatio: number, fromRatio: number = 0) => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        let start: number | null = null;
        const duration = 1400; // 1.4s smooth Apple Activity ring animation

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(1, elapsed / duration);

            // Apple cubic ease-out curve
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = fromRatio + (toRatio - fromRatio) * easeOut;
            setAnimatedRatio(current);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, []);

    const handleVisibilityChange = (inView: boolean) => {
        if (inView) {
            if (!isInViewRef.current) {
                isInViewRef.current = true;
                // Animate circle from 0 to current progress when user scrolls into this section (scroll effect)
                runRingAnimation(progressRatioRef.current, 0);
            }
        } else {
            if (isInViewRef.current) {
                isInViewRef.current = false;
                // Reset ring ratio when completely scrolled out of view,
                // so it re-animates cleanly when the user scrolls back to the section
                if (animationFrameRef.current !== null) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                setAnimatedRatio(0);
            }
        }
    };

    useAnimatedReaction(
        () => {
            if (!scrollY || cardTopSV.value < 0) return false;
            const currentY = scrollY.value;
            const viewportTop = currentY;
            const viewportBottom = currentY + screenHeight;
            const cardTop = cardTopSV.value;
            const cardBottom = cardBottomSV.value;

            // Trigger when card top enters viewport (with 100px threshold) and card hasn't fully scrolled off top
            const inView = viewportBottom >= cardTop + 100 && viewportTop <= cardBottom;
            return inView;
        },
        (inView, prevInView) => {
            if (inView !== prevInView) {
                runOnJS(handleVisibilityChange)(inView);
            }
        },
        [screenHeight]
    );

    const handleLayout = (e: LayoutChangeEvent) => {
        const { y, height } = e.nativeEvent.layout;
        cardTopSV.value = y;
        cardBottomSV.value = y + height;

        // Check if card is ALREADY in viewport on initial render
        const currentY = scrollY ? scrollY.value : 0;
        const viewportBottom = currentY + screenHeight;
        const inView = viewportBottom >= y + 100 && currentY <= y + height;
        if (inView && !isInViewRef.current) {
            isInViewRef.current = true;
            setTimeout(() => {
                runRingAnimation(progressRatioRef.current, 0);
            }, 300);
        }
    };

    const handleReplayAnimation = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAnimatedRatio(0);
        setTimeout(() => {
            runRingAnimation(progressRatioRef.current, 0);
        }, 80);
    };

    // Increment listened seconds while playing - only moves the timer numbers!
    useEffect(() => {
        let interval: any = null;
        if (isPlaying) {
            interval = setInterval(() => {
                setTodaySeconds((prev) => {
                    const next = prev + 1;
                    AsyncStorage.setItem('@today_listening_seconds', next.toString());
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying]);

    const currentDayIndex = (new Date().getDay() + 6) % 7; // 0 = Sen, 1 = Sel, ..., 6 = Min
    const [completedDays, setCompletedDays] = useState<number[]>([0, 1]);

    const loadStats = async () => {
        try {
            const todayStr = new Date().toISOString().slice(0, 10);
            const savedDate = await AsyncStorage.getItem('@today_listening_date');

            if (savedDate !== todayStr) {
                await AsyncStorage.setItem('@today_listening_date', todayStr);
                await AsyncStorage.setItem('@today_listening_seconds', '0');
                setTodaySeconds(0);
            } else {
                const savedSec = await AsyncStorage.getItem('@today_listening_seconds');
                if (savedSec) {
                    setTodaySeconds(parseInt(savedSec, 10));
                }
            }

            const savedCompleted = await AsyncStorage.getItem('@listening_completed_days_v2');
            if (savedCompleted) {
                try {
                    setCompletedDays(JSON.parse(savedCompleted));
                } catch (_) { }
            } else {
                // Initialize completed days for past days up to current day
                const initialDays: number[] = [];
                for (let i = 0; i < currentDayIndex; i++) {
                    initialDays.push(i);
                }
                setCompletedDays(initialDays);
            }

            const savedStreak = await AsyncStorage.getItem('@streak_days');
            if (savedStreak) setStreakDays(parseInt(savedStreak, 10));

            const savedTarget = await AsyncStorage.getItem('@target_minutes');
            if (savedTarget) setTargetMinutes(parseInt(savedTarget, 10));
        } catch (e) {
            // fallback to initial
        }
    };

    // Auto-record completion when user reaches today's goal
    useEffect(() => {
        if (todaySeconds >= targetMinutes * 60) {
            setCompletedDays((prev) => {
                if (!prev.includes(currentDayIndex)) {
                    const next = [...prev, currentDayIndex];
                    AsyncStorage.setItem('@listening_completed_days_v2', JSON.stringify(next));
                    return next;
                }
                return prev;
            });
        }
    }, [todaySeconds, targetMinutes, currentDayIndex]);

    const formatMinutesSeconds = (totalSec: number) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const strokeOffset = CIRCUMFERENCE * (1 - animatedRatio);

    const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const days = DAY_LABELS.map((label, idx) => {
        if (idx === currentDayIndex) {
            const isTodayDone = todaySeconds >= targetMinutes * 60 || completedDays.includes(idx);
            return {
                label,
                status: isTodayDone ? ('done' as const) : ('today' as const),
            };
        } else if (idx < currentDayIndex) {
            const isDone = completedDays.includes(idx);
            return {
                label,
                status: isDone ? ('done' as const) : ('missed' as const),
            };
        } else {
            return {
                label,
                status: 'upcoming' as const,
            };
        }
    });

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>Wawasan</Text>
                    <Ionicons name="information-circle-outline" size={18} color="rgba(255, 255, 255, 0.45)" style={{ marginLeft: 6 }} />
                </View>
                <TouchableOpacity onPress={onPressMore} activeOpacity={0.7}>
                    <Text style={styles.moreLink}>Lihat lebih banyak</Text>
                </TouchableOpacity>
            </View>

            {/* Dark Card Container */}
            <View style={styles.card}>
                {/* 3 Columns Stat Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                        <Ionicons name="flame" size={20} color="#F97316" />
                        <Text style={styles.statLabel}>Rentetan</Text>
                        <Text style={styles.statValue}>{streakDays} hari</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                        <Ionicons name="calendar-outline" size={19} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.statLabel}>Minggu ini</Text>
                        <Text style={styles.statValue}>{weekMinutes} mnt</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statCol}>
                        <Ionicons name="ribbon-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.statLabel}>Rekor</Text>
                        <Text style={styles.statValue}>{recordDays} hari</Text>
                    </View>
                </View>

                {/* Apple Fitness 360-Degree Animated Interactive Progress Ring */}
                <TouchableOpacity
                    style={styles.gaugeContainer}
                    activeOpacity={0.92}
                    onPress={handleReplayAnimation}
                >
                    <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Defs>
                            <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#25E2DE" />
                                <Stop offset="100%" stopColor="#1DB8B5" />
                            </SvgGradient>
                        </Defs>
                        {/* Background 360 Ring Track */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke="rgba(29, 184, 181, 0.12)"
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                        />
                        {/* Foreground Animated Progress Ring */}
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RADIUS}
                            stroke="url(#ringGrad)"
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                        />
                    </Svg>

                    {/* Center Info Inside Apple Ring */}
                    <View style={styles.centerInfo}>
                        <Text style={styles.centerSub}>Dengar hari ini</Text>
                        <Text style={styles.centerNumber}>{formatMinutesSeconds(todaySeconds)}</Text>
                        <TouchableOpacity
                            style={styles.targetRow}
                            onPress={() => {
                                Haptics.selectionAsync();
                                const next = targetMinutes === 5 ? 10 : targetMinutes === 10 ? 15 : 5;
                                setTargetMinutes(next);
                                const newRatio = Math.min(1, todaySeconds / (next * 60));
                                runRingAnimation(newRatio, animatedRatioRef.current);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.targetText}>
                                dari target {targetMinutes} menit Anda {'>'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Days of Week Row */}
                <View style={styles.daysRow}>
                    {days.map((d, index) => (
                        <View key={index} style={styles.dayCol}>
                            {d.status === 'missed' && (
                                <View style={styles.missedIcon}>
                                    <Ionicons name="close" size={12} color="#FFFFFF" />
                                </View>
                            )}
                            {d.status === 'done' && (
                                <View style={styles.doneIcon}>
                                    <Ionicons name="checkmark" size={14} color="#0B1C1A" />
                                </View>
                            )}
                            {d.status === 'today' && (
                                <View style={styles.todayIcon}>
                                    <View style={styles.todayInnerRing} />
                                </View>
                            )}
                            {d.status === 'upcoming' && (
                                <View style={styles.upcomingIcon}>
                                    <View style={styles.upcomingInnerDot} />
                                </View>
                            )}
                            <Text style={[styles.dayLabel, index === currentDayIndex && styles.dayLabelToday]}>
                                {d.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Continue Listening CTA */}
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onPressContinue?.();
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={15} color="#0B1C1A" style={{ marginRight: 6 }} />
                    <Text style={styles.continueButtonText}>{isPlaying ? "Jeda" : "Lanjut dengar"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.pagePadding,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    moreLink: {
        fontSize: 14,
        color: '#1DB8B5',
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#131315',
        borderRadius: 28,
        padding: 22,
        borderWidth: 0.5,
        borderColor: 'rgba(29, 184, 181, 0.15)',
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.55)',
        marginTop: 4,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
    gaugeContainer: {
        height: 230,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
        position: 'relative',
    },
    centerInfo: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    centerSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        fontWeight: '500',
        marginBottom: 2,
    },
    centerNumber: {
        fontSize: 44,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    targetRow: {
        marginTop: 2,
    },
    targetText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.55)',
        fontWeight: '500',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginTop: 20,
        marginBottom: 20,
    },
    dayCol: {
        alignItems: 'center',
    },
    missedIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(29, 184, 181, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    doneIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#1DB8B5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    todayIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#1DB8B5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    todayInnerRing: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1DB8B5',
    },
    upcomingIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    upcomingInnerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dayLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    dayLabelToday: {
        color: '#25E2DE',
        fontWeight: '700',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1DB8B5',
        borderRadius: 24,
        paddingVertical: 14,
        shadowColor: '#1DB8B5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0B1C1A',
    },
});
