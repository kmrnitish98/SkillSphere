import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Assessment from '../models/Assessment.js';
import { uploadFromBuffer } from '../utils/cloudinaryUpload.js';
import PDFDocument from 'pdfkit';

// ── Redis Cache Integration ──────────────────────────────
import { getCache, setCache, deleteCache, deleteCachePattern } from '../services/cacheService.js';
import { publish, CHANNELS } from '../services/pubsubService.js';

// ── Cache Key Constants ──────────────────────────────────
// Centralized key naming ensures consistent cache invalidation
const CACHE_KEYS = {
  ALL_COURSES: 'courses:all',                          // All published courses list
  COURSE_BY_ID: (id) => `courses:${id}`,               // Single course by ID
  COURSE_CURRICULUM: (id) => `courses:${id}:curriculum`,// Course curriculum
};

// @desc    Create a course
// @route   POST /api/v1/courses
// @access  Private/Mentor
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, price, status } = req.body;
    let thumbnailUrl = 'https://via.placeholder.com/150'; // Default

    // If file uploaded for thumbnail
    if (req.file) {
      console.log('--- Uploading Thumbnail ---');
      console.log('API_KEY present?', !!process.env.CLOUDINARY_API_KEY);
      console.log('API_SECRET present?', !!process.env.CLOUDINARY_API_SECRET);

      const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/thumbnails');
      thumbnailUrl = result.secure_url;
    }

    const course = await Course.create({
      title,
      description,
      category,
      mentor: req.user._id,
      price,
      status: status || 'draft',
      thumbnailUrl,
    });

    // ── CACHE INVALIDATION ──────────────────────────────
    // Invalidate the "all courses" cache since a new course was added
    await deleteCachePattern('courses:*');

    // ── PUB/SUB: Broadcast course creation event ────────
    await publish(CHANNELS.COURSE_UPDATE, {
      action: 'created',
      courseId: course._id,
      title: course.title,
      mentor: req.user._id,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all published courses
// @route   GET /api/v1/courses
// @access  Public
export const getCourses = async (req, res) => {
  try {
    // Basic search/filter functionality
    const query = { status: 'published' };
    if (req.query.keyword) {
      query.title = { $regex: req.query.keyword, $options: 'i' };
    }

    // ── CACHE: Build a unique cache key including search params ──
    const cacheKey = req.query.keyword
      ? `courses:search:${req.query.keyword.toLowerCase()}`
      : CACHE_KEYS.ALL_COURSES;

    // Try to serve from Redis cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    // Cache MISS — fetch from MongoDB
    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const courses = await Course.find(query).populate('mentor', 'name email');
    const response = { success: true, count: courses.length, data: courses };

    // Store in Redis cache (TTL: 10 minutes for course listings)
    await setCache(cacheKey, response, 600);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get course by ID
// @route   GET /api/v1/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.COURSE_BY_ID(req.params.id);

    // ── CACHE: Try Redis first ──────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const course = await Course.findById(req.params.id)
      .populate('mentor', 'name email')

    if (course) {
      const response = { success: true, data: course };
      // Cache single course for 30 minutes
      await setCache(cacheKey, response, 1800);
      res.json(response);
    } else {
      res.status(404).json({ success: false, message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private/Mentor
export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // ── CACHE INVALIDATION ──────────────────────────────
    // Invalidate this specific course AND the all-courses listing
    await deleteCache(CACHE_KEYS.COURSE_BY_ID(req.params.id));
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(req.params.id));
    await deleteCachePattern('courses:all*');
    await deleteCachePattern('courses:search:*');

    // ── PUB/SUB: Broadcast course update event ──────────
    await publish(CHANNELS.COURSE_UPDATE, {
      action: 'updated',
      courseId: req.params.id,
      title: course.title,
    });

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private/Admin/Mentor
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Check if user is mentor of the course or an admin
    if (course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete' });
    }

    await course.deleteOne();

    // ── CACHE INVALIDATION ──────────────────────────────
    // Wipe all course-related caches when a course is deleted
    await deleteCachePattern('courses:*');

    // ── PUB/SUB: Broadcast course deletion event ────────
    await publish(CHANNELS.COURSE_UPDATE, {
      action: 'deleted',
      courseId: req.params.id,
    });

    res.json({ success: true, message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add section to course
// @route   POST /api/v1/courses/:courseId/sections
// @access  Private/Mentor
export const addSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const section = await Section.create({ course: courseId, title, order });

    // ── CACHE INVALIDATION: Curriculum changed ──────────
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(courseId));
    await deleteCache(CACHE_KEYS.COURSE_BY_ID(courseId));

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update section
// @route   PUT /api/v1/sections/:id
// @access  Private/Mentor
export const updateSection = async (req, res) => {
  try {
    const { title, order } = req.body;
    let section = await Section.findById(req.params.id).populate('course');
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    if (section.course.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const courseId = section.course._id;
    section = await Section.findByIdAndUpdate(req.params.id, { title, order }, { new: true });

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(courseId));

    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete section
// @route   DELETE /api/v1/sections/:id
// @access  Private/Mentor
export const deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('course');
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    if (section.course.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const courseId = section.course._id;

    await section.deleteOne();
    // Also delete associated lessons
    await Lesson.deleteMany({ section: req.params.id });

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(courseId));

    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Add lesson to section
// @route   POST /api/v1/sections/:sectionId/lessons
// @access  Private/Mentor
export const addLesson = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, type, content, order, duration, videoUrl: reqVideoUrl } = req.body;

    const section = await Section.findById(sectionId).populate('course');
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

    let videoUrl = reqVideoUrl || '';
    let pdfUrl = '';

    if (req.file) {
      if (type === 'video') {
        const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/lessons', { resource_type: 'video' });
        videoUrl = result.secure_url;
      }
      if (type === 'pdf') {
        const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/lessons', { 
          resource_type: 'raw',
          public_id: `${Date.now()}_note.pdf`
        });
        pdfUrl = result.secure_url;
      }
    }

    const lesson = await Lesson.create({
      section: sectionId,
      title,
      type,
      content,
      order,
      duration: duration || 0,
      videoUrl,
      pdfUrl
    });

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(section.course._id));

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lesson
// @route   PUT /api/v1/lessons/:id
// @access  Private/Mentor
export const updateLesson = async (req, res) => {
  try {
    const { title, type, content, order, duration, videoUrl: reqVideoUrl } = req.body;
    let lesson = await Lesson.findById(req.params.id).populate({
      path: 'section',
      populate: { path: 'course' }
    });

    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    if (lesson.section.course.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let videoUrl = reqVideoUrl || lesson.videoUrl;
    let pdfUrl = lesson.pdfUrl;

    if (req.file) {
      if (type === 'video') {
        const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/lessons', { resource_type: 'video' });
        videoUrl = result.secure_url;
      }
      if (type === 'pdf') {
        const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/lessons', { 
          resource_type: 'raw',
          public_id: `${Date.now()}_note.pdf`
        });
        pdfUrl = result.secure_url;
      }
    }

    const courseId = lesson.section.course._id;

    lesson = await Lesson.findByIdAndUpdate(req.params.id, {
      title, type, content, order, duration, videoUrl, pdfUrl
    }, { new: true });

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(courseId));

    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add quiz/assignment/test
// @route   POST /api/v1/sections/:sectionId/assessments
// @access  Private/Mentor
export const addAssessment = async (req, res) => {
  try {
    const { sectionId } = req.params;
    // For quizzes: 'content' is stringified JSON questions.
    // For assignments: 'content' is pure text (theory) if no file is uploaded.
    const { title, type, content, passingScore, courseId, timeLimit } = req.body;

    let finalTimeLimit = timeLimit;
    let parsedContent = null;
    let pdfUrl = '';

    // Handle Quiz / Final Test formats
    if (type === 'quiz' || type === 'final_test') {
      if (type === 'final_test' && !finalTimeLimit && content) {
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        finalTimeLimit = parsedContent.length; // 1 min per question
      }
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    }

    // Handle Assignment Formats
    if (type === 'assignment') {
      if (req.file) {
        // Direct PDF file upload
        const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/assignments', { 
          resource_type: 'raw',
          public_id: `${Date.now()}_assignment.pdf`
        });
        pdfUrl = result.secure_url;
      } else if (content && content.trim() !== '') {
        // Mentor wrote theory text directly; compute a PDF document dynamically
        const pdfBuffer = await new Promise((resolve, reject) => {
          const doc = new PDFDocument({ margin: 50 });
          const buffers = [];
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => resolve(Buffer.concat(buffers)));
          doc.on('error', reject);

          doc.fontSize(20).text(`Assignment - ${title}`, { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(content);
          doc.end();
        });

        // Push buffer to Cloudinary
        const result = await uploadFromBuffer(pdfBuffer, 'skillsphere/assignments', { 
          resource_type: 'raw',
          public_id: `${Date.now()}_assignment.pdf`
        });
        pdfUrl = result.secure_url;
      }
    }

    const assessment = await Assessment.create({
      course: courseId,
      section: sectionId === 'null' ? null : sectionId, // null if it's the Final Test
      title,
      type,
      content: parsedContent,
      passingScore,
      timeLimit: finalTimeLimit,
      pdfUrl
    });

    // ── CACHE INVALIDATION ──────────────────────────────
    if (courseId) {
      await deleteCache(CACHE_KEYS.COURSE_CURRICULUM(courseId));
    }

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete course curriculum
// @route   GET /api/v1/courses/:id/curriculum
// @access  Public
export const getCourseCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CACHE_KEYS.COURSE_CURRICULUM(id);

    // ── CACHE: Try Redis first ──────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const sections = await Section.find({ course: id }).sort({ order: 1 }).lean();
    const sectionIds = sections.map(s => s._id);

    const lessons = await Lesson.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean();
    const assessments = await Assessment.find({ course: id }).lean();

    // Attach lessons and section-level assessments to each section
    const formattedSections = sections.map(sec => {
      const secId = sec._id.toString();
      return {
        ...sec,
        lessons: lessons.filter(l => l.section && l.section.toString() === secId),
        assessments: assessments.filter(a => a.section && a.section.toString() === secId)
      };
    });

    // Extract Course-level Final Test (no section assigned)
    const finalTest = assessments.find(a => a.type === 'final_test' && !a.section);

    const response = { success: true, data: { sections: formattedSections, finalTest } };

    // Cache curriculum for 30 minutes
    await setCache(cacheKey, response, 1800);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
