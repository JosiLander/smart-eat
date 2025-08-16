export interface ExpiryColorInfo {
  color: string;
  backgroundColor: string;
  text: string;
  urgency: 'safe' | 'warning' | 'danger' | 'expired';
}

export const getExpiryColorInfo = (expiryDate: Date): ExpiryColorInfo => {
  const now = new Date();
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) {
    return {
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      text: 'Expired',
      urgency: 'expired'
    };
  } else if (daysDiff <= 3) {
    return {
      color: '#ffffff',
      backgroundColor: '#e67e22',
      text: 'Expires Soon',
      urgency: 'danger'
    };
  } else if (daysDiff <= 7) {
    return {
      color: '#ffffff',
      backgroundColor: '#f39c12',
      text: 'This Week',
      urgency: 'warning'
    };
  } else {
    return {
      color: '#ffffff',
      backgroundColor: '#27ae60',
      text: 'Good',
      urgency: 'safe'
    };
  }
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getDaysUntilExpiry = (expiryDate: Date): number => {
  const now = new Date();
  const timeDiff = expiryDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
