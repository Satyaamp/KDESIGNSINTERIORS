const express = require('express');
const router = express.Router();

const { protect, checkPermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Import Controllers
const authController = require('../controllers/authController');
const serviceController = require('../controllers/serviceController');
const projectController = require('../controllers/projectController');
const blogController = require('../controllers/blogController');
const testimonialController = require('../controllers/testimonialController');
const teamController = require('../controllers/teamController');
const consultationController = require('../controllers/consultationController');
const contactController = require('../controllers/contactController');
const settingController = require('../controllers/settingController');
const cityController = require('../controllers/cityController');

// --- AUTH / USER PROFILE ROUTES ---
router.post('/auth/login', authController.login);
router.get('/auth/check-role/:username', authController.checkUsernameRole);
router.get('/auth/profile', protect, authController.getProfile);
router.put('/auth/profile', protect, upload.single('profilePicture'), authController.updateProfile);
router.put('/auth/change-password', protect, authController.changePassword);

// --- SUB-ADMINS ROLE MATRIX (SuperAdmin Only) ---
router.get('/auth/admins', protect, authController.getAdmins);
router.post('/auth/admins', protect, authController.createAdmin);
router.put('/auth/admins/:id', protect, authController.updateAdmin);
router.delete('/auth/admins/:id', protect, authController.deleteAdmin);

// --- SERVICES ROUTES ---
router.get('/services', serviceController.getServices);
router.get('/services/slug/:slug', serviceController.getServiceBySlug);
router.post('/services', protect, checkPermission('services_add'), upload.array('images', 10), serviceController.createService);
router.put('/services/:id', protect, checkPermission('services_edit'), upload.array('images', 10), serviceController.updateService);
router.delete('/services/:id', protect, checkPermission('services_delete'), serviceController.deleteService);

// --- PROJECT CATEGORY ROUTES ---
router.get('/project-categories', projectController.getProjectCategories);
router.post('/project-categories', protect, checkPermission('categories_add'), projectController.createProjectCategory);
router.put('/project-categories/:id', protect, checkPermission('categories_edit'), projectController.updateProjectCategory);
router.delete('/project-categories/:id', protect, checkPermission('categories_delete'), projectController.deleteProjectCategory);

// --- PROJECT ROUTES ---
router.get('/projects', projectController.getProjects);
router.get('/projects/slug/:slug', projectController.getProjectBySlug);
router.post('/projects', protect, checkPermission('projects_add'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'floorPlans', maxCount: 5 }
]), projectController.createProject);
router.put('/projects/:id', protect, checkPermission('projects_edit'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'floorPlans', maxCount: 5 }
]), projectController.updateProject);
router.delete('/projects/:id', protect, checkPermission('projects_delete'), projectController.deleteProject);

// --- BLOG CATEGORY ROUTES ---
router.get('/blog-categories', blogController.getBlogCategories);
router.post('/blog-categories', protect, checkPermission('categories_add'), blogController.createBlogCategory);
router.put('/blog-categories/:id', protect, checkPermission('categories_edit'), blogController.updateBlogCategory);
router.delete('/blog-categories/:id', protect, checkPermission('categories_delete'), blogController.deleteBlogCategory);

// --- BLOG ROUTES ---
router.get('/blogs', blogController.getBlogs);
router.get('/blogs/slug/:slug', blogController.getBlogBySlug);
router.post('/blogs', protect, checkPermission('blogs_add'), upload.array('images', 3), blogController.createBlog);
router.put('/blogs/:id', protect, checkPermission('blogs_edit'), upload.array('images', 3), blogController.updateBlog);
router.delete('/blogs/:id', protect, checkPermission('blogs_delete'), blogController.deleteBlog);

// --- TESTIMONIAL ROUTES ---
router.get('/testimonials', testimonialController.getTestimonials);
router.post('/testimonials', protect, checkPermission('testimonials_add'), upload.single('image'), testimonialController.createTestimonial);
router.put('/testimonials/:id', protect, checkPermission('testimonials_edit'), upload.single('image'), testimonialController.updateTestimonial);
router.delete('/testimonials/:id', protect, checkPermission('testimonials_delete'), testimonialController.deleteTestimonial);

// --- TEAM MEMBER ROUTES ---
router.get('/team', teamController.getTeamMembers);
router.post('/team', protect, checkPermission('team_add'), upload.single('image'), teamController.createTeamMember);
router.put('/team/:id', protect, checkPermission('team_edit'), upload.single('image'), teamController.updateTeamMember);
router.delete('/team/:id', protect, checkPermission('team'), teamController.deleteTeamMember);

// --- CONSULTATION ROUTES ---
router.post('/consultations', upload.fields([{ name: 'floorPlan', maxCount: 1 }, { name: 'images', maxCount: 5 }]), consultationController.createConsultation);
router.get('/consultations', protect, checkPermission('consultations_view'), consultationController.getConsultations);
router.put('/consultations/:id', protect, checkPermission('consultations_edit'), consultationController.updateConsultationStatus);
router.delete('/consultations/:id', protect, checkPermission('consultations_delete'), consultationController.deleteConsultation);

// --- CONTACT ROUTES ---
router.post('/contacts', contactController.createContact);
router.get('/contacts', protect, checkPermission('contacts_view'), contactController.getContacts);
router.put('/contacts/:id', protect, checkPermission('contacts_edit'), contactController.updateContactStatus);
router.delete('/contacts/:id', protect, checkPermission('contacts_delete'), contactController.deleteContact);

// --- SETTINGS ROUTES ---
router.get('/settings', settingController.getSettings);
router.put('/settings', protect, checkPermission('settings_edit'), upload.single('logo'), settingController.updateSettings);
router.post('/settings/send-otp', protect, checkPermission('settings_edit'), settingController.sendEmailVerificationOtp);
router.post('/settings/verify-otp', protect, checkPermission('settings_edit'), settingController.verifyEmailVerificationOtp);

// --- SERVING CITIES ROUTES ---
router.get('/cities', cityController.getCities);
router.post('/cities', protect, checkPermission('categories_add'), cityController.createCity);
router.put('/cities/:id', protect, checkPermission('categories_edit'), cityController.updateCity);
router.delete('/cities/:id', protect, checkPermission('categories_delete'), cityController.deleteCity);

module.exports = router;
