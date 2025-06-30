import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { jwtDecode } from 'jwt-decode';
import { Pencil, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

interface Task {
  ID: number;
  Title: string;
  Done: boolean;
  UserID: number;
}

const AppPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { user_id: number; role: string; exp: number } = jwtDecode(token);
        setCurrentUserId(decodedToken.user_id);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to fetch tasks');
      } else {
        setError('An unexpected error occurred');
      }
      setTasks([]);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchTasks();
    }
  }, [currentUserId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (currentUserId === null) {
      setError("User not authenticated.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/tasks', { Title: newTaskTitle, Done: false, user_id: currentUserId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to create task');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleUpdateTask = async (task: Task, newTitle?: string, newDone?: boolean) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const updatedTask = { 
        ...task, 
        Title: newTitle !== undefined ? newTitle : task.Title, 
        Done: newDone !== undefined ? newDone : !task.Done 
      };
      await axios.put(`/api/tasks/${task.ID}`, updatedTask, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasks();
      setIsSheetOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to update task');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleDeleteTask = async (id: number) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasks();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to delete task');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsSheetOpen(true);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTask} className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="New task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
            className="flex-grow"
          />
          <Button type="submit">Add Task</Button>
        </form>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {tasks && tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.ID} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={task.Done}
                    onCheckedChange={() => handleUpdateTask(task, task.Title, !task.Done)}
                    id={`task-${task.ID}`}
                  />
                  <label
                    htmlFor={`task-${task.ID}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.Done ? 'line-through text-gray-500' : ''}`}
                  >
                    {task.Title}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditClick(task)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteTask(task.ID)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No tasks found. Add a new task!</p>
        )}
      </CardContent>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="p-4">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
          </SheetHeader>
          {editingTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const titleInput = form.elements.namedItem('newTitle') as HTMLInputElement;
                const doneCheckbox = form.elements.namedItem('newDone') as HTMLInputElement;
                handleUpdateTask(editingTask, titleInput.value, doneCheckbox.checked);
              }}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="newTitle">New Title</Label>
                <Input
                  id="newTitle"
                  type="text"
                  defaultValue={editingTask.Title}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newDone"
                  defaultChecked={editingTask.Done}
                />
                <Label htmlFor="newDone">Completed</Label>
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default AppPage;