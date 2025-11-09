import React from 'react';
import type { Task, TranslationSet, TranscriptionTask, TextTranslationTask } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon'; // Placeholder for an error icon

interface TasksPanelProps {
  tasks: Task[];
  taskType: 'transcription' | 'text-translation';
  onSelect: (task: Task) => void;
  onDismiss: (taskId: string) => void;
  activeId?: string;
  t: TranslationSet;
}

const TaskStatusIcon: React.FC<{ status: Task['status'] }> = ({ status }) => {
  switch (status) {
    case 'processing':
      return <SpinnerIcon className="w-5 h-5 text-purple-400 animate-spin" />;
    case 'completed':
      return <CheckIcon className="w-5 h-5 text-green-400" />;
    case 'error':
      return <TrashIcon className="w-5 h-5 text-red-400" />; // Replace with a proper error icon if available
    default:
      return null;
  }
};

const TasksPanel: React.FC<TasksPanelProps> = ({ tasks, taskType, onSelect, onDismiss, activeId, t }) => {
  const relevantTasks = tasks.filter(task => task.type === taskType);

  if (relevantTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col h-full max-h-[50vh] lg:max-h-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-200">Active Tasks</h2>
      <ul className="space-y-2 overflow-y-auto -me-3 pe-3">
        {relevantTasks.map((task) => {
          const title = task.type === 'transcription' 
            ? (task as TranscriptionTask).fileName 
            : `"${(task as TextTranslationTask).sourceText.substring(0, 40)}..."`;

          return (
            <li
              key={task.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                activeId === task.id ? 'bg-purple-600/50' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
              onClick={() => onSelect(task)}
            >
              <div className="flex items-center gap-3 flex-grow overflow-hidden">
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate text-gray-200" title={title}>{title}</p>
                      <p className="text-xs text-gray-400 capitalize">{task.status}</p>
                  </div>
              </div>
              {task.status !== 'processing' && (
                  <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(task.id);
                  }}
                  className="ms-2 p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t.delete}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TasksPanel;