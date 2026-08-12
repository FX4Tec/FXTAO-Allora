import React from 'react';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet marker icons logic
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map bounds and auto-zoom
const MapBounds = ({ markers }) => {
  const map = useMap();

  React.useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);

  return null;
};

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function Heatmap() {
  const { data: taos, isLoading } = useQuery({
    queryKey: ['taos-map'],
    queryFn: async () => {
      // Fetch with high limit to ensure all markers are shown
      const res = await api.get('/taos', {
        params: { limit: 1000 }
      });
      // Handle both direct array and paginated response
      const data = res.data;
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      return Array.isArray(data) ? data : [];
    },
  });

  const taosWithLocation = (taos || [])
    .map((tao) => ({
      ...tao,
      latitude: parseCoordinate(tao.latitude),
      longitude: parseCoordinate(tao.longitude),
    }))
    .filter((tao) => tao.latitude !== null && tao.longitude !== null);
  const defaultCenter = [-23.5505, -46.6333]; // São Paulo

  const getMarkerIcon = (tao) => {
    // Green if Finished (Status 5) or Approved
    if (tao.status === '5' || tao.approval_status === 'approved') {
      return greenIcon;
    }
    // Blue for everything else (Incomplete)
    return blueIcon;
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mapa de Obras</h1>
          <p className="text-slate-500 mt-1">Geolocalização dos empreendimentos ativos</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm flex flex-col items-end">
          <div><span className="font-bold text-indigo-600">{taosWithLocation.length}</span> obras no mapa</div>
          <div className="text-xs text-slate-400">de {taos?.length || 0} total</div>
        </div>
      </div>

      <Card className="flex-1 border-slate-200 shadow-sm overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={false} // Disable default to add custom placed one
          >
            <ZoomControl position="topleft" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBounds markers={taosWithLocation} />

            {taosWithLocation.map((tao) => (
              <Marker
                key={tao.id}
                position={[tao.latitude, tao.longitude]}
                icon={getMarkerIcon(tao)}
              >
                <Popup className="min-w-[200px]">
                  <div className="p-1">
                    <h3 className="font-bold text-indigo-700 text-sm mb-1">{tao.project_name}</h3>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tao.construction_neighborhood}</p>
                      <p className="font-medium">{tao.segment} • {tao.project_type}</p>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white
                            ${(tao.status === '5' || tao.approval_status === 'approved') ? 'bg-green-600' : 'bg-blue-600'}
                        `}>
                          {tao.approval_status === 'approved' ? 'APROVADO' : `ETAPA ${tao.status}`}
                        </span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${tao.latitude},${tao.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Navigation className="w-3 h-3" /> Ir
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {!taosWithLocation.length && (
              <div className="absolute inset-x-4 bottom-4 z-[400] rounded-lg border bg-white/95 p-4 text-sm text-slate-600 shadow">
                Nenhuma obra com latitude e longitude cadastradas para exibir no mapa deste cliente.
              </div>
            )}
          </MapContainer>
        )}
      </Card>
    </div>
  );
}
