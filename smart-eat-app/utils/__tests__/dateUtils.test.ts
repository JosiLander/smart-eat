import { getExpiryColorInfo, formatDate, getDaysUntilExpiry } from '../dateUtils';

describe('dateUtils', () => {
  describe('getExpiryColorInfo', () => {
    it('should return expired status for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const result = getExpiryColorInfo(pastDate);
      
      expect(result.urgency).toBe('expired');
      expect(result.backgroundColor).toBe('#e74c3c');
      expect(result.text).toBe('Expired');
    });

    it('should return danger status for dates within 3 days', () => {
      const dangerDate = new Date();
      dangerDate.setDate(dangerDate.getDate() + 2);
      
      const result = getExpiryColorInfo(dangerDate);
      
      expect(result.urgency).toBe('danger');
      expect(result.backgroundColor).toBe('#e67e22');
      expect(result.text).toBe('Expires Soon');
    });

    it('should return warning status for dates within 7 days', () => {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 5);
      
      const result = getExpiryColorInfo(warningDate);
      
      expect(result.urgency).toBe('warning');
      expect(result.backgroundColor).toBe('#f39c12');
      expect(result.text).toBe('This Week');
    });

    it('should return safe status for dates beyond 7 days', () => {
      const safeDate = new Date();
      safeDate.setDate(safeDate.getDate() + 10);
      
      const result = getExpiryColorInfo(safeDate);
      
      expect(result.urgency).toBe('safe');
      expect(result.backgroundColor).toBe('#27ae60');
      expect(result.text).toBe('Good');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const testDate = new Date(2025, 0, 15); // January 15, 2025
      
      const result = formatDate(testDate);
      
      expect(result).toBe('Jan 15, 2025');
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return correct days until expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const result = getDaysUntilExpiry(futureDate);
      
      expect(result).toBe(5);
    });

    it('should return negative days for expired items', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      
      const result = getDaysUntilExpiry(pastDate);
      
      expect(result).toBe(-3);
    });
  });
});
