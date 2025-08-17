export interface SharedList {
  id: string;
  listId: string;
  listName: string;
  ownerId: string;
  ownerName: string;
  sharedWith: SharedUser[];
  permissions: ListPermissions;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface SharedUser {
  userId: string;
  userName: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string;
  lastActive: string;
}

export interface ListPermissions {
  canView: boolean;
  canEdit: boolean;
  canAddItems: boolean;
  canRemoveItems: boolean;
  canCheckOff: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface ShareInvitation {
  id: string;
  listId: string;
  listName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface CollaborationActivity {
  id: string;
  listId: string;
  userId: string;
  userName: string;
  action: 'added_item' | 'removed_item' | 'checked_off' | 'unchecked_item' | 'edited_item' | 'shared_list' | 'joined_list';
  itemName?: string;
  timestamp: string;
  details?: string;
}

export interface ConflictResolution {
  itemId: string;
  itemName: string;
  conflicts: Array<{
    userId: string;
    userName: string;
    action: 'add' | 'remove' | 'edit' | 'check_off';
    value: any;
    timestamp: string;
  }>;
  resolution: 'latest_wins' | 'manual_resolution' | 'merge';
  resolvedBy?: string;
  resolvedAt?: string;
}

export class ListSharingService {
  private static readonly SHARED_LISTS_KEY = 'shared_lists';
  private static readonly INVITATIONS_KEY = 'share_invitations';
  private static readonly ACTIVITIES_KEY = 'collaboration_activities';
  private static readonly CONFLICTS_KEY = 'conflict_resolutions';

  private static sharedLists: SharedList[] = [];
  private static invitations: ShareInvitation[] = [];
  private static activities: CollaborationActivity[] = [];
  private static conflicts: ConflictResolution[] = [];

  static async initialize(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        // Load shared lists
        const storedLists = localStorage.getItem(this.SHARED_LISTS_KEY);
        if (storedLists) {
          this.sharedLists = JSON.parse(storedLists);
        }

        // Load invitations
        const storedInvitations = localStorage.getItem(this.INVITATIONS_KEY);
        if (storedInvitations) {
          this.invitations = JSON.parse(storedInvitations);
        }

        // Load activities
        const storedActivities = localStorage.getItem(this.ACTIVITIES_KEY);
        if (storedActivities) {
          this.activities = JSON.parse(storedActivities);
        }

        // Load conflicts
        const storedConflicts = localStorage.getItem(this.CONFLICTS_KEY);
        if (storedConflicts) {
          this.conflicts = JSON.parse(storedConflicts);
        }
      }
    } catch (error) {
      console.error('Failed to initialize list sharing service:', error);
      this.sharedLists = [];
      this.invitations = [];
      this.activities = [];
      this.conflicts = [];
    }
  }

  // Share list with other users
  static async shareList(
    listId: string,
    listName: string,
    ownerId: string,
    ownerName: string,
    inviteeEmail: string,
    role: 'viewer' | 'editor' | 'admin' = 'editor'
  ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // Check if list is already shared with this user
      const existingShare = this.sharedLists.find(
        share => share.listId === listId && 
        share.sharedWith.some(user => user.email === inviteeEmail)
      );

      if (existingShare) {
        return { success: false, error: 'List is already shared with this user' };
      }

      // Check if there's already a pending invitation for this user and list
      const existingInvitation = this.invitations.find(
        inv => inv.listId === listId && 
        inv.inviteeEmail === inviteeEmail && 
        inv.status === 'pending'
      );

      if (existingInvitation) {
        return { success: false, error: 'Invitation already sent to this user' };
      }

      // Create invitation
      const invitation: ShareInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        listId,
        listName,
        inviterId: ownerId,
        inviterName: ownerName,
        inviteeEmail,
        role,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        createdAt: new Date().toISOString(),
      };

      this.invitations.push(invitation);
      await this.saveInvitations();

      // Create or update shared list entry
      let sharedList = this.sharedLists.find(share => share.listId === listId);
      
      if (!sharedList) {
        sharedList = {
          id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          listId,
          listName,
          ownerId,
          ownerName,
          sharedWith: [],
          permissions: this.getDefaultPermissions(role),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        };
        this.sharedLists.push(sharedList);
      } else {
        sharedList.updatedAt = new Date().toISOString();
        sharedList.lastActivity = new Date().toISOString();
      }

      await this.saveSharedLists();

      // Record activity
      await this.recordActivity(listId, ownerId, ownerName, 'shared_list', undefined, `Shared with ${inviteeEmail}`);

      return { success: true, invitationId: invitation.id };
    } catch (error) {
      console.error('Failed to share list:', error);
      return { success: false, error: 'Failed to share list' };
    }
  }

  // Accept invitation
  static async acceptInvitation(
    invitationId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = this.invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: 'Invitation is no longer valid' };
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        invitation.status = 'expired';
        await this.saveInvitations();
        return { success: false, error: 'Invitation has expired' };
      }

      // Update invitation status
      invitation.status = 'accepted';

      // Add user to shared list
      const sharedList = this.sharedLists.find(share => share.listId === invitation.listId);
      if (sharedList) {
        const sharedUser: SharedUser = {
          userId,
          userName,
          email: userEmail,
          role: invitation.role,
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };

        sharedList.sharedWith.push(sharedUser);
        sharedList.updatedAt = new Date().toISOString();
        sharedList.lastActivity = new Date().toISOString();

        await this.saveSharedLists();
        await this.saveInvitations();

        // Record activity
        await this.recordActivity(invitation.listId, userId, userName, 'joined_list');

        return { success: true };
      }

      return { success: false, error: 'Shared list not found' };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  // Decline invitation
  static async declineInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = this.invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      invitation.status = 'declined';
      await this.saveInvitations();

      return { success: true };
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      return { success: false, error: 'Failed to decline invitation' };
    }
  }

  // Get user's shared lists
  static async getSharedLists(userId: string): Promise<SharedList[]> {
    return this.sharedLists.filter(share => 
      share.ownerId === userId || 
      share.sharedWith.some(user => user.userId === userId)
    );
  }

  // Get pending invitations for user
  static async getPendingInvitations(userEmail: string): Promise<ShareInvitation[]> {
    return this.invitations.filter(inv => 
      inv.inviteeEmail === userEmail && inv.status === 'pending'
    );
  }

  // Check user permissions for a list
  static async getUserPermissions(listId: string, userId: string): Promise<ListPermissions | null> {
    const sharedList = this.sharedLists.find(share => share.listId === listId);
    if (!sharedList) return null;

    if (sharedList.ownerId === userId) {
      // Owner has all permissions
      return {
        canView: true,
        canEdit: true,
        canAddItems: true,
        canRemoveItems: true,
        canCheckOff: true,
        canShare: true,
        canDelete: true,
      };
    }

    const sharedUser = sharedList.sharedWith.find(user => user.userId === userId);
    if (!sharedUser) return null;

    return this.getRolePermissions(sharedUser.role);
  }

  // Record collaboration activity
  static async recordActivity(
    listId: string,
    userId: string,
    userName: string,
    action: CollaborationActivity['action'],
    itemName?: string,
    details?: string
  ): Promise<void> {
    try {
      const activity: CollaborationActivity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        listId,
        userId,
        userName,
        action,
        itemName,
        timestamp: new Date().toISOString(),
        details,
      };

      this.activities.push(activity);
      await this.saveActivities();

      // Update last activity for shared list
      const sharedList = this.sharedLists.find(share => share.listId === listId);
      if (sharedList) {
        sharedList.lastActivity = new Date().toISOString();
        await this.saveSharedLists();
      }
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }

  // Get collaboration activities for a list
  static async getListActivities(listId: string, limit: number = 50): Promise<CollaborationActivity[]> {
    return this.activities
      .filter(activity => activity.listId === listId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Handle conflicts in collaborative editing
  static async handleConflict(
    itemId: string,
    itemName: string,
    userId: string,
    userName: string,
    action: 'add' | 'remove' | 'edit' | 'check_off',
    value: any
  ): Promise<{ success: boolean; resolution?: ConflictResolution }> {
    try {
      // Check for existing conflicts
      let conflict = this.conflicts.find(c => c.itemId === itemId);
      
      if (!conflict) {
        conflict = {
          itemId,
          itemName,
          conflicts: [],
          resolution: 'latest_wins',
        };
        this.conflicts.push(conflict);
      }

      // Add new conflict
      conflict.conflicts.push({
        userId,
        userName,
        action,
        value,
        timestamp: new Date().toISOString(),
      });

      // Auto-resolve if latest_wins
      if (conflict.resolution === 'latest_wins') {
        conflict.resolvedBy = userId;
        conflict.resolvedAt = new Date().toISOString();
      }

      await this.saveConflicts();

      return { 
        success: true, 
        resolution: conflict.resolution === 'latest_wins' ? conflict : undefined 
      };
    } catch (error) {
      console.error('Failed to handle conflict:', error);
      return { success: false };
    }
  }

  // Remove user from shared list
  static async removeUserFromList(
    listId: string,
    userId: string,
    removedByUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sharedList = this.sharedLists.find(share => share.listId === listId);
      if (!sharedList) {
        return { success: false, error: 'Shared list not found' };
      }

      // Check permissions
      const permissions = await this.getUserPermissions(listId, removedByUserId);
      if (!permissions?.canShare) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Remove user
      sharedList.sharedWith = sharedList.sharedWith.filter(user => user.userId !== userId);
      sharedList.updatedAt = new Date().toISOString();
      sharedList.lastActivity = new Date().toISOString();

      await this.saveSharedLists();

      // Record activity
      const removedUser = sharedList.sharedWith.find(user => user.userId === userId);
      if (removedUser) {
        await this.recordActivity(
          listId,
          removedByUserId,
          'System',
          'shared_list',
          undefined,
          `Removed ${removedUser.userName} from list`
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to remove user from list:', error);
      return { success: false, error: 'Failed to remove user' };
    }
  }

  // Update user role
  static async updateUserRole(
    listId: string,
    userId: string,
    newRole: 'viewer' | 'editor' | 'admin',
    updatedByUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sharedList = this.sharedLists.find(share => share.listId === listId);
      if (!sharedList) {
        return { success: false, error: 'Shared list not found' };
      }

      // Check permissions
      const permissions = await this.getUserPermissions(listId, updatedByUserId);
      if (!permissions?.canShare) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Update user role
      const user = sharedList.sharedWith.find(u => u.userId === userId);
      if (user) {
        user.role = newRole;
        sharedList.updatedAt = new Date().toISOString();
        sharedList.lastActivity = new Date().toISOString();

        await this.saveSharedLists();

        // Record activity
        await this.recordActivity(
          listId,
          updatedByUserId,
          'System',
          'shared_list',
          undefined,
          `Updated ${user.userName} role to ${newRole}`
        );

        return { success: true };
      }

      return { success: false, error: 'User not found in shared list' };
    } catch (error) {
      console.error('Failed to update user role:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }

  // Get real-time updates (simulated)
  static async getRealTimeUpdates(listId: string, lastUpdate: string): Promise<{
    activities: CollaborationActivity[];
    conflicts: ConflictResolution[];
  }> {
    const newActivities = this.activities.filter(
      activity => activity.listId === listId && 
      new Date(activity.timestamp) > new Date(lastUpdate)
    );

    const newConflicts = this.conflicts.filter(
      conflict => conflict.resolvedAt && 
      new Date(conflict.resolvedAt) > new Date(lastUpdate)
    );

    return {
      activities: newActivities,
      conflicts: newConflicts,
    };
  }

  // Private helper methods
  private static getDefaultPermissions(role: 'viewer' | 'editor' | 'admin'): ListPermissions {
    switch (role) {
      case 'viewer':
        return {
          canView: true,
          canEdit: false,
          canAddItems: false,
          canRemoveItems: false,
          canCheckOff: false,
          canShare: false,
          canDelete: false,
        };
      case 'editor':
        return {
          canView: true,
          canEdit: true,
          canAddItems: true,
          canRemoveItems: true,
          canCheckOff: true,
          canShare: false,
          canDelete: false,
        };
      case 'admin':
        return {
          canView: true,
          canEdit: true,
          canAddItems: true,
          canRemoveItems: true,
          canCheckOff: true,
          canShare: true,
          canDelete: false,
        };
    }
  }

  private static getRolePermissions(role: 'viewer' | 'editor' | 'admin'): ListPermissions {
    return this.getDefaultPermissions(role);
  }

  private static async saveSharedLists(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.SHARED_LISTS_KEY, JSON.stringify(this.sharedLists));
    }
  }

  private static async saveInvitations(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.INVITATIONS_KEY, JSON.stringify(this.invitations));
    }
  }

  private static async saveActivities(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(this.activities));
    }
  }

  private static async saveConflicts(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CONFLICTS_KEY, JSON.stringify(this.conflicts));
    }
  }
}
