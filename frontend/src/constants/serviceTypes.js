export const SERVICE_TYPE_OPTIONS = [
  { value: 'TYRE_CHANGE', label: 'Tyre Change' },
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'CAR_WASH', label: 'Car Wash' },
  { value: 'TOW_SERVICE', label: 'Tow Service' },
  { value: 'BATTERY_REPLACEMENT', label: 'Battery Replacement' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'ENGINE_DIAGNOSTICS', label: 'Engine Diagnostics' },
  { value: 'AC_SERVICE', label: 'AC Service' },
  { value: 'CAR_DETAILING', label: 'Car Detailing' },
  { value: 'WHEEL_ALIGNMENT', label: 'Wheel Alignment' },
  { value: 'WHEEL_BALANCING', label: 'Wheel Balancing' },
  { value: 'WINDSHIELD_REPAIR', label: 'Windshield Repair' },
  { value: 'GLASS_REPLACEMENT', label: 'Glass Replacement' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'TRANSMISSION_SERVICE', label: 'Transmission Service' },
  { value: 'SUSPENSION_REPAIR', label: 'Suspension Repair' },
  { value: 'CAR_ELECTRICAL', label: 'Car Electrical' },
  { value: 'INSPECTION_SERVICE', label: 'Vehicle Inspection' },
  { value: 'CAR_POLISHING', label: 'Car Polishing' },
  { value: 'FUEL_DELIVERY', label: 'Fuel Delivery' },
];

const SERVICE_TYPE_LABELS = Object.fromEntries(
  SERVICE_TYPE_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ]),
);

export function getServiceTypeLabel(serviceType) {
  return SERVICE_TYPE_LABELS[serviceType] || serviceType;
}
