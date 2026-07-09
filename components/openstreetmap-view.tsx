import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type OpenStreetMapViewProps = {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  onPress?: (coordinate: Coordinate) => void;
  marker?: Coordinate | null;
  style?: any;
  showsUserLocation?: boolean;
  userLocation?: Coordinate | null;
};

export function OpenStreetMapView({
  initialRegion,
  onPress,
  marker,
  style,
  showsUserLocation,
  userLocation,
}: OpenStreetMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // Generate HTML with Leaflet.js for OpenStreetMap
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialize map
        const map = L.map('map', {
          center: [${initialRegion.latitude}, ${initialRegion.longitude}],
          zoom: 13,
          zoomControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          // Proper User-Agent is set via tile request headers
        }).addTo(map);

        // Marker variable
        let marker = null;
        let userMarker = null;

        // Handle map click
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          
          // Remove old marker if exists
          if (marker) {
            map.removeLayer(marker);
          }
          
          // Add new marker
          marker = L.marker([lat, lng]).addTo(map);
          
          // Send coordinates back to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            latitude: lat,
            longitude: lng
          }));
        });

        // Function to update marker from React Native
        window.updateMarker = function(lat, lng) {
          if (marker) {
            map.removeLayer(marker);
          }
          if (lat && lng) {
            marker = L.marker([lat, lng]).addTo(map);
          }
        };

        // Function to update user location marker
        window.updateUserLocation = function(lat, lng) {
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          if (lat && lng) {
            const blueIcon = L.divIcon({
              className: 'user-location-marker',
              html: '<div style="background: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            userMarker = L.marker([lat, lng], { icon: blueIcon }).addTo(map);
          }
        };

        // Function to animate to region
        window.animateToRegion = function(lat, lng, zoom = 15) {
          map.flyTo([lat, lng], zoom, {
            duration: 0.6
          });
        };

        // Notify that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapReady'
        }));
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === "mapReady") {
        setLoading(false);
        // Update marker if exists
        if (marker) {
          updateMarker(marker.latitude, marker.longitude);
        }
        // Update user location if exists
        if (showsUserLocation && userLocation) {
          updateUserLocation(userLocation.latitude, userLocation.longitude);
        }
      } else if (data.type === "mapPress" && onPress) {
        onPress({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error("Error parsing map message:", error);
    }
  };

  const updateMarker = (latitude: number, longitude: number) => {
    webViewRef.current?.injectJavaScript(`
      window.updateMarker(${latitude}, ${longitude});
      true;
    `);
  };

  const updateUserLocation = (latitude: number, longitude: number) => {
    webViewRef.current?.injectJavaScript(`
      window.updateUserLocation(${latitude}, ${longitude});
      true;
    `);
  };

  const animateToRegion = (latitude: number, longitude: number) => {
    webViewRef.current?.injectJavaScript(`
      window.animateToRegion(${latitude}, ${longitude});
      true;
    `);
  };

  // Update marker when prop changes
  useEffect(() => {
    if (marker && !loading) {
      updateMarker(marker.latitude, marker.longitude);
    }
  }, [marker, loading]);

  // Update user location when prop changes
  useEffect(() => {
    if (showsUserLocation && userLocation && !loading) {
      updateUserLocation(userLocation.latitude, userLocation.longitude);
      animateToRegion(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, loading, showsUserLocation]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, style]}>
        <View style={styles.webFallbackContent}>
          <span style={{ fontSize: 28 }}>🗺️</span>
          <p style={{ color: "#55656d", margin: 0 }}>
            Map preview not available on web
          </p>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "#e5ebe7",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e5ebe7",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  webFallback: {
    flex: 1,
    backgroundColor: "#e5ebe7",
    justifyContent: "center",
    alignItems: "center",
  },
  webFallbackContent: {
    alignItems: "center",
    gap: 8,
  },
});
