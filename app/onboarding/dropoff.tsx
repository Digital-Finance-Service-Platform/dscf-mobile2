import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, UrlTile, type MapPressEvent } from "react-native-maps";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

type RoleKey = "retailor" | "customer";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_REGION = {
  latitude: 9.0054,
  longitude: 38.7636,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function OnboardingDropoffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const role: RoleKey = roleParam === "retailor" ? "retailor" : "customer";

  const mapRef = useRef<MapView>(null);
  const [pin, setPin] = useState<Coordinate | null>(null);
  const [label, setLabel] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const roleTitle = useMemo(
    () => (role === "retailor" ? "Retailor" : "Customer"),
    [role]
  );

  const handleMapPress = (event: MapPressEvent) => {
    setPin(event.nativeEvent.coordinate);
  };

  const handleUseCurrentLocation = async () => {
    setLocationError(null);
    setIsLocating(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Location permission denied. You can still place a pin manually."
        );
        setHasLocationPermission(false);
        return;
      }

      setHasLocationPermission(true);
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coordinate = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setPin(coordinate);
      mapRef.current?.animateToRegion(
        {
          ...coordinate,
          latitudeDelta: DEFAULT_REGION.latitudeDelta,
          longitudeDelta: DEFAULT_REGION.longitudeDelta,
        },
        600
      );
    } catch (error) {
      setLocationError("Unable to fetch current location. Try again.");
    } finally {
      setIsLocating(false);
    }
  };

  const pinLabel = useMemo(() => {
    if (!pin) {
      return "Tap the map to drop a pin.";
    }

    return `Pinned at ${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`;
  }, [pin]);

  return (
    <PageShell
      title="Dropoff location"
      subtitle={`${roleTitle} onboarding`}
      showBackButton
      style={styles.shell}
      footer={
        <Pressable
          style={styles.continueButton}
          onPress={() =>
            router.push({
              pathname: "/signup",
              params: { role },
            })
          }
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Continue to sign up
          </ThemedText>
        </Pressable>
      }
    >
      <View style={styles.mapHeader}>
        <MaterialIcons name="location-on" size={20} color="#8a1d1d" />
        <ThemedText type="defaultSemiBold" style={styles.mapTitle}>
          Choose a dropoff point
        </ThemedText>
      </View>

      <ThemedText type="default" style={styles.mapHint}>
        Tap the map to place a pin for your dropoff location.
      </ThemedText>

      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.webFallback}>
            <MaterialIcons name="map" size={28} color="#8a1d1d" />
            <ThemedText type="default" style={styles.webFallbackText}>
              Map preview is not available on web.
            </ThemedText>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            onPress={handleMapPress}
            showsUserLocation={hasLocationPermission}
            mapType="none"
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {pin ? (
              <Marker coordinate={pin} />
            ) : (
              <Marker coordinate={DEFAULT_REGION} opacity={0.4} />
            )}
          </MapView>
        )}
      </View>

      <Pressable
        style={[styles.locationButton, isLocating && styles.buttonDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator color="#0a2f4a" />
        ) : (
          <MaterialIcons name="my-location" size={18} color="#0a2f4a" />
        )}
        <ThemedText type="default" style={styles.locationButtonText}>
          Use current location
        </ThemedText>
      </Pressable>

      {locationError ? (
        <ThemedText type="default" style={styles.locationError}>
          {locationError}
        </ThemedText>
      ) : null}

      <View style={styles.infoRow}>
        <MaterialIcons name="info-outline" size={18} color="#6b6b6b" />
        <ThemedText type="default" style={styles.infoText}>
          {pinLabel}
        </ThemedText>
      </View>

      <View style={styles.labelBlock}>
        <ThemedText type="default" style={styles.labelTitle}>
          Dropoff label (optional)
        </ThemedText>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Main store gate"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
        />
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  mapTitle: { marginLeft: 8, color: "#0a2f4a" },
  mapHint: { color: "#55656d", marginBottom: 12 },
  mapContainer: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
    backgroundColor: "#e5ebe7",
  },
  map: { flex: 1 },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webFallbackText: { color: "#55656d" },
  locationButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
  },
  buttonDisabled: { opacity: 0.6 },
  locationButtonText: { marginLeft: 8, color: "#0a2f4a" },
  locationError: { marginTop: 8, color: "#8a1d1d" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  infoText: { marginLeft: 8, color: "#6b6b6b" },
  labelBlock: { marginTop: 18 },
  labelTitle: { color: "#0a2f4a", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    color: "#0a2f4a",
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  continueText: { color: "#fff" },
});
