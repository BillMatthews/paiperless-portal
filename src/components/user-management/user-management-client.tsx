'use client'

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/status-badge";
import { DateDisplay } from "@/components/date-display";
import { Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Plus, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAccountUsersForAccount, deleteAccountUser, updateOtherAccountUser } from "@/lib/actions/account-users.actions";
import { AccountUserDetails, AccountUserStatus } from "@/lib/types/account-user.types";
import { SearchMetadata } from "@/lib/types/search.types";
import { EditUserDialog } from "@/components/dialogs/edit-user-dialog";
import { CreateUserDialog } from "@/components/dialogs/create-user-dialog";
import { Label } from "@/components/ui/label";
import {AuthMethod} from "@/lib/types/authentication.types";

type SortField = 'name' | 'emailAddress' | 'status' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc' | null;

export default function UserManagementClientPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [users, setUsers] = useState<AccountUserDetails[]>([]);
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<AccountUserDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState<AccountUserDetails | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [restoringUser, setRestoringUser] = useState<AccountUserDetails | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const sortByColumn = sortField || 'createdAt';
      const sortDir = sortDirection || 'desc';
      const result = await getAccountUsersForAccount(
        searchTerm,
        currentPage,
        10, // itemsPerPage
        sortByColumn,
        sortDir,
        includeDeleted
      );
      setUsers(result.data || []);
      setMetadata(result.metadata || { page: 1, totalPages: 1, limit: 10 });
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
      setUsers([]);
      setMetadata({ page: 1, totalPages: 1, limit: 10 });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage, sortField, sortDirection, includeDeleted]);

  useEffect(() => {
    // Add debounce for search
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage, sortField, sortDirection, includeDeleted, fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const handleCreateUser = () => {
    setCreatingUser(true);
  };

  const handleEditUser = (user: AccountUserDetails) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (user: AccountUserDetails) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setIsDeleting(true);
    const result = await deleteAccountUser(deletingUser.id);
    
    if (result.success) {
      toast.success(`User ${deletingUser.name} deleted successfully`);
      // Refresh the users list
      await fetchUsers();
    } else {
      toast.error(`Failed to delete user ${deletingUser.name}`);
    }
    
    setIsDeleting(false);
    setDeletingUser(null);
  };

  const handleRestoreUser = (user: AccountUserDetails) => {
    setRestoringUser(user);
  };

  const handleConfirmRestore = async () => {
    if (!restoringUser) return;
    
    setIsRestoring(true);
    try {
      const result = await updateOtherAccountUser(restoringUser.id, {
        name: restoringUser.name,
        emailAddress: restoringUser.emailAddress,
        walletAddress: restoringUser.walletAddress,
        status: AccountUserStatus.ACTIVE,
        permissions: restoringUser.permissions,
        authMethod: restoringUser.authMethod as AuthMethod
      });
      
      if (result.success) {
        toast.success(`User ${restoringUser.name} restored successfully`);
        // Refresh the users list
        await fetchUsers();
      } else {
        toast.error(`Failed to restore user ${restoringUser.name}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error restoring user:', error);
    } finally {
      setIsRestoring(false);
      setRestoringUser(null);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users by name, email, or status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="include-deleted"
              checked={includeDeleted}
              onCheckedChange={setIncludeDeleted}
              disabled={isLoading}
            />
            <Label htmlFor="include-deleted" className="text-sm">
              Show Deleted Accounts
            </Label>
          </div>
          <div className="flex items-center gap-2">
            {!includeDeleted && (
              <Button
                onClick={handleCreateUser}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <span>Page</span>
              <span className="font-medium">{currentPage}</span>
              <span>of</span>
              <span className="font-medium">{metadata?.totalPages || 1}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(metadata?.totalPages || 1, prev + 1))}
              disabled={currentPage === (metadata?.totalPages || 1) || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {includeDeleted && (
        <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Viewing Deleted Users:</strong> You can restore deleted users by clicking the restore button. 
            Only deleted users can be restored.
          </p>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-medium"
                  onClick={() => handleSort('name')}
                >
                  User Name
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-medium"
                  onClick={() => handleSort('emailAddress')}
                >
                  Email Address
                  {getSortIcon('emailAddress')}
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-medium"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-medium"
                  onClick={() => handleSort('createdAt')}
                >
                  Created At
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-medium"
                  onClick={() => handleSort('updatedAt')}
                >
                  Updated At
                  {getSortIcon('updatedAt')}
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {includeDeleted ? "No deleted users found." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow 
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors duration-200"
                >
                  <TableCell className="font-medium">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.emailAddress}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={user.createdAt} />
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={user.updatedAt} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {includeDeleted ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreUser(user)}
                          disabled={user.status !== AccountUserStatus.DELETED}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">Restore</span>
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            disabled={user.status === AccountUserStatus.DELETED}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.status === AccountUserStatus.DELETED}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user &#34;{deletingUser?.name}&#34;? This action will mark the user as deleted and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!restoringUser} onOpenChange={(open) => !open && setRestoringUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore the user &#34;{restoringUser?.name}&#34;? This will change their status back to Active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isRestoring ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditUserDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onSuccess={fetchUsers}
      />

      <CreateUserDialog
        open={creatingUser}
        onOpenChange={setCreatingUser}
        onSuccess={fetchUsers}
      />
    </div>
  );
}