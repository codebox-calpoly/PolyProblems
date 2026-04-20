import React, { useEffect, useRef } from "react";
import type L_Type from "leaflet";
import { LocationCoords } from "./LocationTagging.web";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationProps {
  value: LocationData | null;
}

// Leaflet requires its CSS for correct tile/marker rendering.
const LEAFLET_CSS_ID = "leaflet-css";
function injectLeafletCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

function LeafletMap({ latitude, longitude }: LocationCoords) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L_Type.Map | null>(null);
  const LRef = useRef<typeof L_Type | null>(null);

  useEffect(() => {
    injectLeafletCSS();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      // Dynamically import leaflet only in the browser
      if (!LRef.current) {
        const leaflet = await import("leaflet");
        LRef.current = leaflet.default ?? leaflet;
      }
      const L = LRef.current;
      if (cancelled || !containerRef.current) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 16,
          minZoom: 14,
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: true,
          doubleClickZoom: false,
          touchZoom: true,
          keyboard: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        L.marker([latitude, longitude], { icon }).addTo(map);

        mapRef.current = map;
      } else {
        mapRef.current.setView([latitude, longitude], 16);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

const LocationPreview: React.FC<LocationProps> = ({ value }) => {
  // Guard clause: If value is null, render nothing
  if (!value) return null;

  return <LeafletMap latitude={value.latitude} longitude={value.longitude} />;
};

export default LocationPreview;
