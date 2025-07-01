import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { jwtDecode } from 'jwt-decode';
import { Pencil, Trash2 } from 'lucide-react';

interface User {
  ID: number;
  Username: string;
  RoleID: number;
  Role: { Name: string };
}

interface Role {
  ID: number;
  Name: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { user_id: number; role: string; exp: number } = jwtDecode(token);
        setCurrentLoggedInUserId(decodedToken.user_id);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const usersResponse = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(usersResponse.data);

      setRoles([
        { ID: 1, Name: 'admin' },
        { ID: 2, Name: 'user' },
      ]);

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to fetch users or roles');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        // Update user
        await axios.put(`/api/users/${editingUser.ID}`, {
          username: newUsername || editingUser.Username,
          password: newPassword,
          role_id: Number(newRoleId) || editingUser.RoleID,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Create user
        await axios.post('/api/users', {
          username: newUsername,
          password: newPassword,
          role_id: Number(newRoleId),
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setNewUsername('');
      setNewPassword('');
      setNewRoleId('');
      setEditingUser(null);
      setIsSheetOpen(false);
      fetchUsersAndRoles();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to save user');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsersAndRoles();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to delete user');
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.Username);
    setNewRoleId(String(user.RoleID));
    setNewPassword(''); // Password should not be pre-filled for security
    setIsSheetOpen(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setNewRoleId('');
    setIsSheetOpen(true);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button onClick={handleAddClick}>Add New User</Button>
            </SheetTrigger>
            <SheetContent className="p-4">
              <SheetHeader>
                <SheetTitle>{editingUser ? 'Edit User' : 'Add New User'}</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required={!editingUser} // Password is required only for new users
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRoleId} onValueChange={setNewRoleId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.ID} value={String(role.ID)}>
                          {role.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full">{editingUser ? 'Save Changes' : 'Add User'}</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <h2 className="text-xl font-semibold mb-2">Existing Users</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.ID}>
                  <TableCell className="font-medium">{user.Username}</TableCell>
                  <TableCell>{user.Role.Name}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(user)} aria-label={`Edit user ${user.Username}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteUser(user.ID)}
                      disabled={user.ID === currentLoggedInUserId || user.Username === 'admin'}
                      aria-label={`Delete user ${user.Username}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagementPage;