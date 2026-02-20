import { Modal } from "../ui/Modal";
import type { Coordinates } from "../../types/weather";

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates | null;
}

export function RadarModal({ isOpen, onClose, coordinates }: RadarModalProps) {
  const lat = coordinates?.latitude;
  const lon = coordinates?.longitude;

  const radarUrl =
    lat !== undefined && lon !== undefined
      ? `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&oFa=0&oC=0&oU=0&oCS=1&oF=0&oAP=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1`
      : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Weather Radar">
      <div className="space-y-3">
        {radarUrl ? (
          <>
            <p className="text-sm text-gray-600">
              Interactive radar centered on your current location.
            </p>
            <div className="w-full h-[65vh] min-h-[420px] rounded-md overflow-hidden border border-gray-200 bg-gray-100">
              <iframe
                src={radarUrl}
                title="Weather Radar"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Radar is available after your location coordinates are loaded.
          </p>
        )}
      </div>
    </Modal>
  );
}
