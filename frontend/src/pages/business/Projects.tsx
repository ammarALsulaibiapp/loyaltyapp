import React, { useState } from 'react';
import { Plus, Search, Filter, Users, MoreHorizontal, Link as LinkIcon, Calendar, MessageSquare, Eye, List, Columns, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Task {
  id: string;
  title: string;
  description: string;
  tags: string[];
  progress: number;
  assignees: { name: string; avatar: string }[];
  status: 'todo' | 'inProgress' | 'review' | 'complete';
}

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'list' | 'board' | 'workflow' | 'calendar'>('board');

  const members = [
    { id: '1', name: 'Antony Cardenas', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: '2', name: 'Meredith Potter', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: '3', name: 'Iona Rollins', avatar: 'https://i.pravatar.cc/150?img=9' },
  ];

  const tasks: Task[] = [
    {
      id: '1',
      title: 'Multi-Language Blog Platform',
      description: 'Set up the backend for a blog platform supporting multiple languages and easy translation.',
      tags: ['Web', 'Dev'],
      progress: 0,
      assignees: [members[0]],
      status: 'todo',
    },
    {
      id: '2',
      title: 'Healthcare App Flow',
      description: 'Research and draft UX for a telemedicine healthcare application.',
      tags: ['Marketing'],
      progress: 0,
      assignees: [members[1]],
      status: 'todo',
    },
    {
      id: '3',
      title: 'E-Commerce Landing Page',
      description: '',
      tags: ['Design', 'Marketing'],
      progress: 0,
      assignees: [members[2]],
      status: 'todo',
    },
    {
      id: '4',
      title: 'Booking System MVP',
      description: 'Develop the first MVP version with reservations, reminders, and calendar synchronization.',
      tags: ['Web', 'Dev'],
      progress: 20,
      assignees: [members[0]],
      status: 'inProgress',
    },
    {
      id: '5',
      title: 'Payment Gateway Integration',
      description: 'Integrate Stripe and PayPal to enable secure subscriptions.',
      tags: ['Web', 'Dev'],
      progress: 65,
      assignees: [members[1]],
      status: 'inProgress',
    },
    {
      id: '6',
      title: 'Brand Guidelines',
      description: '',
      tags: ['Design'],
      progress: 0,
      assignees: [members[2]],
      status: 'inProgress',
    },
    {
      id: '7',
      title: 'Fitness Tracking Module',
      description: 'Implement activity tracking, workout history, and personalized performance insights.',
      tags: ['Mobile'],
      progress: 89,
      assignees: [members[0], members[1]],
      status: 'review',
    },
    {
      id: '8',
      title: 'Real Estate Listing Backend',
      description: 'Validate API stability and optimize database queries before release.',
      tags: ['Web'],
      progress: 92,
      assignees: [members[0], members[1], members[2]],
      status: 'review',
    },
    {
      id: '9',
      title: 'E-Commerce Landing Page',
      description: '',
      tags: ['Design', 'Marketing'],
      progress: 100,
      assignees: [members[1]],
      status: 'complete',
    },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      Web: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      Dev: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      Mobile: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      Design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
      Marketing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    };
    return colors[tag] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200 dark:bg-gray-600';
    if (progress < 50) return 'bg-yellow-400';
    if (progress < 90) return 'bg-blue-400';
    return 'bg-green-400';
  };

  const columns = [
    { id: 'todo', title: t('projects.todo', 'To Do'), color: 'bg-slate-100/50 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/20', dotColor: 'bg-slate-400' },
    { id: 'inProgress', title: t('projects.inProgress', 'In Progress'), color: 'bg-amber-50/30 dark:bg-amber-500/10 backdrop-blur-sm border border-amber-500/10', dotColor: 'bg-amber-500' },
    { id: 'review', title: t('projects.review', 'Review'), color: 'bg-indigo-50/30 dark:bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/10', dotColor: 'bg-indigo-500' },
    { id: 'complete', title: t('projects.complete', 'Complete'), color: 'bg-emerald-50/30 dark:bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/10', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('projects.title', 'Projects')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('projects.subtitle', 'Manage and track your team projects')}</p>
      </div>

      {/* Top Bar: Views + Actions + Search */}
      <div className="glass-panel dark:glass-panel-dark rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                activeView === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              {t('projects.listView', 'List')}
            </button>
            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                activeView === 'board'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              {t('projects.boardView', 'Board')}
            </button>
            <button
              onClick={() => setActiveView('workflow')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                activeView === 'workflow'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              {t('projects.workflowView', 'Workflow')}
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                activeView === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {t('projects.calendarView', 'Calendar')}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              {t('projects.addTask', 'Add task')}
            </button>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              {t('projects.invite', 'Invite')}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={t('projects.searchTasks', 'Search tasks...')}
              className="w-full ps-9 pe-3 py-2 bg-gray-50 dark:bg-gray-700 border border-transparent rounded-lg text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-gray-300 dark:focus:border-gray-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
            <Filter className="w-3.5 h-3.5" />
            {t('projects.filters', 'Filters')}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
            <Eye className="w-3.5 h-3.5" />
            {t('projects.show', 'Show')}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-5 min-w-max">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-[300px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className={`w-2 h-2 rounded-full ${column.dotColor}`}></div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-[13px]">
                    {column.title} <span className="text-gray-500 font-normal">{columnTasks.length}</span>
                  </h3>
                </div>

                {/* Cards Container */}
                <div className={`flex-1 ${column.color} rounded-2xl p-3 space-y-3`}>
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass-panel dark:glass-panel-dark rounded-xl p-4 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700/30"
                    >
                      {/* Tags */}
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-[13px] leading-snug">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('projects.progress', 'Progress')}</span>
                          <span className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold">{task.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(task.progress)} transition-all duration-300 rounded-full`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700">
                        <div className="flex -space-x-1.5 rtl:space-x-reverse">
                          {task.assignees.map((assignee, idx) => (
                            <img
                              key={idx}
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ring-1 ring-gray-100 dark:ring-gray-700"
                              title={assignee.name}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                          <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-all p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Projects;
