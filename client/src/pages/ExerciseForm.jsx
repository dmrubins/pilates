import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExercise, createExercise, updateExercise } from '../api/exercises.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const EMPTY = {
  name: '', body_part: '', difficulty: 'Easy',
  duration_minutes: '', sets: '', reps: '', steps: [''], description: '',
};

export default function ExerciseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [fields, setFields] = useState(EMPTY);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photosToRemove, setPhotosToRemove] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    getExercise(id)
      .then((ex) => {
        const rawSteps = (ex.instructions || '').split('\n').map(s => s.trim()).filter(Boolean);
        setFields({
          name: ex.name || '',
          body_part: ex.body_part || '',
          difficulty: ex.difficulty || 'Easy',
          duration_minutes: ex.duration_minutes != null ? String(ex.duration_minutes) : '',
          sets: ex.sets || '',
          reps: ex.reps || '',
          steps: rawSteps.length ? rawSteps : [''],
          description: ex.description || '',
        });
        let photos = [];
        try { photos = JSON.parse(ex.photo_filenames || '[]'); } catch {}
        setExistingPhotos(photos);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key, val) => setFields((f) => ({ ...f, [key]: val }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotoFiles((prev) => [...prev, ...files]);
    setNewPhotoPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeExisting = (filename) => {
    setExistingPhotos((p) => p.filter((f) => f !== filename));
    setPhotosToRemove((p) => [...p, filename]);
  };

  const removeNew = (idx) => {
    URL.revokeObjectURL(newPhotoPreviews[idx]);
    setNewPhotoFiles((p) => p.filter((_, i) => i !== idx));
    setNewPhotoPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);

    const data = {
      name: fields.name.trim(),
      body_part: fields.body_part.trim() || '',
      difficulty: fields.difficulty,
      ease_level: fields.difficulty === 'Easy' ? 2 : fields.difficulty === 'Hard' ? 4 : 3,
      duration_minutes: fields.duration_minutes ? fields.duration_minutes : '',
      sets: fields.sets.trim(),
      reps: fields.reps.trim(),
      instructions: fields.steps.map(s => s.trim()).filter(Boolean).join('\n'),
      description: fields.description.trim(),
    };

    try {
      if (isEdit) {
        await updateExercise(id, data, newPhotoFiles, photosToRemove);
        navigate(`/exercises/${id}`);
      } else {
        const created = await createExercise(data, newPhotoFiles);
        navigate(`/exercises/${created.id}`);
      }
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Edit Exercise' : 'New Exercise'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-text-muted mb-1">Name *</label>
          <input className="input" value={fields.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm text-text-muted mb-2">Photos</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {existingPhotos.map((filename) => (
              <div key={filename} className="relative w-20 h-20">
                <img src={`/images/${filename}`} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeExisting(filename)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
            {newPhotoPreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg opacity-75 ring-2 ring-accent" />
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-accent-glow text-text-muted flex items-center justify-center hover:border-accent transition-colors text-2xl"
            >+</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Two-col row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text-muted mb-1">Difficulty</label>
            <select className="input" value={fields.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Duration (min)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 10"
              value={fields.duration_minutes}
              onChange={(e) => set('duration_minutes', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text-muted mb-1">Sets</label>
            <input className="input" placeholder="e.g. 3" value={fields.sets} onChange={(e) => set('sets', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Reps</label>
            <input className="input" placeholder="e.g. 12" value={fields.reps} onChange={(e) => set('reps', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">Body Part</label>
          <input className="input" placeholder="e.g. Core, Glutes, Arms…" value={fields.body_part} onChange={(e) => set('body_part', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Instructions</label>
          <div className="space-y-2">
            {fields.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-glow text-accent-light text-xs flex items-center justify-center mt-2.5">{i + 1}</span>
                <textarea
                  className="input resize-none flex-1"
                  rows={2}
                  placeholder={`Step ${i + 1}…`}
                  value={step}
                  onChange={(e) => {
                    const updated = [...fields.steps];
                    updated[i] = e.target.value;
                    set('steps', updated);
                  }}
                />
                {fields.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set('steps', fields.steps.filter((_, j) => j !== i))}
                    className="mt-2 text-text-muted hover:text-red-400 text-lg leading-none"
                  >×</button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('steps', [...fields.steps, ''])}
            className="mt-2 text-sm text-accent hover:text-accent-light"
          >+ Add step</button>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">Description (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={fields.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pb-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create exercise'}
          </button>
        </div>
      </form>
    </div>
  );
}
