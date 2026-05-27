import React, { useEffect, useRef } from 'react';
import { Place } from '../../types';
import L from 'leaflet';

interface LeafletMapProps {
  places: Place[];
  selectedPlace: Place | null;
  userLocation: { latitude: number; longitude: number } | null;
  onMarkerClick?: (place: Place) => void;
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMap({
  places,
  selectedPlace,
  userLocation,
  onMarkerClick,
  center = [-25.4372, -49.2700], // Centro de Curitiba por padrão
  zoom = 13
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar o mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Configura o mapa
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Tirar o zoom control padrão para estilizar customizado
      attributionControl: true
    }).setView(center, zoom);

    // Usar CartoDB Dark Matter para um design Dark premium e futurista (100% CUSTO ZERO)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Adicionar zoom control customizado no canto superior direito
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualizar marcadores dos locais
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpar marcadores antigos que não estão mais na lista
    Object.keys(markersRef.current).forEach((id) => {
      if (!places.find(p => p.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Adicionar ou atualizar marcadores dos locais
    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      
      // Ícone customizado baseado na categoria/seleção
      const iconHtml = `
        <div class="place-marker-custom" style="
          background-color: ${isSelected ? '#ff5422' : '#7e5fd6'};
          transform: ${isSelected ? 'scale(1.2) translateY(-4px)' : 'scale(1)'};
          z-index: ${isSelected ? 9999 : 100};
        ">
          <span style="font-size: 11px; font-weight: 800;">B!</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (markersRef.current[place.id]) {
        // Atualizar existente
        markersRef.current[place.id].setLatLng([place.latitude, place.longitude]);
        markersRef.current[place.id].setIcon(customIcon);
      } else {
        // Criar novo
        const marker = L.marker([place.latitude, place.longitude], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            if (onMarkerClick) onMarkerClick(place);
          });
        markersRef.current[place.id] = marker;
      }
    });
  }, [places, selectedPlace, onMarkerClick]);

  // Atualizar marcador de localização do usuário
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const userLatLng: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];

    const userIcon = L.divIcon({
      html: '<div class="user-location-marker"></div>',
      className: 'user-marker-container',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLatLng);
    } else {
      userMarkerRef.current = L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    }
  }, [userLocation]);

  // Centralizar no local selecionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPlace) {
      map.setView([selectedPlace.latitude, selectedPlace.longitude], 15, {
        animate: true,
        duration: 1
      });
    }
  }, [selectedPlace]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-premium border border-white/5 bg-brand-indigo-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Indicador de carregamento ou mapa offline */}
      <div className="absolute bottom-3 left-3 z-[400] glass-card px-3 py-1 rounded-full text-[10px] text-slate-400 font-medium border border-white/5">
        Offline Map Tile Server
      </div>
    </div>
  );
}
