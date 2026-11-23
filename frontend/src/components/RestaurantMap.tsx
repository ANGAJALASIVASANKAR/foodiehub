import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const redIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Props {
  restaurant: { name: string; latitude?: number | null; longitude?: number | null };
  destination: { lat: number; lng: number; label: string } | null;
  progressPercent?: number;
}

function interpolate(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export default function RestaurantMap({ restaurant, destination, progressPercent = 0 }: Props) {
  const origin =
    restaurant.latitude != null && restaurant.longitude != null
      ? { lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) }
      : { lat: 12.9716, lng: 77.5946 };

  const dest = destination ?? { lat: origin.lat + 0.02, lng: origin.lng + 0.02, label: 'Delivery location' };
  const t = Math.min(1, Math.max(0, progressPercent / 100));
  const courier = interpolate(origin, { lat: dest.lat, lng: dest.lng }, t);

  const center: [number, number] = [
    (origin.lat + dest.lat) / 2,
    (origin.lng + dest.lng) / 2,
  ];

  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[origin.lat, origin.lng]} icon={redIcon}>
          <Popup>{restaurant.name}</Popup>
        </Marker>
        <Marker position={[dest.lat, dest.lng]} icon={redIcon}>
          <Popup>{dest.label}</Popup>
        </Marker>
        <Polyline
          positions={[
            [origin.lat, origin.lng],
            [dest.lat, dest.lng],
          ]}
          pathOptions={{ color: '#e23744', weight: 4, opacity: 0.7, dashArray: '8 10' }}
        />
        {progressPercent > 0 && progressPercent < 100 && (
          <Marker position={[courier.lat, courier.lng]} icon={redIcon}>
            <Popup>Courier (simulated position)</Popup>
          </Marker>
        )}
      </MapContainer>
      <p className="map-note">Simulated delivery path — not live GPS tracking.</p>
    </div>
  );
}
