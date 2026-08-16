import { useState } from 'react';
import { getServiceTypeLabel } from '../constants/serviceTypes';

const SERVICE_DETAILS = {
  TYRE_CHANGE: {
    description: 'Quick tyre replacement and puncture repair for safe driving.',
    phone: '+1 (415) 555-0148',
  },
  OIL_CHANGE: {
    description: 'Engine oil replacement to keep your vehicle running smoothly.',
    phone: '+1 (415) 555-0132',
  },
  CAR_WASH: {
    description: 'Exterior wash, detailing, and interior refresh service.',
    phone: '+1 (415) 555-0120',
  },
  TOW_SERVICE: {
    description: 'Reliable roadside towing and vehicle recovery assistance.',
    phone: '+1 (415) 555-0199',
  },
  BATTERY_REPLACEMENT: {
    description: 'Battery diagnostics and replacement for power issues.',
    phone: '+1 (415) 555-0177',
  },
  BRAKE_SERVICE: {
    description: 'Brake inspection, pad replacement, and safe stopping checks.',
    phone: '+1 (415) 555-0142',
  },
  ENGINE_DIAGNOSTICS: {
    description: 'Advanced engine checks to find faults and performance issues.',
    phone: '+1 (415) 555-0165',
  },
  AC_SERVICE: {
    description: 'Air-conditioning inspection and cooling system repair.',
    phone: '+1 (415) 555-0109',
  },
  CAR_DETAILING: {
    description: 'Interior and exterior detailing for a premium finish.',
    phone: '+1 (415) 555-0114',
  },
  WHEEL_ALIGNMENT: {
    description: 'Wheel alignment adjustments for better handling and tire life.',
    phone: '+1 (415) 555-0136',
  },
  WHEEL_BALANCING: {
    description: 'Precision balancing for a smoother ride and reduced vibration.',
    phone: '+1 (415) 555-0158',
  },
  WINDSHIELD_REPAIR: {
    description: 'Windshield crack repair and visibility restoration.',
    phone: '+1 (415) 555-0182',
  },
  GLASS_REPLACEMENT: {
    description: 'Glass replacement for windshields and side windows.',
    phone: '+1 (415) 555-0188',
  },
  ENGINE_REPAIR: {
    description: 'Mechanical repair for engine performance and reliability issues.',
    phone: '+1 (415) 555-0192',
  },
  TRANSMISSION_SERVICE: {
    description: 'Transmission maintenance and repair for smoother driving.',
    phone: '+1 (415) 555-0143',
  },
  SUSPENSION_REPAIR: {
    description: 'Suspension checks and repairs for ride comfort and control.',
    phone: '+1 (415) 555-0171',
  },
  CAR_ELECTRICAL: {
    description: 'Electrical diagnostics and repairs for the vehicle system.',
    phone: '+1 (415) 555-0161',
  },
  INSPECTION_SERVICE: {
    description: 'Vehicle inspection and safety checks before road use.',
    phone: '+1 (415) 555-0151',
  },
  CAR_POLISHING: {
    description: 'Paint enhancement and polish treatment for a clean finish.',
    phone: '+1 (415) 555-0128',
  },
  FUEL_DELIVERY: {
    description: 'Emergency fuel delivery to get you moving again fast.',
    phone: '+1 (415) 555-0104',
  },
};

function ServiceCard({ service }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!service) {
    return null;
  }

  const detail = SERVICE_DETAILS[service.service_type] || {
    description: 'Professional vehicle service for your maintenance and repair needs.',
    phone: '+1 (415) 555-0000',
  };

  const phoneValue = service.phone || detail.phone;

  return (
    <>
      <article className="service-card" tabIndex={0} onClick={() => setIsOpen(true)} onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsOpen(true);
        }
      }}>
        <div className="service-card__header">
          <h3>{service.service_name}</h3>
          <span className={`status ${service.availability ? 'available' : 'unavailable'}`}>
            {service.availability ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <p>
          <strong>Type:</strong> {getServiceTypeLabel(service.service_type)}
        </p>
      </article>

      {isOpen && (
        <div className="service-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="service-modal" onClick={(event) => event.stopPropagation()}>
            <div className="service-modal__header">
              <h2>{service.service_name}</h2>
              <button type="button" className="service-modal__close" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            <div className="service-modal__body">
              <p>
                <strong>Service type:</strong> {getServiceTypeLabel(service.service_type)}
              </p>
              <p>
                <strong>Availability:</strong>{' '}
                <span className={`status ${service.availability ? 'available' : 'unavailable'}`}>
                  {service.availability ? 'Available' : 'Unavailable'}
                </span>
              </p>
              <p>
                <strong>Description:</strong> {service.description || detail.description}
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href={`tel:${phoneValue.replace(/\s+/g, '')}`}>{phoneValue}</a>
              </p>
              <p>
                <strong>Location:</strong> {service.location}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ServiceCard;
