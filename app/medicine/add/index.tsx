import { Link, router } from "expo-router";
import { ArrowLeft, Camera, Search } from "lucide-react-native";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralLight: "#ffb1aa",
  mintPale: "#eaf8f5",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

export default function AddMedicineScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={COLORS.text} size={30} strokeWidth={2.4} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>약 추가하기</Text>
          <Text style={styles.headerSubtitle}>방법을 선택하세요</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Link href="/medicine/add/scan" asChild>
          <Pressable style={styles.scanCard}>
            <View style={styles.scanIconBox}>
              <Camera color={COLORS.white} size={42} strokeWidth={2.4} />
            </View>
            <View style={styles.optionTextBox}>
              <Text style={styles.scanTitle}>약 봉투 스캔하기</Text>
              <Text style={styles.scanSubtitle}>카메라로 약 봉투 촬영</Text>
            </View>
          </Pressable>
        </Link>

        <Link href="/medicine/add/search" asChild>
          <Pressable style={styles.searchCard}>
            <View style={styles.searchIconBox}>
              <Search color={COLORS.text} size={44} strokeWidth={2.4} />
            </View>
            <View style={styles.optionTextBox}>
              <Text style={styles.searchTitle}>직접 검색하기</Text>
              <Text style={styles.searchSubtitle}>약 이름으로 검색</Text>
            </View>
          </Pressable>
        </Link>
      </View>
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
    gap: 22,
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  scanCard: {
    minHeight: 156,
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: COLORS.coralLight,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 7,
  },
  scanIconBox: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  searchCard: {
    minHeight: 156,
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },
  searchIconBox: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor: COLORS.mintPale,
  },
  optionTextBox: {
    flex: 1,
  },
  scanTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
  },
  scanSubtitle: {
    marginTop: 16,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },
  searchTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  searchSubtitle: {
    marginTop: 16,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
  },
});
