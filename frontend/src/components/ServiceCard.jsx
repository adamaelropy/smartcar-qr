import { useState } from 'react';
import { getServiceTypeLabel } from '../constants/serviceTypes';

const SERVICE_DETAILS = {
  TYRE_CHANGE: {
    description: 'Quick tyre replacement and puncture repair for safe driving.',
    phone: '+1 (415) 555-0148',
    price: 'From EGP 200',
    tone: 'green',
  },
  OIL_CHANGE: {
    description: 'Engine oil replacement to keep your vehicle running smoothly.',
    phone: '+1 (415) 555-0132',
    price: 'From EGP 300',
    tone: 'blue',
  },
  CAR_WASH: {
    description: 'Exterior wash, detailing, and interior refresh service.',
    phone: '+1 (415) 555-0120',
    price: 'From EGP 150',
    tone: 'purple',
  },
  TOW_SERVICE: {
    description: 'Reliable roadside towing and vehicle recovery assistance.',
    phone: '+1 (415) 555-0199',
    price: 'From EGP 450',
    tone: 'orange',
  },
  BATTERY_REPLACEMENT: {
    description: 'Battery diagnostics and replacement for power issues.',
    phone: '+1 (415) 555-0177',
    price: 'From EGP 250',
    tone: 'orange',
  },
  BRAKE_SERVICE: {
    description: 'Brake inspection, pad replacement, and safe stopping checks.',
    phone: '+1 (415) 555-0142',
    price: 'From EGP 350',
    tone: 'red',
  },
  ENGINE_DIAGNOSTICS: {
    description: 'Advanced engine checks to find faults and performance issues.',
    phone: '+1 (415) 555-0165',
    price: 'From EGP 400',
    tone: 'blue',
  },
  AC_SERVICE: {
    description: 'Air-conditioning inspection and cooling system repair.',
    phone: '+1 (415) 555-0109',
    price: 'From EGP 400',
    tone: 'cyan',
  },
  CAR_DETAILING: {
    description: 'Interior and exterior detailing for a premium finish.',
    phone: '+1 (415) 555-0114',
    price: 'From EGP 500',
    tone: 'purple',
  },
  WHEEL_ALIGNMENT: {
    description: 'Wheel alignment adjustments for better handling and tire life.',
    phone: '+1 (415) 555-0136',
    price: 'From EGP 220',
    tone: 'green',
  },
  WHEEL_BALANCING: {
    description: 'Precision balancing for a smoother ride and reduced vibration.',
    phone: '+1 (415) 555-0158',
    price: 'From EGP 180',
    tone: 'cyan',
  },
  WINDSHIELD_REPAIR: {
    description: 'Windshield crack repair and visibility restoration.',
    phone: '+1 (415) 555-0182',
    price: 'From EGP 280',
    tone: 'blue',
  },
  GLASS_REPLACEMENT: {
    description: 'Glass replacement for windshields and side windows.',
    phone: '+1 (415) 555-0188',
    price: 'From EGP 600',
    tone: 'blue',
  },
  ENGINE_REPAIR: {
    description: 'Mechanical repair for engine performance and reliability issues.',
    phone: '+1 (415) 555-0192',
    price: 'From EGP 750',
    tone: 'red',
  },
  TRANSMISSION_SERVICE: {
    description: 'Transmission maintenance and repair for smoother driving.',
    phone: '+1 (415) 555-0143',
    price: 'From EGP 650',
    tone: 'orange',
  },
  SUSPENSION_REPAIR: {
    description: 'Suspension checks and repairs for ride comfort and control.',
    phone: '+1 (415) 555-0171',
    price: 'From EGP 480',
    tone: 'green',
  },
  CAR_ELECTRICAL: {
    description: 'Electrical diagnostics and repairs for the vehicle system.',
    phone: '+1 (415) 555-0161',
    price: 'From EGP 320',
    tone: 'orange',
  },
  INSPECTION_SERVICE: {
    description: 'Vehicle inspection and safety checks before road use.',
    phone: '+1 (415) 555-0151',
    price: 'From EGP 200',
    tone: 'blue',
  },
  CAR_POLISHING: {
    description: 'Paint enhancement and polish treatment for a clean finish.',
    phone: '+1 (415) 555-0128',
    price: 'From EGP 260',
    tone: 'purple',
  },
  FUEL_DELIVERY: {
    description: 'Emergency fuel delivery to get you moving again fast.',
    phone: '+1 (415) 555-0104',
    price: 'From EGP 120',
    tone: 'cyan',
  },
};

function ServiceTypeIcon({ type }) {
  if (type === 'CAR_WASH' || type === 'CAR_DETAILING' || type === 'CAR_POLISHING') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 14s1-7 8-7 8 7 8 7" />
        <path d="M7 14v2M12 14v3M17 14v2" />
      </svg>
    );
  }
  if (type === 'TYRE_CHANGE' || type === 'WHEEL_ALIGNMENT' || type === 'WHEEL_BALANCING') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (type === 'OIL_CHANGE') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 3h8l1 5H7l1-5z" />
        <path d="M7 8h10v10a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8z" />
      </svg>
    );
  }
  if (type === 'BATTERY_REPLACEMENT' || type === 'CAR_ELECTRICAL') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <path d="M8 7V5M16 7V5M11 12h2M12 11v2" />
      </svg>
    );
  }
  if (type === 'BRAKE_SERVICE') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }
  if (type === 'AC_SERVICE') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18M4.5 7.5l15 9M4.5 16.5l15-9" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 13l2-5h14l2 5" />
      <path d="M5 16h14" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  );
}

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
        <div className={`service-card__icon service-card__icon--${detail.tone || 'blue'}`} aria-hidden="true">
          <ServiceTypeIcon type={service.service_type} />
        </div>
        <h3>{service.service_name}</h3>
        <p className="service-card__price">{detail.price || 'Request a quote'}</p>
        <span className={`status ${service.availability ? 'available' : 'unavailable'}`}>
          {service.availability ? 'Available' : 'Unavailable'}
        </span>
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
