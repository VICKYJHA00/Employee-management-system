

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, CalendarDays, Flag, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';


interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  priority: string;
  due_date: string;
  created_at: string;
}


const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-400 border-red-500/20'
};


const DailyTodos = () => {
  const { adminProfile } = useAuth();
  const { logActivity } = useActivityLogger();
  

  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('low');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  

  useEffect(() => {
    if (adminProfile) fetchTodos();
  }, [adminProfile]);
  

  useEffect(() => {
    applyFilters();
  }, [todos, search, filter]);
  

  const fetchTodos = async () => {
    if (!adminProfile) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('admin_todos')
        .select('*')
        .eq('admin_id', adminProfile.id)
        .eq('due_date', today)
        .order('created_at', { ascending: true });
      

      if (error) throw error;
      setTodos((data || []) as Todo[]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  
  const applyFilters = () => {
    let data = [...todos];

    

    if (search) {
      data = data.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (filter === 'active') data = data.filter(t => !t.is_completed);
    if (filter === 'completed') data = data.filter(t => t.is_completed);

    

    setFilteredTodos(data);
  };

  const addTodo = async () => {
    if (!newTask.trim() || !adminProfile) return;

    

    try {
      const { error } = await supabase.from('admin_todos').insert({
        admin_id: adminProfile.id,
        title: newTask,
        priority,
        due_date: new Date().toISOString().split('T')[0]
      } as any);

      if (error) throw error;

      await logActivity(ActivityActions.CREATE_TODO, { task_title: newTask });


      
      setNewTask('');
      setPriority('low');
      setOpenModal(false);
      fetchTodos();

      

      toast({ title: 'Task Added 🚀' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  

  const toggleTodo = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('admin_todos')
        .update({ is_completed: !todo.is_completed } as any)
        .eq('id', todo.id);

      if (error) throw error;

      if (!todo.is_completed) {
        await logActivity(ActivityActions.COMPLETE_TODO, { task_title: todo.title });
      }

      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  

  const deleteTodo = async (id: string, title: string) => {
    try {
      const { error } = await supabase.from('admin_todos').delete().eq('id', id);
      if (error) throw error;

      await logActivity(ActivityActions.DELETE_TODO, { task_title: title });
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.is_completed).length;
    return {
      total,
      completed,
      progress: total ? (completed / total) * 100 : 0
    };
  }, [todos]);


  
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex gap-2 items-center">
              <ListTodo className="w-5 h-5 text-primary" /> Daily Tasks
            </CardTitle>
            <Button size="sm" onClick={() => setOpenModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>


          
          <Progress value={stats.progress} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">
            {stats.completed}/{stats.total} completed
          </p>
        </CardHeader>

        

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            

            <Select onValueChange={(v:any)=>setFilter(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-sm">Loading...</p>
            ) : filteredTodos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No tasks found</p>
            ) : (
              filteredTodos.map(todo => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    todo.is_completed ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <button onClick={() => toggleTodo(todo)}>
                    {todo.is_completed ? (
                      <CheckCircle2 className="text-green-500" />
                    ) : (
                      <Circle className="text-muted-foreground" />
                    )}
                  </button>

                  

                  <div className="flex-1">
                    <p className={`${todo.is_completed && 'line-through text-muted-foreground'}`}>
                      {todo.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={priorityColors[todo.priority]}>
                        <Flag className="w-3 h-3 mr-1" /> {todo.priority}
                      </Badge>
                      <Badge variant="outline">
                        <CalendarDays className="w-3 h-3 mr-1" /> Today
                      </Badge>
                    </div>
                  </div>

                  <Button size="icon" variant="ghost" onClick={() => deleteTodo(todo.id, todo.title)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      

      {/* Add Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            

            <Button className="w-full" onClick={addTodo}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};



export default DailyTodos;
