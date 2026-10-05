import React, { createContext, useContext, useEffect } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withSpring,
    interpolate,
    Extrapolation,
    SharedValue,
} from 'react-native-reanimated';
import { useAudio } from '@/context/AudioContext';
import { useSubscription } from '@/context/SubscriptionContext';

export interface TabBarAnimationContextType {
    collapseProgress: SharedValue<number>;
    isCollapsed: SharedValue<number>;
    scrollY: SharedValue<number>;
    fullTabsAnimatedStyle: any;
    compactTabAnimatedStyle: any;
    searchButtonAnimatedStyle: any;
    miniPlayerAnimatedStyle: any;
    adBannerAnimatedStyle: any;
    tabBarAnimatedStyle: any;
    scale: SharedValue<number>;
    translateY: SharedValue<number>;
    scrollHandler: any;
    expandTabBar: () => void;
    collapseTabBar: () => void;
}

const TabBarAnimationContext = createContext<TabBarAnimationContextType | null>(null);

const SPRING_CONFIG = {
    damping: 18,
    stiffness: 140,
    mass: 0.8,
    overshootClamping: false,
};

export const TabBarAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentTrack } = useAudio();
    const { isPremium } = useSubscription();
    const hasTrack = !!currentTrack;

    // 0 = fully expanded (resting state / scroll up)
    // 1 = fully collapsed (scrolling down)
    const collapseProgress = useSharedValue(0);
    const hasTrackSV = useSharedValue(hasTrack ? 1 : 0);
    const adOffsetSV = useSharedValue(!isPremium ? 56 : 0);

    // Keep hasTrackSV and adOffsetSV in sync
    useEffect(() => {
        hasTrackSV.value = hasTrack ? 1 : 0;
    }, [hasTrack]);

    useEffect(() => {
        adOffsetSV.value = !isPremium ? 56 : 0;
    }, [isPremium]);

    const lastScrollY = useSharedValue(0);
    const scrollY = useSharedValue(0);

    const expandTabBar = () => {
        'worklet';
        collapseProgress.value = withSpring(0, SPRING_CONFIG);
    };

    const collapseTabBar = () => {
        'worklet';
        collapseProgress.value = withSpring(1, SPRING_CONFIG);
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            'worklet';
            const currentY = event.contentOffset.y;
            scrollY.value = currentY;

            // When near or above top (including pull-to-refresh overscroll), always expand
            if (currentY <= 25) {
                if (collapseProgress.value !== 0) {
                    collapseProgress.value = withSpring(0, SPRING_CONFIG);
                }
                lastScrollY.value = currentY;
                return;
            }

            const dy = currentY - lastScrollY.value;

            // Downward scroll threshold: user has scrolled past 50px and moving down by > 6px
            if (dy > 6 && currentY > 50) {
                if (collapseProgress.value !== 1) {
                    collapseProgress.value = withSpring(1, SPRING_CONFIG);
                }
            } else if (dy < -6) {
                // Upward scroll threshold: user scrolling up by > 6px
                if (collapseProgress.value !== 0) {
                    collapseProgress.value = withSpring(0, SPRING_CONFIG);
                }
            }

            lastScrollY.value = currentY;
        },
        onBeginDrag: (event) => {
            'worklet';
            scrollY.value = event.contentOffset.y;
            lastScrollY.value = event.contentOffset.y;
        },
        onMomentumEnd: (event) => {
            'worklet';
            scrollY.value = event.contentOffset.y;
            if (event.contentOffset.y <= 25) {
                collapseProgress.value = withSpring(0, SPRING_CONFIG);
            }
        },
    });

    // 1. Full 4-tab capsule animation (slides down off screen)
    const fullTabsAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [
                {
                    translateY: interpolate(
                        collapseProgress.value,
                        [0, 1],
                        [0, 100],
                        Extrapolation.CLAMP
                    ),
                },
            ],
            opacity: interpolate(
                collapseProgress.value,
                [0, 0.5, 1],
                [1, 0.3, 0],
                Extrapolation.CLAMP
            ),
        };
    });

    // 2. Compact single active tab icon button (scales/fades IN on bottom left when collapsed with audio)
    const compactTabAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        if (hasTrackSV.value === 0) {
            return {
                opacity: 0,
                transform: [{ scale: 0.5 }, { translateY: 20 }],
            };
        }
        return {
            transform: [
                {
                    scale: interpolate(
                        collapseProgress.value,
                        [0.2, 1],
                        [0.5, 1],
                        Extrapolation.CLAMP
                    ),
                },
                {
                    translateY: interpolate(
                        collapseProgress.value,
                        [0.2, 1],
                        [16, 0],
                        Extrapolation.CLAMP
                    ),
                },
            ],
            opacity: interpolate(
                collapseProgress.value,
                [0.3, 1],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    // 3. Right search button animation
    const searchButtonAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        if (hasTrackSV.value === 1) {
            // When audio is playing, Search stays visible at bottom right
            return {
                transform: [{ translateY: 0 }],
                opacity: 1,
            };
        }
        // When no audio is playing, Search slides down off screen together with tabs
        return {
            transform: [
                {
                    translateY: interpolate(
                        collapseProgress.value,
                        [0, 1],
                        [0, 100],
                        Extrapolation.CLAMP
                    ),
                },
            ],
            opacity: interpolate(
                collapseProgress.value,
                [0, 0.5, 1],
                [1, 0.3, 0],
                Extrapolation.CLAMP
            ),
        };
    });

    // 4. MiniPlayer animation: moves down to bottom row (74 + adOffset) and insets margins by 74px on each side
    const miniPlayerAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        const targetDown = 74 + adOffsetSV.value;
        const translateY = interpolate(
            collapseProgress.value,
            [0, 1],
            [0, targetDown],
            Extrapolation.CLAMP
        );
        const sideInset = interpolate(
            collapseProgress.value,
            [0, 1],
            [0, 74],
            Extrapolation.CLAMP
        );
        return {
            transform: [{ translateY }],
            marginLeft: sideInset,
            marginRight: sideInset,
        };
    });

    // 5. AdBanner animation: slides down off screen when collapsed
    const adBannerAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [
                {
                    translateY: interpolate(
                        collapseProgress.value,
                        [0, 1],
                        [0, 140],
                        Extrapolation.CLAMP
                    ),
                },
            ],
            opacity: interpolate(
                collapseProgress.value,
                [0, 0.4, 0.8],
                [1, 0.2, 0],
                Extrapolation.CLAMP
            ),
        };
    });

    // Legacy compatibility styles
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const tabBarAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [
                {
                    translateY: interpolate(
                        collapseProgress.value,
                        [0, 1],
                        [0, 100],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    return (
        <TabBarAnimationContext.Provider
            value={{
                collapseProgress,
                isCollapsed: collapseProgress,
                scrollY,
                fullTabsAnimatedStyle,
                compactTabAnimatedStyle,
                searchButtonAnimatedStyle,
                miniPlayerAnimatedStyle,
                adBannerAnimatedStyle,
                tabBarAnimatedStyle,
                scale,
                translateY,
                scrollHandler,
                expandTabBar,
                collapseTabBar,
            }}
        >
            {children}
        </TabBarAnimationContext.Provider>
    );
};

export const useTabBarAnimation = () => {
    const context = useContext(TabBarAnimationContext);
    if (!context) {
        return {
            collapseProgress: { value: 0 } as SharedValue<number>,
            isCollapsed: { value: 0 } as SharedValue<number>,
            scrollY: { value: 0 } as SharedValue<number>,
            fullTabsAnimatedStyle: {},
            compactTabAnimatedStyle: {},
            searchButtonAnimatedStyle: {},
            miniPlayerAnimatedStyle: {},
            adBannerAnimatedStyle: {},
            tabBarAnimatedStyle: {},
            scale: { value: 1 } as SharedValue<number>,
            translateY: { value: 0 } as SharedValue<number>,
            scrollHandler: undefined,
            expandTabBar: () => {},
            collapseTabBar: () => {},
        };
    }
    return context;
};
