import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Info, Upload } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { identifyMedicineFromImage } from "../../../src/features/medicine/ocr";
import { medicineToParams } from "../../../src/features/medicine/medicineCatalog";
import { getResponsiveLayout } from "../../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  mintPale: "#eef8f4",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

export default function ScanMedicineScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [error, setError] = useState("");
  const [candidateText, setCandidateText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImage = async (uri?: string) => {
    if (!uri) {
      return;
    }

    setError("");
    setCandidateText("");
    setIsProcessing(true);

    try {
      const result = await identifyMedicineFromImage(uri);
      setCandidateText(
        result.candidates.length > 0
          ? `추출된 후보: ${result.candidates.map((candidate) => candidate.name).join(", ")}`
          : `추출된 후보: ${result.medicine.name}`,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });
      router.push({
        pathname: "/medicine/add/schedule",
        params: medicineToParams(result.medicine),
      });
    } catch {
      setError("약 봉투 인식에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("카메라 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      await handleImage(result.assets[0]?.uri);
    }
  };

  const selectFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("갤러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      await handleImage(result.assets[0]?.uri);
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
          <Text style={styles.headerTitle}>약 추가하기</Text>
          <Text style={styles.headerSubtitle}>약 봉투를 스캔하세요</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Camera color={COLORS.muted} size={70} strokeWidth={2.2} />
          <Text style={styles.frameText}>약 봉투를 프레임 안에 맞춰주세요</Text>
        </View>

        <Pressable
          disabled={isProcessing}
          onPress={takePhoto}
          style={[styles.cameraButton, isProcessing ? styles.disabledButton : null]}
        >
          <Camera color={COLORS.white} size={25} strokeWidth={2.4} />
          <Text style={styles.cameraButtonText}>
            {isProcessing ? "인식 중" : "사진 촬영하기"}
          </Text>
        </Pressable>

        <Pressable
          disabled={isProcessing}
          onPress={selectFromGallery}
          style={[styles.galleryButton, isProcessing ? styles.disabledButton : null]}
        >
          <Upload color={COLORS.text} size={27} strokeWidth={2.4} />
          <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {candidateText ? <Text style={styles.candidateText}>{candidateText}</Text> : null}

        <View style={styles.tipBox}>
          <View style={styles.tipHeader}>
            <Info color={COLORS.text} size={28} strokeWidth={2.4} />
            <Text style={styles.tipTitle}>촬영 팁</Text>
          </View>
          <Text style={styles.tipText}>• 밝은 곳에서 촬영하세요</Text>
          <Text style={styles.tipText}>• 약 이름이 선명하게 보이도록 하세요</Text>
        </View>
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
    paddingTop: 38,
    paddingBottom: 42,
  },
  scanFrame: {
    minHeight: 518,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#f1eee8",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 94,
    height: 94,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 44,
    left: 44,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 44,
    right: 44,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 44,
    left: 44,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    right: 44,
    bottom: 44,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderBottomRightRadius: 24,
  },
  frameText: {
    marginTop: 36,
    color: COLORS.muted,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  cameraButton: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 34,
    borderRadius: 18,
    backgroundColor: COLORS.coral,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  cameraButtonText: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },
  galleryButton: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  galleryButtonText: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 16,
    color: COLORS.coral,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  candidateText: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  tipBox: {
    marginTop: 34,
    padding: 26,
    borderWidth: 1.5,
    borderColor: "#d6f0ea",
    borderRadius: 20,
    backgroundColor: COLORS.mintPale,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  tipTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  tipText: {
    marginLeft: 42,
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 29,
  },
});
