import { router } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
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
  frequentMedicines,
  listCachedMedicines,
  medicineToParams,
  mergeMedicines,
  saveMedicinesToCache,
  saveMedicineToCache,
  searchExternalMedicines,
  searchMedicineCache,
  Medicine,
} from "../../../src/features/medicine/medicineCatalog";
import { getResponsiveLayout } from "../../../src/styles/responsive";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralPale: "#fff0ee",
  mintPale: "#eaf8f5",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
};

export default function SearchMedicineScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [query, setQuery] = useState("");
  const [cachedMedicines, setCachedMedicines] = useState<Medicine[]>([]);
  const [apiMedicines, setApiMedicines] = useState<Medicine[]>([]);
  const [apiQuery, setApiQuery] = useState("");
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  useEffect(() => {
    listCachedMedicines()
      .then(setCachedMedicines)
      .catch(() => setCachedMedicines([]));
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const cachedMatches = searchMedicineCache(normalizedQuery, cachedMedicines);

    if (!normalizedQuery) {
      setApiMedicines([]);
      setApiQuery("");
      setIsSearchingApi(false);
      return undefined;
    }

    if (cachedMatches.length > 0) {
      setApiQuery("");
      setIsSearchingApi(false);
      return undefined;
    }

    setApiMedicines([]);
    setApiQuery(normalizedQuery);
    setIsSearchingApi(true);
    let isCurrentSearch = true;

    const timeoutId = setTimeout(() => {
      searchExternalMedicines(normalizedQuery)
        .then(async (medicines) => {
          if (!isCurrentSearch) {
            return;
          }

          setApiMedicines(medicines);

          if (medicines.length > 0) {
            const nextCachedMedicines = await saveMedicinesToCache(medicines);
            if (!isCurrentSearch) {
              return;
            }

            setCachedMedicines(nextCachedMedicines);
          }
        })
        .catch(() => {
          if (isCurrentSearch) {
            setApiMedicines([]);
          }
        })
        .finally(() => {
          if (isCurrentSearch) {
            setIsSearchingApi(false);
          }
        });
    }, 350);

    return () => {
      isCurrentSearch = false;
      clearTimeout(timeoutId);
    };
  }, [cachedMedicines, query]);

  const filteredMedicines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const cachedMatches = searchMedicineCache(query, cachedMedicines);
    const activeApiMedicines = apiQuery === query.trim() ? apiMedicines : [];

    if (!normalizedQuery) {
      return mergeMedicines(cachedMatches, frequentMedicines);
    }

    const catalogMatches = frequentMedicines.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(normalizedQuery) ||
        medicine.maker.toLowerCase().includes(normalizedQuery),
    );

    return mergeMedicines(cachedMatches, activeApiMedicines, catalogMatches);
  }, [apiMedicines, apiQuery, cachedMedicines, query]);

  const selectMedicine = async (medicine: Medicine) => {
    const nextCachedMedicines = await saveMedicineToCache(medicine);
    setCachedMedicines(nextCachedMedicines);
    router.push({
      pathname: "/medicine/add/schedule",
      params: medicineToParams(medicine),
    });
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
          <Text style={styles.headerSubtitle}>약을 검색하세요</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, layout.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Search color={COLORS.muted} size={30} strokeWidth={2.3} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setQuery}
            placeholder="약 이름을 검색하세요"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <Text style={styles.sectionLabel}>자주 찾는 약</Text>

        <View style={styles.list}>
          {filteredMedicines.map((medicine) => {
            const isPrescription = medicine.category === "전문약";

            return (
              <Pressable
                key={medicine.id}
                onPress={() => selectMedicine(medicine)}
                style={styles.card}
              >
                  <View style={styles.medicineTextBox}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.maker}>{medicine.maker}</Text>
                  </View>

                  <View
                    style={[
                      styles.categoryBadge,
                      isPrescription ? styles.prescriptionBadge : null,
                    ]}
                  >
                    <Text style={styles.categoryText}>{medicine.category}</Text>
                  </View>
              </Pressable>
            );
          })}
          {isSearchingApi ? (
            <Text style={styles.emptyText}>의약품 정보를 조회 중입니다</Text>
          ) : null}
          {!isSearchingApi && filteredMedicines.length === 0 ? (
            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          ) : null}
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
  searchBox: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "600",
  },
  sectionLabel: {
    marginTop: 42,
    marginBottom: 22,
    color: COLORS.muted,
    fontSize: 21,
    fontWeight: "700",
  },
  list: {
    gap: 14,
  },
  card: {
    minHeight: 118,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.white,
  },
  medicineTextBox: {
    flex: 1,
  },
  medicineName: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },
  maker: {
    marginTop: 18,
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "700",
  },
  categoryBadge: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: COLORS.mintPale,
  },
  prescriptionBadge: {
    backgroundColor: COLORS.mintPale,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 30,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});
