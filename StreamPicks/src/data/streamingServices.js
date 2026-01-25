// Streaming services configuration
// These are the user's subscribed services

export const STREAMING_SERVICES = {
  NETFLIX: {
    id: 'netflix',
    name: 'Netflix',
    color: '#E50914',
    logo: 'N',
    backgroundColor: '#000000',
  },
  DISNEY_PLUS: {
    id: 'disney_plus',
    name: 'Disney+',
    color: '#113CCF',
    logo: 'D+',
    backgroundColor: '#040814',
  },
  HULU: {
    id: 'hulu',
    name: 'Hulu',
    color: '#1CE783',
    logo: 'H',
    backgroundColor: '#040405',
  },
  HBO: {
    id: 'hbo',
    name: 'Max',
    color: '#B396FF',
    logo: 'MAX',
    backgroundColor: '#000000',
  },
  PRIME: {
    id: 'prime',
    name: 'Prime Video',
    color: '#00A8E1',
    logo: 'P',
    backgroundColor: '#0F171E',
  },
  APPLE_TV: {
    id: 'apple_tv',
    name: 'Apple TV+',
    color: '#FFFFFF',
    logo: 'TV+',
    backgroundColor: '#000000',
  },
  PARAMOUNT_PLUS: {
    id: 'paramount_plus',
    name: 'Paramount+',
    color: '#0064FF',
    logo: 'P+',
    backgroundColor: '#0033A0',
  },
  MGM_PLUS: {
    id: 'mgm_plus',
    name: 'MGM+',
    color: '#D4AF37',
    logo: 'MGM+',
    backgroundColor: '#1a1a1a',
  },
};

export const USER_SUBSCRIPTIONS = [
  STREAMING_SERVICES.NETFLIX,
  STREAMING_SERVICES.DISNEY_PLUS,
  STREAMING_SERVICES.HULU,
  STREAMING_SERVICES.HBO,
  STREAMING_SERVICES.PRIME,
  STREAMING_SERVICES.APPLE_TV,
  STREAMING_SERVICES.PARAMOUNT_PLUS,
  STREAMING_SERVICES.MGM_PLUS,
];

export const getServiceById = (id) => {
  return Object.values(STREAMING_SERVICES).find(service => service.id === id);
};

export const getServiceColor = (id) => {
  const service = getServiceById(id);
  return service ? service.color : '#666666';
};
