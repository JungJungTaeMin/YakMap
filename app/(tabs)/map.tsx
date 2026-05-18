import {
  Clock,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#f8f6f2",
  coral: "#ff8178",
  coralPale: "#fff0ee",
  mint: "#9adbd2",
  mintPale: "#eaf8f5",
  beige: "#efebe6",
  text: "#2d2521",
  muted: "#8e847c",
  border: "#e7e1dc",
  white: "#ffffff",
  blue: "#4388f0",
  yellow: "#f8b800",
};

type Filter = "전체" | "약국" | "편의점";

const filters: Filter[] = ["전체", "약국", "편의점"];

const stores = [
  {
    id: 1,
    category: "약국",
    name: "온누리약국",
    rating: "4.8",
    address: "서울시 강남구 테헤란로 123",
    hours: "09:00 - 19:00",
    phone: "02-1234-5678",
    distance: "120m",
    markerColor: COLORS.coral,
  },
  {
    id: 2,
    category: "편의점",
    name: "세븐일레븐 강남점",
    rating: "4.5",
    address: "서울시 강남구 테헤란로 456",
    hours: "24시간",
    phone: "02-2345-6789",
    distance: "250m",
    markerColor: COLORS.mint,
  },
];

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<Filter>("전체");

  const visibleStores = useMemo(
    () =>
      selectedFilter === "전체"
        ? stores
        : stores.filter((store) => store.category === selectedFilter),
    [selectedFilter],
  );

  const openDirections = (storeName: string) => {
    Linking.openURL(`https://map.kakao.com/link/search/${encodeURIComponent(storeName)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>주변 구매처</Text>
        <Text style={styles.subtitle}>가까운 약국과 편의점을 찾아보세요</Text>

        <View style={styles.mapBox}>
          <View style={[styles.marker, styles.markerPrimary]}>
            <MapPin color={COLORS.white} fill={COLORS.white} size={35} strokeWidth={1.8} />
          </View>
          <View style={styles.currentLocation}>
            <View style={styles.currentLocationInner} />
          </View>
          <View style={[styles.marker, styles.markerSecondary]}>
            <MapPin color={COLORS.white} fill={COLORS.white} size={29} strokeWidth={1.8} />
          </View>
          <View style={[styles.marker, styles.markerSoft]}>
            <MapPin color={COLORS.white} fill={COLORS.white} size={27} strokeWidth={1.8} />
          </View>

          <Pressable accessibilityLabel="현재 위치로 이동" style={styles.locateButton}>
            <Navigation color={COLORS.text} size={34} strokeWidth={2.3} />
          </Pressable>
        </View>

        <View style={styles.filterBar}>
          {filters.map((filter) => {
            const selected = selectedFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterButton, selected ? styles.filterButtonActive : null]}
              >
                <Text style={[styles.filterText, selected ? styles.filterTextActive : null]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.storeList}>
          {visibleStores.map((store) => (
            <View key={store.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <View style={styles.storeNameRow}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>영업중</Text>
                  </View>
                </View>
                <Text style={styles.distance}>{store.distance}</Text>
              </View>

              <View style={styles.ratingRow}>
                <Star
                  color={COLORS.yellow}
                  fill={COLORS.yellow}
                  size={22}
                  strokeWidth={2.2}
                />
                <Text style={styles.rating}>{store.rating}</Text>
              </View>

              <Text style={styles.address}>{store.address}</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Clock color={COLORS.muted} size={22} strokeWidth={2.2} />
                  <Text style={styles.infoText}>{store.hours}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Phone color={COLORS.muted} size={22} strokeWidth={2.2} />
                  <Text style={styles.infoText}>{store.phone}</Text>
                </View>
              </View>

              <Pressable onPress={() => openDirections(store.name)} style={styles.routeButton}>
                <Text style={styles.routeButtonText}>길찾기</Text>
              </Pressable>
            </View>
          ))}
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 34,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 22,
    color: COLORS.muted,
    fontSize: 23,
    fontWeight: "600",
  },
  mapBox: {
    minHeight: 260,
    overflow: "hidden",
    marginTop: 34,
    borderRadius: 28,
    backgroundColor: COLORS.mintPale,
  },
  marker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  markerPrimary: {
    top: 90,
    left: 230,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.coral,
  },
  markerSecondary: {
    top: 132,
    right: 150,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.mint,
  },
  markerSoft: {
    top: 170,
    left: 328,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ffc9c4",
  },
  currentLocation: {
    position: "absolute",
    top: 148,
    left: "50%",
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -22,
    borderRadius: 23,
    backgroundColor: "rgba(67,136,240,0.12)",
  },
  currentLocationInner: {
    width: 21,
    height: 21,
    borderWidth: 4,
    borderColor: COLORS.white,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
  },
  locateButton: {
    position: "absolute",
    right: 30,
    bottom: 30,
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: COLORS.white,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  filterBar: {
    flexDirection: "row",
    gap: 0,
    marginTop: 34,
    padding: 10,
    borderRadius: 22,
    backgroundColor: COLORS.beige,
  },
  filterButton: {
    flex: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#3b302a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 4,
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 23,
    fontWeight: "800",
  },
  filterTextActive: {
    color: COLORS.text,
  },
  storeList: {
    gap: 20,
    marginTop: 34,
  },
  storeCard: {
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  storeNameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  storeName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  openBadge: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: COLORS.mintPale,
  },
  openBadgeText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  distance: {
    color: COLORS.coral,
    fontSize: 20,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 22,
  },
  rating: {
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "800",
  },
  address: {
    marginTop: 22,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 29,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    marginTop: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "700",
  },
  routeButton: {
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 24,
    backgroundColor: COLORS.coralPale,
  },
  routeButtonText: {
    color: COLORS.coral,
    fontSize: 23,
    fontWeight: "800",
  },
});
