import { router } from "expo-router";
import { ArrowLeft, Eye, Lock, Mail, User } from "lucide-react-native";
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

import {
  signUpWithEmail,
  validateEmail,
  validatePassword,
} from "../../src/features/auth/authStore";
import { useGoogleAuth } from "../../src/features/auth/googleAuth";
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

export default function SignupScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const { signInWithGoogle } = useGoogleAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [securePasswordConfirm, setSecurePasswordConfirm] = useState(true);
  const [serviceAgreed, setServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    validateEmail(email) &&
    validatePassword(password) &&
    password === passwordConfirm &&
    serviceAgreed &&
    privacyAgreed &&
    !isSubmitting &&
    !isGoogleSubmitting;

  const handleSignup = async () => {
    if (!canSubmit) {
      setError("회원가입 정보를 확인하세요.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signUpWithEmail({ email, name, password, passwordConfirm });
      router.replace("/home");
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsGoogleSubmitting(true);

    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        router.replace("/home");
      }
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google 가입에 실패했습니다.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, layout.header]}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={COLORS.text} size={30} strokeWidth={2.4} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>회원가입</Text>
          <Text style={styles.headerSubtitle}>약-맵과 함께 시작하세요</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, layout.content]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>이름</Text>
        <View style={styles.inputBox}>
          <User color={COLORS.muted} size={25} strokeWidth={2.4} />
          <TextInput
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={name}
          />
        </View>

        <Text style={styles.label}>이메일</Text>
        <View style={styles.inputBox}>
          <Mail color={COLORS.muted} size={25} strokeWidth={2.4} />
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
          <Lock color={COLORS.muted} size={25} strokeWidth={2.4} />
          <TextInput
            onChangeText={setPassword}
            placeholder="8자 이상 입력하세요"
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
        <Text style={styles.helperText}>영문, 숫자 포함 8자 이상</Text>

        <Text style={styles.label}>비밀번호 확인</Text>
        <View style={styles.inputBox}>
          <Lock color={COLORS.muted} size={25} strokeWidth={2.4} />
          <TextInput
            onChangeText={setPasswordConfirm}
            placeholder="비밀번호를 다시 입력하세요"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={securePasswordConfirm}
            style={styles.input}
            value={passwordConfirm}
          />
          <Pressable
            accessibilityLabel="비밀번호 확인 보기 전환"
            onPress={() => setSecurePasswordConfirm((current) => !current)}
            style={styles.iconButton}
          >
            <Eye color={COLORS.muted} size={25} strokeWidth={2.3} />
          </Pressable>
        </View>

        <View style={styles.agreements}>
          <Pressable
            onPress={() => setServiceAgreed((current) => !current)}
            style={styles.agreementRow}
          >
            <View
              style={[
                styles.checkbox,
                serviceAgreed ? styles.checkboxChecked : null,
              ]}
            />
            <Text style={styles.agreementText}>(필수) 서비스 이용약관 동의</Text>
          </Pressable>

          <Pressable
            onPress={() => setPrivacyAgreed((current) => !current)}
            style={styles.agreementRow}
          >
            <View
              style={[
                styles.checkbox,
                privacyAgreed ? styles.checkboxChecked : null,
              ]}
            />
            <Text style={styles.agreementText}>
              (필수) 개인정보 처리방침 동의
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={handleSignup}
          style={[styles.signupButton, !canSubmit ? styles.disabledButton : null]}
        >
          <Text style={styles.signupButtonText}>
            {isSubmitting ? "가입 중" : "가입하기"}
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>간편 가입</Text>
          <View style={styles.divider} />
        </View>

        <Pressable style={styles.kakaoButton}>
          <View style={styles.kakaoDot} />
          <Text style={styles.kakaoText}>카카오로 계속하기</Text>
        </Pressable>

        <Pressable
          disabled={isSubmitting || isGoogleSubmitting}
          onPress={handleGoogleSignup}
          style={[styles.googleButton, isGoogleSubmitting ? styles.googleButtonDisabled : null]}
        >
          <Text style={styles.googleMark}>G</Text>
          <Text style={styles.googleText}>
            {isGoogleSubmitting ? "Google 처리 중" : "Google로 계속하기"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#efebe6",
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 42,
  },
  label: {
    marginBottom: 12,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  inputBox: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
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
  helperText: {
    marginTop: -24,
    marginBottom: 34,
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: "600",
  },
  agreements: {
    gap: 20,
    marginTop: 14,
    marginBottom: 44,
  },
  agreementRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  checkboxChecked: {
    borderColor: COLORS.coral,
    backgroundColor: COLORS.coral,
  },
  agreementText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  signupButton: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: COLORS.coral,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: COLORS.coralLight,
  },
  errorText: {
    marginTop: 14,
    color: COLORS.coral,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  signupButtonText: {
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
    fontSize: 20,
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
});
