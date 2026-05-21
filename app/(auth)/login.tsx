import { Link, router } from "expo-router";
import { Eye, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { signInWithEmail, validateEmail } from "../../src/features/auth/authStore";
import { signInWithGoogle } from "../../src/features/auth/googleAuth";
import { getResponsiveLayout } from "../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralLight: "#ffb9b2",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
  kakao: "#fee500",
};

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const canSubmit = validateEmail(email) && password.length > 0 && !isSubmitting && !isGoogleSubmitting;

  const handleLogin = async () => {
    if (!canSubmit) {
      setError("이메일과 비밀번호를 확인하세요.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      router.replace("/home");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleSubmitting(true);

    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        router.replace("/home");
      }
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google 로그인에 실패했습니다.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, layout.authHero]}>
          <Text style={styles.logo}>약-맵</Text>
          <Text style={styles.tagline}>스마트한 복약 관리의 시작</Text>
        </View>

        <View style={[styles.card, layout.authCard]}>
          <Text style={styles.title}>로그인</Text>

          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputBox}>
            <Mail color={COLORS.muted} size={24} strokeWidth={2.4} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              value={email}
            />
          </View>

          <Text style={styles.label}>비밀번호</Text>
          <View style={styles.inputBox}>
            <Lock color={COLORS.muted} size={24} strokeWidth={2.4} />
            <TextInput
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={securePassword}
              style={styles.input}
              value={password}
            />
            <Pressable
              accessibilityLabel="비밀번호 보기 전환"
              onPress={() => setSecurePassword((current) => !current)}
              style={styles.iconButton}
            >
              <Eye color={COLORS.muted} size={25} strokeWidth={2.3} />
            </Pressable>
          </View>

          <Pressable style={styles.forgotButton}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            disabled={!canSubmit}
            onPress={handleLogin}
            style={[styles.loginButton, !canSubmit ? styles.disabledButton : null]}
          >
            <Text style={styles.loginButtonText}>
              {isSubmitting ? "로그인 중" : "로그인"}
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.divider} />
          </View>

          <Pressable style={styles.kakaoButton}>
            <View style={styles.kakaoDot} />
            <Text style={styles.kakaoText}>카카오로 계속하기</Text>
          </Pressable>

          <Pressable
            disabled={isSubmitting || isGoogleSubmitting}
            onPress={handleGoogleLogin}
            style={[styles.googleButton, isGoogleSubmitting ? styles.googleButtonDisabled : null]}
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.googleText}>
              {isGoogleSubmitting ? "Google 로그인 중" : "Google로 계속하기"}
            </Text>
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupMuted}>계정이 없으신가요?</Text>
            <Link href="/signup" asChild>
              <Pressable>
                <Text style={styles.signupLink}>회원가입</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <Text style={styles.termsText}>
          로그인하면 약-맵의 서비스 약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 34,
  },
  hero: {
    minHeight: 270,
    alignItems: "center",
    paddingTop: 42,
    backgroundColor: COLORS.coral,
    borderBottomLeftRadius: 82,
    borderBottomRightRadius: 82,
  },
  logo: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: "800",
  },
  tagline: {
    marginTop: 34,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "500",
  },
  card: {
    marginHorizontal: 24,
    marginTop: -80,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.17,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    marginBottom: 30,
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "800",
  },
  label: {
    marginBottom: 10,
    color: COLORS.muted,
    fontSize: 22,
    fontWeight: "700",
  },
  inputBox: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 26,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 21,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "600",
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -10,
    marginBottom: 26,
  },
  forgotText: {
    color: COLORS.coral,
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    marginBottom: 14,
    color: COLORS.coral,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  loginButton: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: COLORS.coral,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: COLORS.coralLight,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "700",
  },
  kakaoButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    borderRadius: 18,
    backgroundColor: COLORS.kakao,
  },
  kakaoDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: COLORS.text,
  },
  kakaoText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  googleButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleMark: {
    color: "#4285f4",
    fontSize: 28,
    fontWeight: "800",
  },
  googleText: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 0,
    marginTop: 34,
  },
  signupMuted: {
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "600",
  },
  signupLink: {
    color: COLORS.coral,
    fontSize: 19,
    fontWeight: "800",
  },
  termsText: {
    marginTop: 30,
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 25,
    textAlign: "center",
  },
});
