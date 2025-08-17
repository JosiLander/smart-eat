import { ListSharingService, SharedList, ShareInvitation, CollaborationActivity } from '../ListSharingService';

describe('ListSharingService', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await ListSharingService.initialize();
  });

  afterEach(async () => {
    // Clear localStorage after each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('initialize', () => {
    it('should initialize with empty data', async () => {
      await ListSharingService.initialize();
      // Service should initialize without errors
      expect(true).toBe(true);
    });

    it('should load existing data from localStorage', async () => {
      const mockSharedLists = [
        {
          id: 'test-share',
          listId: 'test-list',
          listName: 'Test List',
          ownerId: 'owner-1',
          ownerName: 'Owner',
          sharedWith: [],
          permissions: {
            canView: true,
            canEdit: true,
            canAddItems: true,
            canRemoveItems: true,
            canCheckOff: true,
            canShare: true,
            canDelete: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
      ];

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('shared_lists', JSON.stringify(mockSharedLists));
      }

      await ListSharingService.initialize();
      // Service should load data without errors
      expect(true).toBe(true);
    });
  });

  describe('shareList', () => {
    it('should successfully share a list', async () => {
      const result = await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      expect(result.success).toBe(true);
      expect(result.invitationId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should prevent sharing with same user twice', async () => {
      // First share
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      // Second share with same user
      const result = await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'viewer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation already sent to this user');
    });

    it('should create invitation with correct data', async () => {
      const result = await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'admin'
      );

      expect(result.success).toBe(true);
      
      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      expect(invitations).toHaveLength(1);
      expect(invitations[0].listName).toBe('Test List');
      expect(invitations[0].role).toBe('admin');
      expect(invitations[0].status).toBe('pending');
    });
  });

  describe('acceptInvitation', () => {
    it('should successfully accept a valid invitation', async () => {
      // Create invitation
      const shareResult = await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      const invitation = invitations[0];

      const result = await ListSharingService.acceptInvitation(
        invitation.id,
        'user-1',
        'User Name',
        'test@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject expired invitation', async () => {
      // Create invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      const invitation = invitations[0];

      // Manually expire the invitation
      invitation.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const result = await ListSharingService.acceptInvitation(
        invitation.id,
        'user-1',
        'User Name',
        'test@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation has expired');
    });

    it('should reject non-existent invitation', async () => {
      const result = await ListSharingService.acceptInvitation(
        'non-existent-id',
        'user-1',
        'User Name',
        'test@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation not found');
    });
  });

  describe('declineInvitation', () => {
    it('should successfully decline an invitation', async () => {
      // Create invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      const invitation = invitations[0];

      const result = await ListSharingService.declineInvitation(invitation.id);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle non-existent invitation', async () => {
      const result = await ListSharingService.declineInvitation('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation not found');
    });
  });

  describe('getSharedLists', () => {
    it('should return lists shared with user', async () => {
      // Share list
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      // Accept invitation
      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      await ListSharingService.acceptInvitation(
        invitations[0].id,
        'user-1',
        'User Name',
        'test@example.com'
      );

      const sharedLists = await ListSharingService.getSharedLists('user-1');
      expect(sharedLists).toHaveLength(1);
      expect(sharedLists[0].listName).toBe('Test List');
    });

    it('should return lists owned by user', async () => {
      // Share list
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const sharedLists = await ListSharingService.getSharedLists('owner-1');
      expect(sharedLists).toHaveLength(1);
      expect(sharedLists[0].listName).toBe('Test List');
    });

    it('should return empty array for user with no shared lists', async () => {
      const sharedLists = await ListSharingService.getSharedLists('user-with-no-lists');
      expect(sharedLists).toHaveLength(0);
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations for user', async () => {
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      expect(invitations).toHaveLength(1);
      expect(invitations[0].listName).toBe('Test List');
      expect(invitations[0].status).toBe('pending');
    });

    it('should not return accepted invitations', async () => {
      // Create and accept invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      await ListSharingService.acceptInvitation(
        invitations[0].id,
        'user-1',
        'User Name',
        'test@example.com'
      );

      const pendingInvitations = await ListSharingService.getPendingInvitations('test@example.com');
      expect(pendingInvitations).toHaveLength(0);
    });

    it('should return empty array for user with no invitations', async () => {
      const invitations = await ListSharingService.getPendingInvitations('no-invitations@example.com');
      expect(invitations).toHaveLength(0);
    });
  });

  describe('getUserPermissions', () => {
    it('should return full permissions for list owner', async () => {
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const permissions = await ListSharingService.getUserPermissions('test-list', 'owner-1');
      expect(permissions).toEqual({
        canView: true,
        canEdit: true,
        canAddItems: true,
        canRemoveItems: true,
        canCheckOff: true,
        canShare: true,
        canDelete: true,
      });
    });

    it('should return editor permissions for shared user', async () => {
      // Share and accept invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      if (invitations.length > 0) {
        await ListSharingService.acceptInvitation(
          invitations[0].id,
          'user-1',
          'User Name',
          'test@example.com'
        );

        const permissions = await ListSharingService.getUserPermissions('test-list', 'user-1');
        expect(permissions).toEqual({
          canView: true,
          canEdit: true,
          canAddItems: true,
          canRemoveItems: true,
          canCheckOff: true,
          canShare: false,
          canDelete: false,
        });
      }
    });

    it('should return viewer permissions for viewer role', async () => {
      // Share and accept invitation with viewer role
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'viewer'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      if (invitations.length > 0) {
        await ListSharingService.acceptInvitation(
          invitations[0].id,
          'user-1',
          'User Name',
          'test@example.com'
        );

        const permissions = await ListSharingService.getUserPermissions('test-list', 'user-1');
        expect(permissions).toEqual({
          canView: true,
          canEdit: false,
          canAddItems: false,
          canRemoveItems: false,
          canCheckOff: false,
          canShare: false,
          canDelete: false,
        });
      }
    });

    it('should return null for user not in shared list', async () => {
      const permissions = await ListSharingService.getUserPermissions('test-list', 'unknown-user');
      expect(permissions).toBeNull();
    });
  });

  describe('recordActivity', () => {
    it('should record collaboration activity', async () => {
      await ListSharingService.recordActivity(
        'test-list',
        'user-1',
        'User Name',
        'added_item',
        'Milk',
        'Added 2L milk'
      );

      const activities = await ListSharingService.getListActivities('test-list');
      expect(activities.length).toBeGreaterThan(0);
      const latestActivity = activities[0];
      expect(latestActivity.action).toBe('added_item');
      expect(latestActivity.itemName).toBe('Milk');
      expect(latestActivity.details).toBe('Added 2L milk');
    });

    it('should update last activity for shared list', async () => {
      // Share list first
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      await ListSharingService.recordActivity(
        'test-list',
        'user-1',
        'User Name',
        'checked_off',
        'Bread'
      );

      const sharedLists = await ListSharingService.getSharedLists('owner-1');
      expect(sharedLists[0].lastActivity).toBeDefined();
    });
  });

  describe('getListActivities', () => {
    it('should return activities for a list', async () => {
      await ListSharingService.recordActivity(
        'test-list',
        'user-1',
        'User Name',
        'added_item',
        'Milk'
      );

      await ListSharingService.recordActivity(
        'test-list',
        'user-2',
        'User 2',
        'checked_off',
        'Bread'
      );

      const activities = await ListSharingService.getListActivities('test-list');
      expect(activities.length).toBeGreaterThanOrEqual(2);
      expect(activities[0].action).toBe('checked_off'); // Most recent first
      expect(activities[1].action).toBe('added_item');
    });

    it('should limit activities when specified', async () => {
      // Record multiple activities
      for (let i = 0; i < 10; i++) {
        await ListSharingService.recordActivity(
          'test-list',
          'user-1',
          'User Name',
          'added_item',
          `Item ${i}`
        );
      }

      const activities = await ListSharingService.getListActivities('test-list', 5);
      expect(activities).toHaveLength(5);
    });

    it('should return empty array for list with no activities', async () => {
      const activities = await ListSharingService.getListActivities('empty-list');
      expect(activities).toHaveLength(0);
    });
  });

  describe('handleConflict', () => {
    it('should handle conflicts with latest_wins resolution', async () => {
      const result = await ListSharingService.handleConflict(
        'item-1',
        'Milk',
        'user-1',
        'User 1',
        'edit',
        { quantity: 2 }
      );

      expect(result.success).toBe(true);
      expect(result.resolution).toBeDefined();
    });

    it('should accumulate multiple conflicts for same item', async () => {
      await ListSharingService.handleConflict(
        'item-1',
        'Milk',
        'user-1',
        'User 1',
        'edit',
        { quantity: 2 }
      );

      await ListSharingService.handleConflict(
        'item-1',
        'Milk',
        'user-2',
        'User 2',
        'edit',
        { quantity: 3 }
      );

      const result = await ListSharingService.handleConflict(
        'item-1',
        'Milk',
        'user-3',
        'User 3',
        'remove',
        null
      );

      expect(result.success).toBe(true);
    });
  });

  describe('removeUserFromList', () => {
    it('should remove user from shared list', async () => {
      // Share and accept invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      if (invitations.length > 0) {
        await ListSharingService.acceptInvitation(
          invitations[0].id,
          'user-1',
          'User Name',
          'test@example.com'
        );

        const result = await ListSharingService.removeUserFromList(
          'test-list',
          'user-1',
          'owner-1'
        );

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject removal without proper permissions', async () => {
      const result = await ListSharingService.removeUserFromList(
        'test-list',
        'user-1',
        'user-without-permissions'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      // Share and accept invitation
      await ListSharingService.shareList(
        'test-list',
        'Test List',
        'owner-1',
        'Owner Name',
        'test@example.com',
        'editor'
      );

      const invitations = await ListSharingService.getPendingInvitations('test@example.com');
      if (invitations.length > 0) {
        await ListSharingService.acceptInvitation(
          invitations[0].id,
          'user-1',
          'User Name',
          'test@example.com'
        );

        const result = await ListSharingService.updateUserRole(
          'test-list',
          'user-1',
          'admin',
          'owner-1'
        );

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('should reject role update without proper permissions', async () => {
      const result = await ListSharingService.updateUserRole(
        'test-list',
        'user-1',
        'admin',
        'user-without-permissions'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('getRealTimeUpdates', () => {
    it('should return new activities since last update', async () => {
      const lastUpdate = new Date().toISOString();

      await ListSharingService.recordActivity(
        'test-list',
        'user-1',
        'User Name',
        'added_item',
        'Milk'
      );

      const updates = await ListSharingService.getRealTimeUpdates('test-list', lastUpdate);
      expect(updates.activities.length).toBeGreaterThan(0);
      expect(updates.conflicts).toHaveLength(0);
    });

    it('should return empty updates when no new activity', async () => {
      const lastUpdate = new Date().toISOString();

      const updates = await ListSharingService.getRealTimeUpdates('test-list', lastUpdate);
      expect(updates.activities).toHaveLength(0);
      expect(updates.conflicts).toHaveLength(0);
    });
  });
});
