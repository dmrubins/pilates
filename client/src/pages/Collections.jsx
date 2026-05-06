import { useState, useEffect, useCallback } from 'react';
import {
  getCollections, getCollection, createCollection,
  renameCollection, deleteCollection,
  addExercisesToCollection, removeExerciseFromCollection,
} from '../api/collections.js';
import { getExercises } from '../api/exercises.js';
import { ActiveWorkout } from '../components/ActiveWorkout.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// ─── List view ───────────────────────────────────────────────────────────────

function CollectionList({ onSelect, onCreate }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getCollections()
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const col = await createCollection(newName.trim());
      setNewName('');
      setShowNew(false);
      onCreate(col);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Collections</h1>
        <button
          onClick={() => setShowNew(v => !v)}
          className="text-accent-light text-sm border border-accent-glow px-3 py-1.5 rounded-lg hover:bg-accent-glow transition-colors"
        >
          + New
        </button>
      </div>

      {showNew && (
        <div className="card mb-4 flex flex-col gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Collection name…"
            className="w-full bg-bg-surface-2 text-text-primary placeholder-text-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowNew(false); setCreateError(null); }} className="btn-ghost flex-1 py-2 text-sm">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary flex-1 py-2 text-sm">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {!loading && collections.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-text-muted mb-1">No collections yet.</p>
          <p className="text-text-muted text-sm">Create one here or save a generated workout as a collection.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {collections.map(col => (
          <button
            key={col.id}
            onClick={() => onSelect(col.id)}
            className="card text-left w-full hover:ring-1 hover:ring-accent transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">{col.name}</span>
              <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-text-muted text-sm mt-0.5">
              {col.exercise_count} exercise{col.exercise_count !== 1 ? 's' : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Add exercises sub-view ──────────────────────────────────────────────────

function AddExercisesView({ collectionId, existingIds, onDone }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExercises()
      .then(list => setExercises(list.filter(e => !existingIds.includes(e.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [existingIds]);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = search.trim()
    ? exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    setError(null);
    try {
      await addExercisesToCollection(collectionId, selected);
      onDone();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onDone} className="text-text-muted text-sm hover:text-text-primary">
          ← Back
        </button>
        <h2 className="text-lg font-bold flex-1">Add Exercises</h2>
        {selected.length > 0 && (
          <button onClick={handleAdd} disabled={saving} className="btn-primary py-1.5 px-4 text-sm">
            {saving ? 'Adding…' : `Add ${selected.length}`}
          </button>
        )}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercises…"
        className="w-full bg-bg-surface-2 text-text-primary placeholder-text-muted rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {loading && <LoadingSpinner />}

      <div className="flex flex-col gap-2 pb-6">
        {filtered.map(ex => (
          <button
            key={ex.id}
            onClick={() => toggle(ex.id)}
            className={`card text-left w-full flex items-center gap-3 transition-all ${
              selected.includes(ex.id) ? 'ring-1 ring-accent bg-accent-glow' : 'hover:ring-1 hover:ring-accent/50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              selected.includes(ex.id) ? 'bg-accent border-accent' : 'border-text-muted/40'
            }`}>
              {selected.includes(ex.id) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary text-sm truncate">{ex.name}</p>
              <p className="text-text-muted text-xs">{ex.body_part || ''}{ex.difficulty ? ` · ${ex.difficulty}` : ''}</p>
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-6">No exercises found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function CollectionDetail({ collectionId, onBack, onStartWorkout }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('detail'); // 'detail' | 'add-exercises'
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getCollection(collectionId)
      .then(col => { setCollection(col); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      const updated = await renameCollection(collectionId, newName.trim());
      setCollection(prev => ({ ...prev, name: updated.name }));
      setRenaming(false);
      setNewName('');
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${collection?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCollection(collectionId);
      onBack();
    } catch {
      setDeleting(false);
    }
  };

  const handleRemoveExercise = async (exerciseId) => {
    setRemoving(exerciseId);
    try {
      await removeExerciseFromCollection(collectionId, exerciseId);
      setCollection(prev => ({
        ...prev,
        exercises: prev.exercises.filter(e => e.id !== exerciseId),
      }));
    } catch {}
    setRemoving(null);
  };

  if (view === 'add-exercises' && collection) {
    return (
      <AddExercisesView
        collectionId={collectionId}
        existingIds={collection.exercises.map(e => e.id)}
        onDone={() => { setView('detail'); load(); }}
      />
    );
  }

  if (loading) return <LoadingSpinner />;
  if (!collection) return <p className="text-red-400 text-sm">Collection not found.</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-text-muted text-sm hover:text-text-primary">
          ← Back
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">
          {renaming ? '' : collection.name}
        </h1>
      </div>

      {/* Rename inline */}
      {renaming ? (
        <div className="card mb-4 flex flex-col gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="w-full bg-bg-surface-2 text-text-primary rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex gap-2">
            <button onClick={() => setRenaming(false)} className="btn-ghost flex-1 py-2 text-sm">Cancel</button>
            <button onClick={handleRename} className="btn-primary flex-1 py-2 text-sm">Save</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setRenaming(true); setNewName(collection.name); }}
            className="text-text-muted text-xs hover:text-text-primary">
            Rename
          </button>
          <span className="text-text-muted/40">·</span>
          <button onClick={handleDelete} disabled={deleting}
            className="text-red-400 text-xs hover:text-red-300 disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}

      {/* Exercise count */}
      <p className="text-text-muted text-sm mb-4">
        {collection.exercises.length} exercise{collection.exercises.length !== 1 ? 's' : ''}
      </p>

      {/* Exercises */}
      {collection.exercises.length === 0 ? (
        <div className="card text-center py-8 mb-4">
          <p className="text-text-muted text-sm">No exercises yet. Add some below!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {collection.exercises.map(ex => (
            <div key={ex.id} className="relative">
              <ExerciseCard exercise={ex} />
              <button
                onClick={() => handleRemoveExercise(ex.id)}
                disabled={removing === ex.id}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 transition-colors disabled:opacity-50"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {collection.exercises.length > 0 && (
        <button onClick={() => onStartWorkout(collection)} className="btn-primary w-full py-3 text-base mb-3">
          ▶ Start Workout
        </button>
      )}
      <button onClick={() => setView('add-exercises')} className="btn-ghost w-full mb-6 text-sm">
        + Add Exercises
      </button>
    </div>
  );
}

// ─── Page root ───────────────────────────────────────────────────────────────

export default function Collections() {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'active'
  const [selectedId, setSelectedId] = useState(null);
  const [activeCollection, setActiveCollection] = useState(null);

  const handleSelect = (id) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleCreate = (col) => {
    setSelectedId(col.id);
    setView('detail');
  };

  const handleStartWorkout = (collection) => {
    setActiveCollection(collection);
    setView('active');
  };

  if (view === 'active' && activeCollection) {
    return (
      <ActiveWorkout
        exercises={activeCollection.exercises}
        sessionLabel={activeCollection.name}
        onFinish={() => setView('detail')}
        onExit={() => setView('detail')}
      />
    );
  }

  if (view === 'detail' && selectedId) {
    return (
      <CollectionDetail
        collectionId={selectedId}
        onBack={() => setView('list')}
        onStartWorkout={handleStartWorkout}
      />
    );
  }

  return (
    <CollectionList
      onSelect={handleSelect}
      onCreate={handleCreate}
    />
  );
}
