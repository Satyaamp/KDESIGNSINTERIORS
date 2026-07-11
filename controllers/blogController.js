const Blog = require('../models/Blog');
const BlogCategory = require('../models/BlogCategory');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');
const { makeUniqueSlug } = require('../utils/slugify');

// --- Blog Category CRUD ---

// @desc    Get all blog categories
// @route   GET /api/blog-categories
// @access  Public
const getBlogCategories = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    } else if (req.query.admin !== 'true') {
      filter.status = 'Active';
    }
    const categories = await BlogCategory.find(filter).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create blog category
// @route   POST /api/blog-categories
// @access  Private (Admin only)
const createBlogCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const slug = await makeUniqueSlug(BlogCategory, name);
    const category = await BlogCategory.create({ name, slug, status: status || 'Active' });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update blog category
// @route   PUT /api/blog-categories/:id
// @access  Private (Admin only)
const updateBlogCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (name && name !== category.name) {
      category.name = name;
      category.slug = await makeUniqueSlug(BlogCategory, name);
    }
    if (status) category.status = status;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete blog category
// @route   DELETE /api/blog-categories/:id
// @access  Private (Admin only)
const deleteBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const blogCount = await Blog.countDocuments({ category: category._id });
    if (blogCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category because it has blogs associated with it.'
      });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Blog CRUD ---

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else if (req.query.admin !== 'true') {
      filter.status = 'Active';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const blogs = await Blog.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
      
    const total = await Blog.countDocuments(filter);
    
    res.json({
      success: true,
      blogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get blog by slug
// @route   GET /api/blogs/slug/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new blog post
// @route   POST /api/blogs
// @access  Private (Admin only)
const createBlog = async (req, res) => {
  try {
    const { title, content, category, status, metaTitle, metaDescription, keywords } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one gallery image is required' });
    }
    
    const imageUploads = [];
    const filesToUpload = req.files.slice(0, 3);
    for (const file of filesToUpload) {
      const img = await uploadImage(file.path, 'blogs');
      imageUploads.push(img);
    }
    
    const primaryImage = imageUploads.length > 0 ? imageUploads[0] : { url: '', public_id: '' };
    const slug = await makeUniqueSlug(Blog, title);
    
    const blog = await Blog.create({
      title,
      slug,
      content,
      category,
      images: imageUploads,
      featuredImage: primaryImage,
      status: status || 'Active',
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || content.substring(0, 160).replace(/<[^>]*>/g, ''),
        keywords: keywords || ''
      }
    });
    
    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private (Admin only)
const updateBlog = async (req, res) => {
  try {
    const { title, content, category, status, metaTitle, metaDescription, keywords } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    if (title && title !== blog.title) {
      blog.title = title;
      blog.slug = await makeUniqueSlug(Blog, title);
    }
    
    if (content) blog.content = content;
    if (category) blog.category = category;
    if (status) blog.status = status;
    
    // Handle existing images management
    const { keepExistingImages } = req.body;
    let keptImageIds = [];
    if (keepExistingImages) {
      try {
        keptImageIds = typeof keepExistingImages === 'string' ? JSON.parse(keepExistingImages) : keepExistingImages;
      } catch (e) {
        keptImageIds = keepExistingImages.split(',');
      }
    } else {
      // Default to keeping all current images
      keptImageIds = (blog.images || []).map(img => img.public_id);
      if (keptImageIds.length === 0 && blog.featuredImage && blog.featuredImage.public_id) {
        keptImageIds.push(blog.featuredImage.public_id);
      }
    }

    // Identify which current images need to be deleted from Cloudinary
    const currentImages = blog.images && blog.images.length > 0
      ? blog.images
      : (blog.featuredImage && blog.featuredImage.public_id ? [blog.featuredImage] : []);

    const imagesToDelete = currentImages.filter(img => !keptImageIds.includes(img.public_id));
    for (const img of imagesToDelete) {
      if (img.public_id) {
        await deleteImage(img.public_id);
      }
    }

    // Base of updated images list
    const updatedImages = currentImages.filter(img => keptImageIds.includes(img.public_id));

    // Upload and append new files (ensuring total doesn't exceed 3)
    if (req.files && req.files.length > 0) {
      const slotsAvailable = 3 - updatedImages.length;
      if (slotsAvailable > 0) {
        const filesToUpload = req.files.slice(0, slotsAvailable);
        for (const file of filesToUpload) {
          const img = await uploadImage(file.path, 'blogs');
          updatedImages.push(img);
        }
      }
    }

    blog.images = updatedImages;
    blog.featuredImage = updatedImages.length > 0 ? updatedImages[0] : { url: '', public_id: '' };
    
    blog.seo = {
      metaTitle: metaTitle || blog.seo.metaTitle || blog.title,
      metaDescription: metaDescription || blog.seo.metaDescription || content.substring(0, 160).replace(/<[^>]*>/g, ''),
      keywords: keywords || blog.seo.keywords || ''
    };
    
    await blog.save();
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    // Clean up all blog images from Cloudinary
    if (blog.images && blog.images.length > 0) {
      for (const img of blog.images) {
        if (img.public_id) {
          await deleteImage(img.public_id);
        }
      }
    } else if (blog.featuredImage && blog.featuredImage.public_id) {
      await deleteImage(blog.featuredImage.public_id);
    }
    
    await blog.deleteOne();
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog
};
