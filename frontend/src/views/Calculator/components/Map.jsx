import {
  MapContainer,
  Polygon,
  TileLayer,
  WMSTileLayer,
  Marker,
} from "react-leaflet";
import L from "leaflet";
import { useMap, useMapEvents } from "react-leaflet/hooks";
import styles from "./Map.module.scss";
import { transformCoordinates } from "../../../utils/Utils";
import { useDispatch, useSelector } from "react-redux";
import {
  closeInfoModal,
  clearParcelData,
  getParcelByCoordinates,
  selectInfoModal,
  selectParcelData,
  selectParcelLoading,
  selectMapPositionCenter,
  selectParcelSelected,
  selectEditorData,
  addNewMarker,
  selectCurrentlySelectedLayerIndex,
  selectZoomToCoords,
} from "../../../redux/slices/calcSlice";
import Modal from "../../../components/Modal/Modal";
import LoadingButton from "@mui/lab/LoadingButton";
import Loading from "../../../components/Loading/Loading";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import { emmitError } from "../../../utils/ToastEmmiter";
import PushPinIcon from "@mui/icons-material/PushPin";
import marker_icon from "../../../assets/marker_icon.png";
import Searchbar from "./Searchbar";

function Map(props) {
  const mapPositionCenter = useSelector(selectMapPositionCenter);
  const editorData = useSelector(selectEditorData);
  const parcelLoading = useSelector(selectParcelLoading);
  const parcelSelected = useSelector(selectParcelData);
  const currentSelectionIndex = useSelector(selectCurrentlySelectedLayerIndex)
  const mapRef = useRef(null);
  const zoomToCoords = useSelector(selectZoomToCoords)

  console.log(process.env);
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(mapPositionCenter, 12);
      console.log("set view")
    }
  }, [mapPositionCenter]);

  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');

    if (currentSelectionIndex!=-1 && mapContainer) {
      mapContainer.style.cursor = "crosshair";
    } 
    else {
      mapContainer.style.cursor = "grab";
    }
  }, [currentSelectionIndex]);

  useEffect(() => {
    if (zoomToCoords && mapRef.current) {
      mapRef.current.setView(zoomToCoords, 20);
    }
  }, [zoomToCoords]);



  useEffect(() => {
    if (!parcelSelected && mapRef.current) {
      mapRef.current.setMaxBounds(null);
    }
  }, [parcelSelected]);

  
  return (
    <div className={styles.mapContainer}>
      <MapContainer
        ref={mapRef}
        className={styles.map}
        center={mapPositionCenter}
        zoom={15}
        maxZoom={22}
        minZoom={10}
        scrollWheelZoom={false}
      >
        <MapComponent mapRef={mapRef} />
      </MapContainer>

      {parcelLoading && <Loading />}
    </div>
  );
}

function MapComponent(props) {
  const dispatch = useDispatch();
  const parcelSelected = useSelector(selectParcelSelected);
  const editorData = useSelector(selectEditorData);
  const mapRef = props.mapRef;
  const currentSelectionIndex = useSelector(selectCurrentlySelectedLayerIndex);

  const customIcon = L.icon({
    iconUrl: marker_icon,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const handleKeepInBounds = () => {
    if (
      parcelSelected &&
      editorData &&
      editorData.max_bounds &&
      mapRef.current
    ) {
      const currentCenter = mapRef.current.getCenter();
      const newCenter = mapRef.current.getCenter();
      const [minX, minY, maxX, maxY] = editorData.max_bounds;

      if (currentCenter.lng < minX) {
        newCenter.lng = minX;
      } else if (currentCenter.lng > maxX) {
        newCenter.lng = maxX;
      }

      if (currentCenter.lat < minY) {
        newCenter.lat = minY;
      } else if (currentCenter.lat > maxY) {
        newCenter.lat = maxY;
      }

      console.log(currentCenter, newCenter);

      if (!currentCenter.equals(newCenter)) {
        mapRef.current.panTo(newCenter);
      }
    }
  };

  function inside(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

  const debouncedKeepInBounds = debounce(handleKeepInBounds, 75);

  const mapEvents = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      console.log(e.latlng);
      if (!parcelSelected) dispatch(getParcelByCoordinates({ x: lat, y: lng }));
      if(currentSelectionIndex != -1) {
        if (inside([lat,lng], editorData.coords)){
          dispatch(addNewMarker([lat, lng]))
        }else{
          emmitError('Wybrane punkt nie jest w obszarze działki')
        }
      }
    },
    drag: () => {
      debouncedKeepInBounds();
      
    },
  });

  const map = useMap();

  const tms_options = {
    url: "https://mapy.geoportal.gov.pl/wss/ext/OSM/BaseMap/tms/1.0.0/osm_3857/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png",
    tms: true,
    zoomOffset: -1,
    maxZoom: 18,
  };

  const wms_options = {
    layers: "dzialki,numery_dzialek",
    minZoom: 12,
    maxZoom: 22,
    format: "image/png",
    transparent: true,
    url: "https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow",
  };

  const token = process.env.REACT_APP_MAPBOX_TOKEN;

  const satelite_options = {
    layers: "Raster",
    minZoom: 18,
    maxZoom: 22,
    format: "image/png",
    transparent: false,
    url: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution",
  };

  return (
    <>
      <WMSTileLayer {...satelite_options} />
      <TileLayer {...tms_options} />
      <WMSTileLayer {...wms_options} />
      {parcelSelected && editorData && editorData.coords.length > 0 && (
        <Polygon positions={editorData.coords} color="red" fill={false} />
      )}

      {currentSelectionIndex != -1 &&
        editorData.layers[currentSelectionIndex].polygon.map(
          (coords, index) => {
            return <Marker icon={customIcon} position={coords} />;
          }
        )}

      {Object.keys(editorData).length > 0 &&
        editorData.layers.map((layer, index) => {
          return <Polygon positions={layer.polygon} color={layer.color} />;
        })}
    </>
  );
}

export default Map;
