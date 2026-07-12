
export const BUSINESS_CONFIG = {
  id: "purepress-jos",
  name: "PurePress Laundry",
  parentCompany: "Code Bruv Technologies LTD",

  email: "support@purepresslaundry.com",
  phone: "08024945119",
  website: "purepresslaundry.com",

  city: "Jos",
  state: "Plateau State",
  country: "Nigeria",
  serviceRadiusKm: 50,

  openingTime: "09:00",
  closingTime: "17:00",
  workingDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as string[],

  bankName: "Access Bank",
  accountNumber: "0000000000",
  accountName: "PurePress Laundry",

  defaultDeliveryFee: 1500,
  defaultPickupFee: 600,

  tagline: "Professional laundry, delivered to your door",

  primaryColor: "#0077b6",
  secondaryColor: "#f5f5f0",
  accentColor: "#1a7ff9",
} as const;

export const DEFAULT_BUSINESS_ID = BUSINESS_CONFIG.id;
export const DEFAULT_BUSINESS_NAME = BUSINESS_CONFIG.name;
export const DEFAULT_CITY = BUSINESS_CONFIG.city;
export const DEFAULT_DELIVERY_FEE = BUSINESS_CONFIG.defaultDeliveryFee;
