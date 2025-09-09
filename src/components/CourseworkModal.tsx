"use client";

import { useState, useEffect } from 'react';

interface CourseworkItem {
  id?: string;
  title?: string;
  description?: string;
  state?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  assigneeMode?: string;
  materials?: Array<{
    driveFile?: Record<string, unknown>;
    youtubeVideo?: Record<string, unknown>;
    link?: Record<string, unknown>;
    form?: Record<string, unknown>;
  }>;
}

interface CourseworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  type: 'assignment' | 'material';
  editingItem?: CourseworkItem | null;
  courseId: string;
}

export default function CourseworkModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  editingItem,
  courseId
}: CourseworkModalProps) {
  const [formData, setFormData] = useState({
    title: editingItem?.title || '',
    description: editingItem?.description || '',
    state: editingItem?.state || 'PUBLISHED',
    dueDate: editingItem?.dueDate ? 
      `${editingItem.dueDate.year}-${String(editingItem.dueDate.month).padStart(2, '0')}-${String(editingItem.dueDate.day).padStart(2, '0')}` : '',
    dueTime: editingItem?.dueTime ? 
      `${String(editingItem.dueTime.hours).padStart(2, '0')}:${String(editingItem.dueTime.minutes).padStart(2, '0')}` : '',
    maxPoints: editingItem?.maxPoints || '',
    assigneeMode: editingItem?.assigneeMode || 'ALL_STUDENTS',
    materials: editingItem?.materials || [],
  });

  const [attachments, setAttachments] = useState<Array<{
    type: 'driveFile' | 'youtubeVideo' | 'link' | 'form';
    data: Record<string, any>;
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        state: editingItem.state || 'PUBLISHED',
        dueDate: editingItem.dueDate ? 
          `${editingItem.dueDate.year}-${String(editingItem.dueDate.month).padStart(2, '0')}-${String(editingItem.dueDate.day).padStart(2, '0')}` : '',
        dueTime: editingItem.dueTime ? 
          `${String(editingItem.dueTime.hours).padStart(2, '0')}:${String(editingItem.dueTime.minutes).padStart(2, '0')}` : '',
        maxPoints: editingItem.maxPoints || '',
        assigneeMode: editingItem.assigneeMode || 'ALL_STUDENTS',
        materials: editingItem.materials || [],
      });
      
      // Parse existing materials into attachments
      const parsedAttachments = (editingItem.materials || []).map((material: any) => {
        if (material.driveFile) {
          return {
            type: 'driveFile' as const,
            data: {
              id: material.driveFile.driveFile?.id || '',
              title: material.driveFile.driveFile?.title || '',
              shareMode: material.driveFile.shareMode || 'STUDENT_COPY'
            }
          };
        } else if (material.youtubeVideo) {
          return {
            type: 'youtubeVideo' as const,
            data: {
              id: material.youtubeVideo.id || '',
              title: material.youtubeVideo.title || '',
              alternateLink: material.youtubeVideo.alternateLink || ''
            }
          };
        } else if (material.link) {
          return {
            type: 'link' as const,
            data: {
              url: material.link.url || '',
              title: material.link.title || ''
            }
          };
        } else if (material.form) {
          return {
            type: 'form' as const,
            data: {
              formUrl: material.form.formUrl || '',
              responseUrl: material.form.responseUrl || '',
              title: material.form.title || ''
            }
          };
        }
        return null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);
      
      setAttachments(parsedAttachments);
    } else {
      // Reset form data for new items
      setFormData({
        title: '',
        description: '',
        state: 'PUBLISHED',
        dueDate: '',
        dueTime: '',
        maxPoints: '',
        assigneeMode: 'ALL_STUDENTS',
        materials: [],
      });
      setAttachments([]);
    }
  }, [editingItem]);

  // Attachment management functions
  const addAttachment = (type: 'driveFile' | 'youtubeVideo' | 'link' | 'form') => {
    const newAttachment = {
      type,
      data: type === 'driveFile' ? { id: '', title: '', shareMode: 'STUDENT_COPY' } :
            type === 'youtubeVideo' ? { id: '', title: '', alternateLink: '' } :
            type === 'link' ? { url: '', title: '' } :
            { formUrl: '', responseUrl: '', title: '' }
    };
    setAttachments([...attachments, newAttachment]);
  };

  const updateAttachment = (index: number, field: string, value: string) => {
    const updated = [...attachments];
    updated[index].data[field] = value;
    setAttachments(updated);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert attachments to materials format
      const materials = attachments.map(attachment => {
        switch (attachment.type) {
          case 'driveFile':
            return {
              driveFile: {
                driveFile: {
                  id: attachment.data.id,
                  title: attachment.data.title
                },
                shareMode: attachment.data.shareMode
              }
            };
          case 'youtubeVideo':
            return {
              youtubeVideo: {
                id: attachment.data.id,
                title: attachment.data.title,
                alternateLink: attachment.data.alternateLink
              }
            };
          case 'link':
            return {
              link: {
                url: attachment.data.url,
                title: attachment.data.title
              }
            };
          case 'form':
            return {
              form: {
                formUrl: attachment.data.formUrl,
                responseUrl: attachment.data.responseUrl,
                title: attachment.data.title
              }
            };
          default:
            return null;
        }
      }).filter(Boolean);

      const submitData = {
        type,
        title: formData.title,
        description: formData.description,
        state: formData.state,
        ...(type === 'assignment' && {
          dueDate: formData.dueDate ? `${formData.dueDate}T${formData.dueTime || '23:59'}:00` : undefined,
          maxPoints: formData.maxPoints ? parseFloat(String(formData.maxPoints)) : undefined,
          assigneeMode: formData.assigneeMode,
        }),
        materials,
      };

      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/classroom/courses/${courseId}/coursework/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          throw new Error('Failed to update item');
        }
      } else {
        // Create new item
        const response = await fetch(`/api/classroom/courses/${courseId}/coursework`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          throw new Error('Failed to create item');
        }
      }

      onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingItem ? 'Edit' : 'Add'} {type === 'assignment' ? 'Assignment' : 'Material'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and State Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                  placeholder={`Enter ${type} title`}
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black px-3 py-2"
                placeholder={`Enter ${type} description`}
              />
            </div>

            {type === 'assignment' && (
              <>
                {/* Due Date and Time Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Time
                    </label>
                    <input
                      type="time"
                      id="dueTime"
                      name="dueTime"
                      value={formData.dueTime}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                    />
                  </div>
                </div>

                {/* Max Points and Assignee Mode Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700 mb-2">
                      Max Points
                    </label>
                    <input
                      type="number"
                      id="maxPoints"
                      name="maxPoints"
                      value={formData.maxPoints}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                      placeholder="Enter max points"
                    />
                  </div>
                  <div>
                    <label htmlFor="assigneeMode" className="block text-sm font-medium text-gray-700 mb-2">
                      Assignee Mode
                    </label>
                    <select
                      id="assigneeMode"
                      name="assigneeMode"
                      value={formData.assigneeMode}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-10 px-3"
                    >
                      <option value="ALL_STUDENTS">All Students</option>
                      <option value="INDIVIDUAL_STUDENTS">Individual Students</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Attachments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Attachments
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => addAttachment('driveFile')}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    + Drive File
                  </button>
                  <button
                    type="button"
                    onClick={() => addAttachment('youtubeVideo')}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  >
                    + YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => addAttachment('link')}
                    className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                  >
                    + Link
                  </button>
                  <button
                    type="button"
                    onClick={() => addAttachment('form')}
                    className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                  >
                    + Form
                  </button>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-3">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {attachment.type === 'driveFile' ? 'Google Drive File' :
                           attachment.type === 'youtubeVideo' ? 'YouTube Video' :
                           attachment.type === 'link' ? 'Web Link' : 'Google Form'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {attachment.type === 'driveFile' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">File ID</label>
                            <input
                              type="text"
                              value={attachment.data.id}
                              onChange={(e) => updateAttachment(index, 'id', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-8 px-2 text-sm"
                              placeholder="Google Drive file ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={attachment.data.title}
                              onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-8 px-2 text-sm"
                              placeholder="File title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Share Mode</label>
                            <select
                              value={attachment.data.shareMode}
                              onChange={(e) => updateAttachment(index, 'shareMode', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-8 px-2 text-sm"
                            >
                              <option value="STUDENT_COPY">Make a copy for each student</option>
                              <option value="VIEW">Students can view file</option>
                              <option value="EDIT">Students can edit file</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {attachment.type === 'youtubeVideo' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Video ID</label>
                            <input
                              type="text"
                              value={attachment.data.id}
                              onChange={(e) => updateAttachment(index, 'id', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-black h-8 px-2 text-sm"
                              placeholder="YouTube video ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={attachment.data.title}
                              onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-black h-8 px-2 text-sm"
                              placeholder="Video title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Alternate Link</label>
                            <input
                              type="url"
                              value={attachment.data.alternateLink}
                              onChange={(e) => updateAttachment(index, 'alternateLink', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-black h-8 px-2 text-sm"
                              placeholder="https://youtube.com/watch?v=..."
                            />
                          </div>
                        </div>
                      )}

                      {attachment.type === 'link' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                            <input
                              type="url"
                              value={attachment.data.url}
                              onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black h-8 px-2 text-sm"
                              placeholder="https://example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={attachment.data.title}
                              onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-black h-8 px-2 text-sm"
                              placeholder="Link title"
                            />
                          </div>
                        </div>
                      )}

                      {attachment.type === 'form' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Form URL</label>
                            <input
                              type="url"
                              value={attachment.data.formUrl}
                              onChange={(e) => updateAttachment(index, 'formUrl', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-8 px-2 text-sm"
                              placeholder="https://forms.gle/..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Response URL</label>
                            <input
                              type="url"
                              value={attachment.data.responseUrl}
                              onChange={(e) => updateAttachment(index, 'responseUrl', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-8 px-2 text-sm"
                              placeholder="https://docs.google.com/spreadsheets/..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={attachment.data.title}
                              onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black h-8 px-2 text-sm"
                              placeholder="Form title"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingItem ? `Update ${type === 'assignment' ? 'Assignment' : 'Material'}` : `Create ${type === 'assignment' ? 'Assignment' : 'Material'}`)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
