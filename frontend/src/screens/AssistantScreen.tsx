import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, FadeIn, IconButton, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { api, imageUrl } from '@/lib/api';
import { colors, fonts, radius, space, TAB_BAR_SPACE } from '@/theme';

type FlowerRef = { slug: string; name: string; localName: string; image: string };
type Msg = { id: string; from: 'bot' | 'user'; text: string; flowers?: FlowerRef[] };
type ChatReply = { reply: string; suggestions?: string[]; flowers?: FlowerRef[]; context?: { flowerSlug?: string } };

const STARTERS = [
  { icon: 'calendar-outline' as const, text: 'What should I plant this month?' },
  { icon: 'water-outline' as const, text: 'How often should I water roses?' },
  { icon: 'leaf-outline' as const, text: 'Why are my leaves turning yellow?' },
  { icon: 'paw-outline' as const, text: 'Which flowers are safe for pets?' },
];

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[styles.bot, { flexDirection: 'row', gap: 5, paddingVertical: 16, alignSelf: 'flex-start' }]}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }), transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      ))}
    </View>
  );
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ flower?: string; ask?: string; t?: string }>();
  const keyboard = useKeyboardVisible();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [context, setContext] = useState<{ flowerSlug?: string }>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  async function send(text: string, ctx = context) {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setSuggestions([]);
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: 'user', text: message }]);
    setBusy(true);
    try {
      // A short pause makes the reply feel considered rather than instant.
      const [r] = await Promise.all([api<ChatReply>('/chat', { method: 'POST', body: { message, context: ctx } }), new Promise((res) => setTimeout(res, 550))]);
      setMessages((m) => [...m, { id: `b${Date.now()}`, from: 'bot', text: r.reply, flowers: r.flowers }]);
      setSuggestions(r.suggestions ?? []);
      setContext(r.context ?? {});
    } catch (e: any) {
      setMessages((m) => [...m, { id: `e${Date.now()}`, from: 'bot', text: `⚠️ ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  // Opened from a flower page: ask about that flower straight away.
  useEffect(() => {
    if (params.ask) send(params.ask, { flowerSlug: params.flower });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.t]);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, busy]);

  const flowerRoute = (slug: string) => router.push(`/flower/${slug}`);
  const bottomPad = keyboard ? 10 : TAB_BAR_SPACE - 18 + insets.bottom;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatar}>
          <Ionicons name="leaf" size={20} color={colors.white} />
          <View style={styles.online} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="heading" style={{ fontSize: 22, lineHeight: 26 }}>Flora</T>
          <T variant="caption">Your plant-care assistant</T>
        </View>
        {messages.length > 0 && (
          <IconButton
            icon="refresh"
            size={40}
            onPress={() => {
              setMessages([]);
              setSuggestions([]);
              setContext({});
            }}
          />
        )}
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: space.gutter, paddingBottom: 16, gap: 12, flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {messages.length === 0 && (
          <FadeIn style={{ flex: 1, justifyContent: 'center', paddingVertical: 20 }}>
            <View style={styles.introIcon}>
              <Ionicons name="chatbubbles-outline" size={30} color={colors.forest} />
            </View>
            <T variant="display" center style={{ fontSize: 34, lineHeight: 40 }}>
              Salam{user ? `, ${user.name.split(' ')[0]}` : ''}.{'\n'}How can I help?
            </T>
            <T variant="body" center color={colors.muted} style={{ marginTop: 10, paddingHorizontal: 10 }}>
              Ask about watering, sunlight, pests, or what to plant this season. I know every flower in the library.
            </T>
            <View style={{ gap: 10, marginTop: 26 }}>
              {STARTERS.map((s, i) => (
                <FadeIn key={s.text} delay={150 + i * 60}>
                  <Tap onPress={() => send(s.text)} style={styles.starter} scaleTo={0.98}>
                    <View style={styles.starterIcon}>
                      <Ionicons name={s.icon} size={17} color={colors.forest} />
                    </View>
                    <T variant="bodyStrong" style={{ flex: 1, fontSize: 14 }}>{s.text}</T>
                    <Ionicons name="arrow-forward" size={16} color={colors.faint} />
                  </Tap>
                </FadeIn>
              ))}
            </View>
          </FadeIn>
        )}

        {messages.map((m) => (
          <FadeIn key={m.id} distance={8} style={{ alignItems: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <View style={m.from === 'user' ? styles.user : styles.bot}>
              <T style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }} color={m.from === 'user' ? colors.white : colors.ink}>
                {m.text}
              </T>
            </View>
            {m.flowers && m.flowers.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, alignSelf: 'stretch' }} contentContainerStyle={{ gap: 8 }}>
                {m.flowers.map((f) => (
                  <Tap key={f.slug} onPress={() => flowerRoute(f.slug)} style={styles.flowerChip} scaleTo={0.95}>
                    <Image source={{ uri: imageUrl(f.image) }} style={styles.flowerThumb} contentFit="cover" />
                    <View>
                      <T style={{ fontFamily: fonts.semibold, fontSize: 13 }} color={colors.ink}>{f.name}</T>
                      <T variant="caption" style={{ fontSize: 11 }}>View care guide</T>
                    </View>
                  </Tap>
                ))}
              </ScrollView>
            )}
          </FadeIn>
        ))}
        {busy && <TypingDots />}
      </ScrollView>

      <View style={{ paddingBottom: bottomPad }}>
        {suggestions.length > 0 && !busy && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => send(s)} style={{ backgroundColor: colors.sageSoft, borderColor: colors.sage }} />
            ))}
          </ScrollView>
        )}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about any plant…"
            placeholderTextColor={colors.faint}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
            blurOnSubmit
          />
          <Tap onPress={() => send(input)} disabled={!input.trim() || busy} style={[styles.send, (!input.trim() || busy) && { opacity: 0.4 }]} scaleTo={0.88}>
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Tap>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.bg },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  online: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#7BC47F', borderWidth: 2, borderColor: colors.bg },
  introIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  starter: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  starterIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  bot: { maxWidth: '88%', backgroundColor: colors.surface, borderRadius: 20, borderTopLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.line },
  user: { maxWidth: '80%', backgroundColor: colors.forest, borderRadius: 20, borderTopRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.forestSoft },
  flowerChip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, paddingRight: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  flowerThumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginHorizontal: space.gutter, padding: 6, paddingLeft: 18, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, maxHeight: 110, paddingVertical: 11 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
});
