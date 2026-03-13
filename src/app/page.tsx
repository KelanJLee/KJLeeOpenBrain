'use client';

import { useState, useEffect } from 'react';
import { supabase, BrainEntry, BrainEntryInput } from '@/lib/supabase';

const CATEGORIES = [
  { id: 'memory', label: 'Knowledge', icon: '🧠' },
  { id: 'relationship', label: 'People', icon: '👥' },
  { id: 'project', label: 'Projects', icon: '📋' },
  { id: 'goal', label: 'Goals', icon: '🎯' },
  { id: 'idea', label: 'Ideas', icon: '💡' },
  { id: 'resource', label: 'Resources', icon: '📚' },
];

export default function Home() {
  const [entries, setEntries] = useState<BrainEntry[]>([]);
  const [allEntries, setAllEntries] = useState<BrainEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('memory');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<BrainEntryInput>({
    title: '',
    content: '',
    tags: [],
    category: 'memory',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchAllEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [selectedCategory, searchQuery, allEntries]);

  async function fetchAllEntries() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('brain_entries')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setAllEntries(data);
    }
    setIsLoading(false);
  }

  function filterEntries() {
    let filtered = allEntries;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.content?.toLowerCase().includes(query) ||
        e.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    setEntries(filtered);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: BrainEntryInput = {
      category: formData.category || 'memory',
      title: formData.title,
      content: formData.content || undefined,
      tags: formData.tags,
      metadata: {},
    };

    const { error } = await supabase.from('brain_entries').insert(entry);
    if (!error) {
      setFormData({ title: '', content: '', tags: [], category: 'memory' });
      setShowForm(false);
      fetchAllEntries();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('brain_entries').delete().eq('id', id);
    fetchAllEntries();
  }

  function addTag() {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Open Brain 🧠</h1>
        <p className="text-gray-600 mt-1">Your agent-readable knowledge base</p>
      </header>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search your brain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-brain-500 focus:border-brain-500"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-brain-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          📂 All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-brain-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full py-3 bg-brain-600 text-white rounded-lg font-medium hover:bg-brain-700 transition-colors mb-4"
      >
        {showForm ? '✕ Cancel' : '+ Add New Entry'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="brain-card mb-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded mb-3 text-lg font-medium"
            required
          />
          <textarea
            placeholder="Content..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded mb-3 min-h-[100px]"
          />
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="brain-tag flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-brain-600 text-white rounded hover:bg-brain-700"
          >
            Save Entry
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No entries match your search.' : 'No entries yet. Add your first one above!'}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="brain-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                  <span className="text-xs text-brain-600 bg-brain-100 px-2 py-0.5 rounded">
                    {CATEGORIES.find(c => c.id === entry.category)?.icon} {CATEGORIES.find(c => c.id === entry.category)?.label}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
              {entry.content && <p className="text-gray-600 whitespace-pre-wrap">{entry.content}</p>}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="brain-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Updated: {new Date(entry.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-12 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <h4 className="font-semibold mb-2">🤖 AI Agent Access</h4>
        <p>Your brain is accessible via API. See <code>/api/brain</code> endpoint.</p>
      </footer>
    </main>
  );
}
