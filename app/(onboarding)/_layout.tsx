import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // We'll build custom headers for onboarding
        animation: 'fade_from_bottom',
        animationDuration: 250,
      }}
    />
  );
}
