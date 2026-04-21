import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationProps {
  value: LocationData | null;
}

const LocationPreview: React.FC<LocationProps> = ({ value }) => {
  // Guard clause: If value is null, render nothing
  if (!value) return null;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: value.latitude,
        longitude: value.longitude,
        latitudeDelta: 0.0005,
        longitudeDelta: 0.0005,
      }}
      //Only Zoom and Move for preview mode
      scrollEnabled={true}
      zoomEnabled={true}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <Marker coordinate={value} />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

export default LocationPreview;
