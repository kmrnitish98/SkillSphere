import { useState } from 'react';
import { createCourse } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaImage } from 'react-icons/fa';

const CreateCourse = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setThumbnail(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('status', 'published');
      if (thumbnail) formData.append('thumbnail', thumbnail);

      await createCourse(formData);
      toast.success('Course created!');
      navigate('/mentor/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Course</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details to publish your course</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-green-50 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Course Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. React Masterclass" className="w-full bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 outline-none focus:border-green-400 transition-colors text-sm" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what students will learn..." rows={4} className="w-full bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 outline-none focus:border-green-400 transition-colors text-sm resize-none" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 outline-none focus:border-green-400 transition-colors text-sm" required>
            <option value="" disabled>Select a category</option>
            <option value="Web Development">Web Development</option>
            <option value="Data Science">Data Science</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Design">Design</option>
            <option value="Business">Business</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Price (₹)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="499" className="w-full bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 outline-none focus:border-green-400 transition-colors text-sm" required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Thumbnail</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-green-200 rounded-2xl cursor-pointer hover:border-green-400 transition-colors bg-green-50/30 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <FaCloudUploadAlt className="text-3xl text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to upload thumbnail</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <button type="submit" disabled={loading} className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
          {loading ? 'Creating...' : 'Publish Course'}
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;
