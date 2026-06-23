import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, UrlTile, type MapPressEvent } from "react-native-maps";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

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

export default function OnboardingRetailorScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [tin, setTin] = useState("");
  const [pin, setPin] = useState<Coordinate | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Optional fields
  const [email, setEmail] = useState("");
  const [branchCount, setBranchCount] = useState("");
  const [preferredCategories, setPreferredCategories] = useState("");

  const missingRequired = useMemo(() => {
    return (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !gender ||
      !pin
    );
  }, [firstName, lastName, phone, gender, pin]);

  const handleMapPress = (event: MapPressEvent) => {
    setPin(event.nativeEvent.coordinate);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
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
      console.error("Location error:", error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: "/onboarding/otp" as any,
      params: {
        role: "retailer",
        firstName,
        lastName,
        phone,
        gender,
        tin,
        email,
        latitude: pin?.latitude,
        longitude: pin?.longitude,
        branchCount,
        preferredCategories,
      },
    });
  };

  return (
    <PageShell
      title="Retailer onboarding"
      subtitle="Tell us about your store"
      showBackButton
      style={styles.shell}
      footer={
        <Pressable
          style={[styles.continueButton, missingRequired && styles.buttonOff]}
          onPress={handleContinue}
          disabled={missingRequired}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Continue to verification
          </ThemedText>
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
      >
        <SectionTitle title="Required" />

        <FieldLabel label="First Name" required />
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Last Name" required />
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Phone Number" required />
        <View style={styles.phoneInputRow}>
          <ThemedText type="default" style={styles.phonePrefix}>+251</ThemedText>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={phone}
            onChangeText={setPhone}
            placeholder="9xx xxx xxx"
            placeholderTextColor="#8a8a8a"
            keyboardType="phone-pad"
          />
        </View>

        <FieldLabel label="Gender" required />
        <View style={styles.genderRow}>
          <Pressable
            style={[
              styles.genderButton,
              gender === "male" && styles.genderButtonActive,
            ]}
            onPress={() => setGender("male")}
          >
            <MaterialIcons
              name={gender === "male" ? "radio-button-checked" : "radio-button-unchecked"}
              size={20}
              color={gender === "male" ? "#0a2f4a" : "#6b6b6b"}
            />
            <ThemedText
              type="default"
              style={[
                styles.genderText,
                gender === "male" && styles.genderTextActive,
              ]}
            >
              Male
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.genderButton,
              gender === "female" && styles.genderButtonActive,
            ]}
            onPress={() => setGender("female")}
          >
            <MaterialIcons
              name={gender === "female" ? "radio-button-checked" : "radio-button-unchecked"}
              size={20}
              color={gender === "female" ? "#0a2f4a" : "#6b6b6b"}
            />
            <ThemedText
              type="default"
              style={[
                styles.genderText,
                gender === "female" && styles.genderTextActive,
              ]}
            >
              Female
            </ThemedText>
          </Pressable>
        </View>

        <FieldLabel label="Dropoff Location on Map" required />
        <ThemedText type="default" style={styles.mapHint}>
          Tap the map to place a pin at your store location
        </ThemedText>

        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <View style={styles.webFallback}>
              <MaterialIcons name="map" size={28} color="#8a1d1d" />
              <ThemedText type="default" style={styles.webFallbackText}>
                Map preview not available on web
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

        {pin ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
            <ThemedText type="default" style={styles.infoText}>
              Location selected: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </ThemedText>
          </View>
        ) : null}

        <SectionTitle title="Optional" />

        <FieldLabel label="TIN Number" />
        <TextInput
          style={styles.input}
          value={tin}
          onChangeText={setTin}
          placeholder="Enter TIN number"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Email" />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FieldLabel label="Number of Branches" />
        <TextInput
          style={styles.input}
          value={branchCount}
          onChangeText={setBranchCount}
          placeholder="e.g., 3"
          placeholderTextColor="#8a8a8a"
          keyboardType="number-pad"
        />

        <FieldLabel label="Preferred Product Categories" />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={preferredCategories}
          onChangeText={setPreferredCategories}
          placeholder="e.g., Groceries, Electronics, Household items"
          placeholderTextColor="#8a8a8a"
          multiline
        />
      </ScrollView>
    </PageShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
      {required ? (
        <ThemedText type="default" style={styles.requiredMark}>
          Required
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  form: { paddingBottom: 40 },
  sectionRow: { marginTop: 10, marginBottom: 8 },
  sectionTitle: { color: "#0a2f4a", fontSize: 18 },
  labelRow: {
    marginTop: 12,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: "#0a2f4a" },
  requiredMark: { color: "#8a1d1d", fontSize: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    color: "#0a2f4a",
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  phonePrefix: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  mapHint: {
    color: "#6b6b6b",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
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
    marginTop: 8,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  infoText: { marginLeft: 8, color: "#2e7d32", fontSize: 12, flex: 1 },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    borderColor: "#0a2f4a",
    borderWidth: 2,
    backgroundColor: "rgba(10, 47, 74, 0.05)",
  },
  genderText: {
    marginLeft: 8,
    color: "#6b6b6b",
  },
  genderTextActive: {
    color: "#0a2f4a",
    fontWeight: "600",
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonOff: { opacity: 0.55 },
  continueText: { color: "#fff" },
});
