import { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react';
import { taskApi } from '../api/client';
import { Task } from '../types';

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskApi.deleteTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '等待中';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diff = endDate.getTime() - startDate.getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">任务管理</h1>
        <p className="text-gray-400 mt-1">查看和管理后台任务</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-purple-900/50">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-[#4a1942]" />
              <h2 className="text-lg font-semibold text-white">任务列表</h2>
            </div>
          </div>
          
          <div className="divide-y divide-purple-900/30">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    selectedTask?.id === task.id ? 'bg-slate-800' : ''
                  }`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="text-white font-medium">
                        {task.type === 'scan' ? '扫描任务' : task.type}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {getStatusText(task.status)} · {formatTime(task.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {task.status === 'running' && (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4a1942]"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm">{task.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {task.status !== 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无任务记录</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-purple-900/50">
            <h2 className="text-lg font-semibold text-white">任务详情</h2>
          </div>
          
          {selectedTask ? (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">任务类型</p>
                <p className="text-white font-medium">
                  {selectedTask.type === 'scan' ? '扫描任务' : selectedTask.type}
                </p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">状态</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTask.status)}
                  <span className="text-white font-medium">{getStatusText(selectedTask.status)}</span>
                </div>
              </div>
              
              {selectedTask.status === 'running' && selectedTask.progress !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">进度</span>
                    <span className="text-white">{selectedTask.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {selectedTask.message && (
                <div>
                  <p className="text-gray-400 text-sm">消息</p>
                  <p className="text-white">{selectedTask.message}</p>
                </div>
              )}
              
              <div>
                <p className="text-gray-400 text-sm">创建时间</p>
                <p className="text-white">{formatTime(selectedTask.createdAt)}</p>
              </div>
              
              {selectedTask.startedAt && (
                <div>
                  <p className="text-gray-400 text-sm">开始时间</p>
                  <p className="text-white">{formatTime(selectedTask.startedAt)}</p>
                </div>
              )}
              
              {(selectedTask.completedAt || selectedTask.status === 'running') && (
                <div>
                  <p className="text-gray-400 text-sm">持续时间</p>
                  <p className="text-white">{getDuration(selectedTask.startedAt, selectedTask.completedAt)}</p>
                </div>
              )}
              
              {selectedTask.completedAt && (
                <div>
                  <p className="text-gray-400 text-sm">完成时间</p>
                  <p className="text-white">{formatTime(selectedTask.completedAt)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>选择任务查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;
