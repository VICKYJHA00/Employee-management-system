import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
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

const DailyTodos = () => {
  const { adminProfile } = useAuth();
  const { logActivity } = useActivityLogger();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (adminProfile) {
      fetchTodos();
    }
  }, [adminProfile]);

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
      console.error('Error fetching todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async () => {
    if (!adminProfile || !newTask.trim()) return;

    try {
      const { error } = await supabase
        .from('admin_todos')
        .insert({
          admin_id: adminProfile.id,
          title: newTask.trim(),
          due_date: new Date().toISOString().split('T')[0]
        } as any);

      if (error) throw error;

      // Log activity
      await logActivity(ActivityActions.CREATE_TODO, {
        task_title: newTask.trim()
      });

      setNewTask('');
      fetchTodos();
      toast({ title: 'Task added' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('admin_todos')
        .update({ 
          is_completed: !todo.is_completed,
          completed_at: !todo.is_completed ? new Date().toISOString() : null
        } as any)
        .eq('id', todo.id);

      if (error) throw error;

      // Log completion activity
      if (!todo.is_completed) {
        await logActivity(ActivityActions.COMPLETE_TODO, {
          task_title: todo.title
        });
      }

      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('admin_todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log deletion activity
      await logActivity(ActivityActions.DELETE_TODO, {
        task_title: title
      });

      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const completedCount = todos.filter(t => t.is_completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="gradient-card border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="w-5 h-5 text-primary" />
            Today's Tasks
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}% complete</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Task Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className="bg-black/30 border-white/10 text-sm"
          />
          <Button size="sm" onClick={addTodo} className="gradient-primary">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Todo List */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No tasks for today. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  todo.is_completed 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <button onClick={() => toggleTodo(todo)} className="flex-shrink-0">
                  {todo.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${todo.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {todo.title}
                </span>
                <button 
                  onClick={() => deleteTodo(todo.id, todo.title)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTodos;
