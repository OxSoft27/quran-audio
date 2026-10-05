import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated as RNAnimated,
    PanResponder,
    PanResponderGestureState,
    Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTabBarAnimation } from '@/context/TabBarAnimationContext';
import { SearchModal } from '@/components/SearchModal';

export interface CustomBottomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
    insets?: any;
}

const ALLOWED_TABS = ['home', 'qari', 'playlist', 'settings'];
const CAPSULE_PADDING = 6;
const PILL_HEIGHT = 46;
const PILL_RADIUS = 23;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const {
        fullTabsAnimatedStyle,
        compactTabAnimatedStyle,
        searchButtonAnimatedStyle,
        expandTabBar,
    } = useTabBarAnimation();
    const [searchVisible, setSearchVisible] = useState(false);

    const bottomPadding = Math.max(insets.bottom, 12);
    const activeRoute = state.routes[state.index]?.name;

    // Filter visible tabs strictly
    const visibleRoutes = state.routes.filter((route: any) => {
        const { options } = descriptors[route.key];
        return ALLOWED_TABS.includes(route.name) && options.href !== null;
    });

    const activeVisibleIndex = Math.max(
        0,
        visibleRoutes.findIndex((r: any) => r.name === activeRoute)
    );

    // Liquid animation physics values
    const capsuleRef = useRef<View>(null);
    const [capsuleWidth, setCapsuleWidth] = useState<number>(SCREEN_WIDTH - 28 - 74);
    const capsulePageXRef = useRef<number>(14);
    const capsuleWidthRef = useRef<number>(SCREEN_WIDTH - 28 - 74);
    const isMeasuredRef = useRef<boolean>(false);

    const isDraggingRef = useRef<boolean>(false);
    const hoverIndexRef = useRef<number>(activeVisibleIndex);
    const [hoveredTab, setHoveredTab] = useState<number | null>(null);

    const translateX = useRef(new RNAnimated.Value(0)).current;
    const scaleX = useRef(new RNAnimated.Value(1)).current;
    const scaleY = useRef(new RNAnimated.Value(1)).current;

    const getTabWidth = () => {
        const usableWidth = capsuleWidthRef.current - CAPSULE_PADDING * 2;
        return usableWidth / Math.max(visibleRoutes.length, 1);
    };

    const getPillWidth = () => {
        const tabWidth = getTabWidth();
        return Math.max(tabWidth - 6, 44);
    };

    const getRestingX = (index: number) => {
        const tabWidth = getTabWidth();
        const pillWidth = getPillWidth();
        return CAPSULE_PADDING + index * tabWidth + (tabWidth - pillWidth) / 2;
    };

    // Update capsule dimensions on screen
    const updateMeasurements = () => {
        capsuleRef.current?.measureInWindow((x, _y, width) => {
            if (width > 0) {
                capsulePageXRef.current = x;
                capsuleWidthRef.current = width;
                setCapsuleWidth(width);
                if (!isMeasuredRef.current) {
                    isMeasuredRef.current = true;
                    translateX.setValue(getRestingX(activeVisibleIndex));
                }
            }
        });
    };

    useEffect(() => {
        const timer = setTimeout(updateMeasurements, 80);
        return () => clearTimeout(timer);
    }, []);

    // Spring liquid pill when active route changes (and not dragging)
    useEffect(() => {
        expandTabBar();
        if (!isDraggingRef.current && isMeasuredRef.current) {
            const targetX = getRestingX(activeVisibleIndex);
            hoverIndexRef.current = activeVisibleIndex;

            RNAnimated.parallel([
                RNAnimated.spring(translateX, {
                    toValue: targetX,
                    friction: 6.5,
                    tension: 80,
                    useNativeDriver: true,
                }),
                RNAnimated.sequence([
                    RNAnimated.spring(scaleX, {
                        toValue: 1.15,
                        friction: 5,
                        tension: 110,
                        useNativeDriver: true,
                    }),
                    RNAnimated.spring(scaleX, {
                        toValue: 1.0,
                        friction: 6.5,
                        tension: 85,
                        useNativeDriver: true,
                    }),
                ]),
                RNAnimated.sequence([
                    RNAnimated.spring(scaleY, {
                        toValue: 0.88,
                        friction: 5,
                        tension: 110,
                        useNativeDriver: true,
                    }),
                    RNAnimated.spring(scaleY, {
                        toValue: 1.0,
                        friction: 6.5,
                        tension: 85,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        }
    }, [state.index, capsuleWidth]);

    const updatePillFromGesture = (pageX: number, gestureState: PanResponderGestureState) => {
        const currentCapsuleX = capsulePageXRef.current;
        const tabWidth = getTabWidth();
        const pillWidth = getPillWidth();
        const numTabs = Math.max(visibleRoutes.length, 1);

        // Center pill at touch location
        const touchX = pageX - currentCapsuleX;
        const targetPillX = touchX - pillWidth / 2;

        const minX = getRestingX(0);
        const maxX = getRestingX(numTabs - 1);
        // Allow subtle elastic resistance over edges
        const clampedX = Math.max(minX - 12, Math.min(maxX + 12, targetPillX));

        // Liquid stretch calculation (elongate horizontally, compress vertically)
        const speed = Math.abs(gestureState.vx);
        const stretch = Math.min(speed * 0.32 + 0.08, 0.36);

        translateX.setValue(clampedX);
        scaleX.setValue(1.0 + stretch);
        scaleY.setValue(Math.max(0.80, 1.0 - stretch * 0.45));

        // Calculate hovered tab
        const touchXInUsable = touchX - CAPSULE_PADDING;
        let hovered = Math.floor(touchXInUsable / tabWidth);
        hovered = Math.max(0, Math.min(numTabs - 1, hovered));

        if (hovered !== hoverIndexRef.current) {
            hoverIndexRef.current = hovered;
            setHoveredTab(hovered);
            Haptics.selectionAsync();
        }
    };

    const finalizeGesture = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setHoveredTab(null);

        const finalIndex = hoverIndexRef.current;
        const targetX = getRestingX(finalIndex);

        RNAnimated.parallel([
            RNAnimated.spring(translateX, {
                toValue: targetX,
                friction: 6.5,
                tension: 80,
                useNativeDriver: true,
            }),
            RNAnimated.spring(scaleX, {
                toValue: 1.0,
                friction: 6.5,
                tension: 85,
                useNativeDriver: true,
            }),
            RNAnimated.spring(scaleY, {
                toValue: 1.0,
                friction: 6.5,
                tension: 85,
                useNativeDriver: true,
            }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const targetRoute = visibleRoutes[finalIndex];
        if (targetRoute && state.routes[state.index]?.name !== targetRoute.name) {
            expandTabBar();
            navigation.navigate(targetRoute.name);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 6;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 6;
            },
            onPanResponderGrant: (evt, gestureState) => {
                isDraggingRef.current = true;
                expandTabBar();
                updateMeasurements();
                updatePillFromGesture(evt.nativeEvent.pageX, gestureState);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            onPanResponderMove: (evt, gestureState) => {
                updatePillFromGesture(evt.nativeEvent.pageX, gestureState);
            },
            onPanResponderRelease: () => {
                finalizeGesture();
            },
            onPanResponderTerminate: () => {
                finalizeGesture();
            },
        })
    ).current;

    const handleOpenSearch = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSearchVisible(true);
    };

    const handleCompactTabPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        expandTabBar();
    };

    const getCompactIconName = (): any => {
        switch (activeRoute) {
            case 'home':
                return 'home';
            case 'qari':
                return 'mic';
            case 'playlist':
                return 'grid';
            case 'settings':
                return 'settings-sharp';
            default:
                return 'home';
        }
    };

    return (
        <>
            <View
                style={[styles.container, { bottom: bottomPadding }]}
                pointerEvents="box-none"
            >
                {/* Compact Single Tab Button (Fades & Scales IN on the left when collapsed) */}
                <Animated.View
                    style={[
                        styles.compactTabButton,
                        compactTabAnimatedStyle,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.compactTabTouchable}
                        onPress={handleCompactTabPress}
                        activeOpacity={0.8}
                    >
                        <BlurView
                            intensity={isDark ? 75 : 90}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.compactTabBlur,
                                {
                                    backgroundColor: isDark ? 'rgba(20, 20, 22, 0.55)' : 'rgba(255, 255, 255, 0.82)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                        >
                            <Ionicons
                                name={getCompactIconName()}
                                size={22}
                                color={isDark ? '#FFFFFF' : '#111827'}
                            />
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Full Tabs Capsule (Slides DOWN off-screen when collapsed) */}
                <Animated.View
                    style={[styles.tabsCapsuleWrapper, fullTabsAnimatedStyle]}
                    pointerEvents="box-none"
                >
                    <View
                        ref={capsuleRef}
                        onLayout={updateMeasurements}
                        {...panResponder.panHandlers}
                        style={styles.capsuleTouchContainer}
                    >
                        <BlurView
                            intensity={isDark ? 75 : 90}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.tabsCapsule,
                                {
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                                    backgroundColor: isDark ? 'rgba(20, 20, 22, 0.55)' : 'rgba(255, 255, 255, 0.82)',
                                    shadowOpacity: isDark ? 0.35 : 0.1,
                                },
                            ]}
                        >
                            <View style={styles.tabRow}>
                                {/* Liquid Pill Indicator */}
                                <RNAnimated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.liquidPill,
                                        {
                                            width: getPillWidth(),
                                            height: PILL_HEIGHT,
                                            borderRadius: PILL_RADIUS,
                                            transform: [
                                                { translateX },
                                                { scaleX },
                                                { scaleY },
                                            ],
                                        },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={
                                            isDark
                                                ? ['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.11)']
                                                : ['rgba(0, 0, 0, 0.09)', 'rgba(0, 0, 0, 0.04)']
                                        }
                                        style={[
                                            styles.liquidPillGradient,
                                            {
                                                borderRadius: PILL_RADIUS,
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.08)',
                                            },
                                        ]}
                                    />
                                </RNAnimated.View>

                                {/* Visible Tabs */}
                                {visibleRoutes.map((route: any, index: number) => {
                                    const { options } = descriptors[route.key];
                                    const isFocused = state.routes[state.index]?.name === route.name;
                                    const isHighlighted = isDraggingRef.current && hoveredTab !== null
                                        ? hoveredTab === index
                                        : isFocused;

                                    const label =
                                        options.tabBarLabel !== undefined
                                            ? (options.tabBarLabel as string)
                                            : options.title !== undefined
                                            ? options.title
                                            : route.name;

                                    const onPress = () => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        expandTabBar();
                                        const event = navigation.emit({
                                            type: 'tabPress',
                                            target: route.key,
                                            canPreventDefault: true,
                                        });

                                        if (!isFocused && !event.defaultPrevented) {
                                            navigation.navigate(route.name);
                                        }
                                    };

                                    const activeColor = isDark ? '#FFFFFF' : '#111827';
                                    const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)';
                                    const color = isHighlighted ? activeColor : inactiveColor;

                                    return (
                                        <TouchableOpacity
                                            key={route.key}
                                            accessibilityRole="button"
                                            accessibilityState={isFocused ? { selected: true } : {}}
                                            accessibilityLabel={options.tabBarAccessibilityLabel}
                                            testID={options.tabBarButtonTestID}
                                            onPress={onPress}
                                            style={styles.tabItem}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.tabContent, isHighlighted && styles.tabContentActive]}>
                                                {options.tabBarIcon &&
                                                    options.tabBarIcon({
                                                        focused: isHighlighted,
                                                        color,
                                                        size: 20,
                                                    })}
                                                <Text
                                                    style={[
                                                        styles.label,
                                                        { color },
                                                        isHighlighted && styles.labelActive,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Right Floating Circular Search Button */}
                <Animated.View style={searchButtonAnimatedStyle}>
                    <TouchableOpacity
                        style={[
                            styles.searchButton,
                            {
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                                shadowOpacity: isDark ? 0.35 : 0.1,
                            },
                        ]}
                        onPress={handleOpenSearch}
                        activeOpacity={0.8}
                    >
                        <BlurView
                            intensity={isDark ? 75 : 90}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.searchBlur,
                                { backgroundColor: isDark ? 'rgba(20, 20, 22, 0.55)' : 'rgba(255, 255, 255, 0.82)' },
                            ]}
                        >
                            <Ionicons name="search" size={22} color={isDark ? '#FFFFFF' : '#111827'} />
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Search Modal */}
            <SearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        pointerEvents: 'box-none',
    },
    compactTabButton: {
        position: 'absolute',
        left: 0,
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 8,
        zIndex: 15,
    },
    compactTabTouchable: {
        width: '100%',
        height: '100%',
    },
    compactTabBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 32,
        borderWidth: 0.5,
    },
    tabsCapsuleWrapper: {
        flex: 1,
        marginRight: 10,
    },
    capsuleTouchContainer: {
        width: '100%',
        height: 64,
        borderRadius: 32,
    },
    tabsCapsule: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 0.5,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 8,
    },
    tabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: CAPSULE_PADDING,
        position: 'relative',
    },
    liquidPill: {
        position: 'absolute',
        top: (64 - PILL_HEIGHT) / 2,
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    liquidPillGradient: {
        width: '100%',
        height: '100%',
        borderWidth: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        zIndex: 2,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: 1 }],
    },
    tabContentActive: {
        transform: [{ scale: 1.05 }],
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    labelActive: {
        fontWeight: '700',
    },
    searchButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 0.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 12,
        elevation: 8,
    },
    searchBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
