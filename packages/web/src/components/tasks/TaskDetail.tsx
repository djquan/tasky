import { useState, useEffect } from 'react';
import { useTask, useChecklistItems } from '../../hooks/useEntities';
import { useNavigation } from '../../store/navigation';
import { updateTask, deleteTask, toggleTask } from '../../lib/tasks';
import { createChecklistItem, toggleChecklistItem, deleteChecklistItem } from '../../lib/checklists';
import { WhenPicker } from '../pickers/WhenPicker';
import { DatePicker } from '../pickers/DatePicker';
import { TagPicker } from '../pickers/TagPicker';
import { ProjectAreaPicker } from '../pickers/ProjectAreaPicker';
import type { WhenValue } from '@tasky/shared';

export function TaskDetail() {
  const { selectedTaskId, selectTask } = useNavigation();
  const { task } = useTask(selectedTaskId);
  const { items: checklistItems } = useChecklistItems(selectedTaskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes);
    }
  }, [task]);

  if (!selectedTaskId || !task) {
    return null;
  }

  const handleClose = () => {
    selectTask(null);
  };

  const handleSave = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim(), notes: notes.trim() });
    }
  };

  const handleWhenChange = (when: WhenValue) => {
    updateTask(task.id, { when });
    setActiveSection(null);
  };

  const handleDeadlineChange = (deadline: number | null) => {
    updateTask(task.id, { deadline });
    setActiveSection(null);
  };

  const handleScheduledDateChange = (scheduledDate: number | null) => {
    updateTask(task.id, { scheduledDate });
    setActiveSection(null);
  };

  const handleTagsChange = (tags: string[]) => {
    updateTask(task.id, { tags });
  };

  const handleProjectChange = (projectId: string | null) => {
    updateTask(task.id, { projectId });
  };

  const handleAreaChange = (areaId: string | null) => {
    updateTask(task.id, { areaId });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    createChecklistItem({
      taskId: task.id,
      title: newChecklistItem.trim(),
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });

    setNewChecklistItem('');
  };

  const handleDeleteTask = () => {
    if (confirm('Delete this task?')) {
      deleteTask(task.id);
      handleClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      {/* Detail Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => toggleTask(task.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                task.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {task.completed ? 'Completed' : 'Mark Complete'}
            </button>
            <button
              onClick={handleDeleteTask}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-2xl font-bold text-gray-900 focus:outline-none"
              placeholder="Task title..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Add notes..."
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Checklist</label>
            <div className="space-y-2">
              {checklistItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center"
                  >
                    {item.completed && (
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.title}
                  </span>
                  <button
                    onClick={() => deleteChecklistItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  placeholder="Add checklist item..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {newChecklistItem && (
                  <button
                    onClick={handleAddChecklistItem}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* When */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'when' ? null : 'when')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">When</span>
              <span className="text-sm text-gray-600">
                {task.scheduledDate
                  ? new Date(task.scheduledDate).toLocaleDateString()
                  : task.when}
              </span>
            </button>
            {activeSection === 'when' && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                <WhenPicker
                  value={task.when}
                  scheduledDate={task.scheduledDate}
                  onChange={handleWhenChange}
                  onScheduledDateChange={handleScheduledDateChange}
                />
              </div>
            )}
          </div>

          {/* Deadline */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'deadline' ? null : 'deadline')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Deadline</span>
              <span className="text-sm text-gray-600">
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}
              </span>
            </button>
            {activeSection === 'deadline' && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                <DatePicker value={task.deadline} onChange={handleDeadlineChange} label="Deadline" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'tags' ? null : 'tags')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <span className="text-sm text-gray-600">{task.tags.length} tags</span>
            </button>
            {activeSection === 'tags' && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                <TagPicker selectedTags={task.tags} onChange={handleTagsChange} />
              </div>
            )}
          </div>

          {/* Project & Area */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'project' ? null : 'project')}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Project / Area</span>
              <span className="text-sm text-gray-600">
                {task.projectId || task.areaId ? 'Set' : 'None'}
              </span>
            </button>
            {activeSection === 'project' && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                <ProjectAreaPicker
                  projectId={task.projectId}
                  areaId={task.areaId}
                  onChangeProject={handleProjectChange}
                  onChangeArea={handleAreaChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
