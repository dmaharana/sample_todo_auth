import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { jwtDecode } from 'jwt-decode';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: { user_id: number; role: string; exp: number } = jwtDecode(token);
        setCurrentUserId(decodedToken.user_id);
      } catch (err) {
        console.error("Failed to decode token:", err);
        // Handle invalid token, e.g., redirect to login
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
      setTasks([]); // Ensure tasks is an empty array on error
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

  const handleUpdateTask = async (task: Task) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/tasks/${task.ID}`, { ...task, Done: !task.Done }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasks();
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
                    onCheckedChange={() => handleUpdateTask(task)}
                    id={`task-${task.ID}`}
                  />
                  <label
                    htmlFor={`task-${task.ID}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.Done ? 'line-through text-gray-500' : ''}`}
                  >
                    {task.Title}
                  </label>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task.ID)}>Delete</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No tasks found. Add a new task!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AppPage;
