$(document).ready(function () {
  // Global Settings and Dynamic Branding Initialization
  loadGlobalSettings();
  loadDynamicFooterCities();

  // Scroll Header Effect
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $('header').addClass('scrolled');
    } else {
      $('header').removeClass('scrolled');
    }
  });

  // Mobile Menu Toggle
  $('.nav-toggle').click(function () {
    $(this).toggleClass('open');
    $('nav').toggleClass('open');
  });

  // Close Mobile Menu on Link Click
  $('nav a').click(function () {
    $('.nav-toggle').removeClass('open');
    $('nav').removeClass('open');
  });

  // Form Submissions
  setupFormSubmissions();

  // Page Specific Routes
  const path = window.location.pathname;

  if (path.includes('index') || path === '/' || path.endsWith('/')) {
    initHomePage();
  } else if (path.includes('about')) {
    initAboutPage();
  } else if (path.includes('service-details')) {
    initServiceDetailsPage();
  } else if (path.includes('services')) {
    initServicesPage();
  } else if (path.includes('portfolio')) {
    initPortfolioPage();
  } else if (path.includes('project-details')) {
    initProjectDetailsPage();
  } else if (path.includes('blogs')) {
    initBlogsPage();
  } else if (path.includes('blog-details')) {
    initBlogDetailsPage();
  }
});

// --- Dynamic Settings & Global Layout Seeding ---
function loadGlobalSettings() {
  $.ajax({
    url: '/api/settings',
    method: 'GET',
    success: function (res) {
      if (res.success && res.settings) {
        const settings = res.settings;

        // Render branding items
        document.title = settings.siteName;
        $('.site-title-text').text(settings.siteName);

        if (settings.logo && settings.logo.url) {
          $('.logo-container').html(`<img src="${settings.logo.url}" alt="${settings.siteName}">`);
        } else {
          $('.logo-container').html(`<span>${settings.siteName}</span>`);
        }

        // Render contact points
        $('.contact-phone-text').text(settings.contactPhone).attr('href', `tel:${settings.contactPhone}`);
        $('.contact-email-text').text(settings.contactEmail).attr('href', `mailto:${settings.contactEmail}`);
        $('.contact-address-text').text(settings.address);

        // WhatsApp link
        if (settings.whatsappNumber) {
          const cleanWa = settings.whatsappNumber.replace(/[^0-9]/g, '');
          $('.whatsapp-btn').attr('href', `https://wa.me/${cleanWa}?text=Hi%20K.DESIGNS%20%26%20INTERIORS%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`);
        }

        // Social Links
        if (settings.socialLinks) {
          if (settings.socialLinks.facebook) $('.facebook-link').attr('href', settings.socialLinks.facebook).show();
          if (settings.socialLinks.instagram) $('.instagram-link').attr('href', settings.socialLinks.instagram).show();
          if (settings.socialLinks.linkedin) $('.linkedin-link').attr('href', settings.socialLinks.linkedin).show();
          if (settings.socialLinks.youtube) $('.youtube-link').attr('href', settings.socialLinks.youtube).show();
        }

        // Google Map Frame
        if (settings.googleMapUrl && $('#google-map-iframe').length) {
          $('#google-map-iframe').attr('src', settings.googleMapUrl);
        }

        // Floating Call/WhatsApp setup
        setupFloatingButtons(settings);
      }
    },
    error: function (err) {
      console.error('Failed to load website settings:', err);
    }
  });
}

function loadDynamicFooterCities() {
  $.get('/api/cities?status=Active', function (res) {
    if (res.success && res.cities && res.cities.length) {
      let footerLinks = '';
      res.cities.forEach(city => {
        footerLinks += `<li>${city.name}</li>`;
      });

      // Find the UL that follows "Service Areas" header inside footer
      $('footer h3').each(function () {
        if ($(this).text().trim() === 'Service Areas') {
          $(this).next('ul').html(footerLinks);
        }
      });
    }
  });
}

function setupFloatingButtons(settings) {
  if ($('.floating-actions').length === 0) {
    const cleanWa = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '';
    const floatHtml = `
      <div class="floating-actions">
        ${cleanWa ? `<a href="https://wa.me/${cleanWa}?text=Hello!%20I'm%20interested%20in%20architectural/interior%20consultation." class="float-btn float-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>` : ''}
        ${settings.contactPhone ? `<a href="tel:${settings.contactPhone}" class="float-btn float-call"><i class="fas fa-phone-alt"></i></a>` : ''}
      </div>
    `;
    $('body').append(floatHtml);
  }
}

// --- Home Page Module ---
function initHomePage() {
  // 1. Hero banner slider
  initHeroSlider();

  // 2. Fetch Featured Services
  $.get('/api/services?limit=6', function (res) {
    if (res.success && res.services.length) {
      let cardsHtml = '';
      res.services.forEach(service => {
        const imageUrl = (service.images && service.images.length > 0 && service.images[0].url)
          ? service.images[0].url
          : (service.image && service.image.url ? service.image.url : '');

        const bgStyle = imageUrl
          ? `style="background-image: linear-gradient(rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.88)), url('${imageUrl}'); background-size: cover; background-position: center;"`
          : '';

        cardsHtml += `
          <div class="service-card" ${bgStyle}>
            <div class="service-icon"><i class="fas fa-home"></i></div>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <a href="/service-details?slug=${service.slug}" target="_blank" class="service-link">Read More <i class="fas fa-arrow-right"></i></a>
          </div>
        `;
      });
      $('#home-services-grid').html(cardsHtml);
    }
  });

  // 3. Fetch Featured Projects
  $.get('/api/projects?limit=6', function (res) {
    if (res.success && res.projects.length) {
      let projectsHtml = '';
      res.projects.forEach(project => {
        const coverImage = project.images && project.images[0] ? project.images[0].url : 'https://placehold.co/600x450';
        projectsHtml += `
          <div class="portfolio-item">
            <img class="portfolio-img" src="${coverImage}" alt="${project.title}">
            <div class="portfolio-overlay">
              <span class="portfolio-cat">${project.category ? project.category.name : ''}</span>
              <h3>${project.title}</h3>
              <a href="/project-details?slug=${project.slug}" class="portfolio-view-btn"><i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        `;
      });
      $('#home-portfolio-grid').html(projectsHtml);
    }
  });

  // 4. Fetch Testimonials
  $.get('/api/testimonials?status=Active', function (res) {
    if (res.success && res.testimonials.length) {
      let slidesHtml = '';
      res.testimonials.forEach((testimonial, index) => {
        let stars = '';
        for (let i = 0; i < testimonial.rating; i++) {
          stars += '<i class="fas fa-star"></i>';
        }
        const imgUrl = testimonial.image && testimonial.image.url ? testimonial.image.url : 'https://placehold.co/100x100';
        slidesHtml += `
          <div class="testimonial-slide ${index === 0 ? 'active' : ''}">
            <div class="testimonial-stars">${stars}</div>
            <blockquote>"${testimonial.review}"</blockquote>
            <div class="testimonial-author">
              <img src="${imgUrl}" alt="${testimonial.name}">
              <div class="author-info">
                <h4>${testimonial.name}</h4>
                <span>${testimonial.designation}</span>
              </div>
            </div>
          </div>
        `;
      });
      $('#testimonials-container').html(slidesHtml);
      setupTestimonialSlider();
    }
  });

  // 5. Fetch Latest Blogs
  $.get('/api/blogs?limit=3', function (res) {
    if (res.success && res.blogs.length) {
      let blogsHtml = '';
      res.blogs.forEach(blog => {
        const date = new Date(blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const imgUrl = blog.featuredImage && blog.featuredImage.url ? blog.featuredImage.url : 'https://placehold.co/600x400';
        blogsHtml += `
          <div class="blog-card">
            <div class="blog-thumb">
              <img src="${imgUrl}" alt="${blog.title}">
            </div>
            <div class="blog-body">
              <div class="blog-meta">
                <span><i class="far fa-calendar-alt"></i> ${date}</span>
                <span><i class="far fa-folder"></i> ${blog.category ? blog.category.name : 'General'}</span>
              </div>
              <h3><a href="/blog-details?slug=${blog.slug}">${blog.title}</a></h3>
              <p class="blog-excerpt">${blog.content.replace(/<[^>]*>/g, '')}</p>
              <a href="/blog-details?slug=${blog.slug}" class="service-link">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        `;
      });
      $('#home-blogs-grid').html(blogsHtml);
    }
  });
}

function initHeroSlider() {
  const slides = $('.hero-slide');
  if (slides.length === 0) return;

  let currentSlide = 0;

  function nextSlide() {
    slides.eq(currentSlide).removeClass('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides.eq(currentSlide).addClass('active');
  }

  // Set first active
  slides.eq(0).addClass('active');
  setInterval(nextSlide, 5000);
}

function setupTestimonialSlider() {
  let current = 0;
  const slides = $('.testimonial-slide');
  if (slides.length <= 1) return;

  $('.arrow-next').click(function () {
    slides.eq(current).removeClass('active');
    current = (current + 1) % slides.length;
    slides.eq(current).addClass('active');
  });

  $('.arrow-prev').click(function () {
    slides.eq(current).removeClass('active');
    current = (current - 1 + slides.length) % slides.length;
    slides.eq(current).addClass('active');
  });

  // Auto scroll
  setInterval(function () {
    slides.eq(current).removeClass('active');
    current = (current + 1) % slides.length;
    slides.eq(current).addClass('active');
  }, 6000);
}

// --- About Page Module ---
function initAboutPage() {
  // Fetch Team members
  $.get('/api/team?status=Active', function (res) {
    if (res.success && res.teamMembers.length) {
      let teamHtml = '';
      res.teamMembers.forEach(member => {
        const imgUrl = member.image && member.image.url ? member.image.url : 'https://placehold.co/400x500';
        teamHtml += `
          <div class="blog-card" style="border:none;">
            <div class="blog-thumb" style="height:350px;">
              <img src="${imgUrl}" alt="${member.name}" style="height:100%; object-fit:cover;">
            </div>
            <div class="blog-body text-center" style="padding: 20px 10px;">
              <h3 style="font-size:1.3rem; margin-bottom:5px;">${member.name}</h3>
              <p style="color:var(--accent-dark); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">${member.designation}</p>
              <div class="social-links" style="justify-content:center; margin-top:10px;">
                ${member.socialLinks.facebook ? `<a href="${member.socialLinks.facebook}" class="social-btn" target="_blank"><i class="fab fa-facebook-f"></i></a>` : ''}
                ${member.socialLinks.instagram ? `<a href="${member.socialLinks.instagram}" class="social-btn" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                ${member.socialLinks.linkedin ? `<a href="${member.socialLinks.linkedin}" class="social-btn" target="_blank"><i class="fab fa-linkedin-in"></i></a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      $('#team-grid').html(teamHtml);
    }
  });
}

// --- Services Page Module ---
function initServicesPage() {
  $.get('/api/services?limit=100', function (res) {
    if (res.success && res.services.length) {
      let servicesHtml = '';
      res.services.forEach(service => {
        const imageUrl = (service.images && service.images.length > 0 && service.images[0].url)
          ? service.images[0].url
          : (service.image && service.image.url ? service.image.url : '');

        const bgStyle = imageUrl
          ? `style="background-image: linear-gradient(rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.88)), url('${imageUrl}'); background-size: cover; background-position: center;"`
          : '';

        servicesHtml += `
          <div class="service-card" ${bgStyle}>
            <div class="service-icon"><i class="fas fa-home"></i></div>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <a href="/service-details?slug=${service.slug}" target="_blank" class="service-link">Read More <i class="fas fa-arrow-right"></i></a>
          </div>
        `;
      });
      $('#all-services-grid').html(servicesHtml);
    }
  });
}

// --- Portfolio Page Module ---
let currentPortfolioPage = 1;
const portfolioLimit = 9;
let currentPortfolioCategory = 'all';
let currentPortfolioCity = '';

function initPortfolioPage() {
  const urlParams = new URLSearchParams(window.location.search);
  currentPortfolioCity = urlParams.get('city') || '';

  // 1. Fetch Categories
  $.get('/api/project-categories?status=Active', function (res) {
    if (res.success && res.categories.length) {
      let filterButtons = '<button class="filter-btn active" data-filter="all">All Projects</button>';
      res.categories.forEach(cat => {
        filterButtons += `<button class="filter-btn" data-filter="${cat._id}">${cat.name}</button>`;
      });
      $('#portfolio-filters').html(filterButtons);

      // Category filter binding
      $('#portfolio-filters').off('click', '.filter-btn').on('click', '.filter-btn', function () {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentPortfolioCategory = $(this).attr('data-filter');
        currentPortfolioPage = 1;
        $('#portfolio-grid').empty();
        loadPortfolioProjects(currentPortfolioCategory, currentPortfolioPage, currentPortfolioCity);
      });
    }
  });

  // 2. Load More click binding
  $('#btn-portfolio-load-more').off('click').on('click', function (e) {
    e.preventDefault();
    currentPortfolioPage++;
    loadPortfolioProjects(currentPortfolioCategory, currentPortfolioPage, currentPortfolioCity);
  });

  // 3. Initial projects load
  currentPortfolioPage = 1;
  loadPortfolioProjects('all', 1, currentPortfolioCity);
}

function loadPortfolioProjects(categoryFilter, page = 1, cityFilter = '') {
  let url = `/api/projects?status=Active&limit=${portfolioLimit}&page=${page}`;
  if (categoryFilter && categoryFilter !== 'all') {
    url += `&category=${categoryFilter}`;
  }
  if (cityFilter) {
    url += `&location=${encodeURIComponent(cityFilter)}`;
  }

  $.get(url, function (res) {
    if (res.success) {
      if (page === 1 && (!res.projects || res.projects.length === 0)) {
        $('#portfolio-grid').html('<div class="text-center" style="grid-column: 1/-1; padding: 40px;">No projects found in this category.</div>');
        $('#portfolio-load-more-container').hide();
        return;
      }

      let projectsHtml = '';
      res.projects.forEach(project => {
        const coverImage = project.images && project.images[0] ? project.images[0].url : 'https://placehold.co/600x450';
        projectsHtml += `
          <div class="portfolio-item">
            <img class="portfolio-img" src="${coverImage}" alt="${project.title}">
            <div class="portfolio-overlay">
              <span class="portfolio-cat">${project.category ? project.category.name : ''}</span>
              <h3>${project.title}</h3>
              <a href="/project-details?slug=${project.slug}" class="portfolio-view-btn"><i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        `;
      });

      if (page === 1) {
        $('#portfolio-grid').html(projectsHtml);
      } else {
        $('#portfolio-grid').append(projectsHtml);
      }

      // Handle button visibility
      if (res.pagination && res.pagination.page < res.pagination.pages) {
        $('#portfolio-load-more-container').show();
      } else {
        $('#portfolio-load-more-container').hide();
      }
    }
  });
}

// --- Project Details Module ---
function initProjectDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  if (!slug) {
    window.location.href = '/portfolio';
    return;
  }

  $.get(`/api/projects/slug/${slug}`, function (res) {
    if (res.success && res.project) {
      const project = res.project;

      // Meta and titles
      $('.project-title-placeholder').text(project.title);
      $('#project-title').text(project.title);
      $('#project-cat').text(project.category ? project.category.name : 'Interior Design');
      $('#project-description-body').html(project.description);

      if (project.seo && project.seo.metaTitle) {
        document.title = `${project.seo.metaTitle} | K.DESIGNS & INTERIORS`;
      }

      // Project stats / meta info boxes
      $('#project-meta-container').html(`
        <div class="meta-box">
          <h4>Category</h4>
          <p>${project.category ? project.category.name : 'Design'}</p>
        </div>
        <div class="meta-box">
          <h4>Location</h4>
          <p>${project.location || 'Kutch, Gujarat'}</p>
        </div>
        <div class="meta-box">
          <h4>Status</h4>
          <p>${project.status}</p>
        </div>
        <div class="meta-box">
          <h4>Completion Date</h4>
          <p>${project.completionDate || new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      `);

      // Images Gallery
      if (project.images && project.images.length) {
        let galleryHtml = '';
        project.images.forEach(img => {
          galleryHtml += `
            <div class="gallery-item">
              <img src="${img.url}" alt="${project.title}">
            </div>
          `;
        });
        $('#project-gallery').html(galleryHtml);
      }

      // Floor Plans Section
      if (project.floorPlans && project.floorPlans.length) {
        let fpHtml = '';
        project.floorPlans.forEach((fp, index) => {
          fpHtml += `
            <div class="floorplan-card">
              <img src="${fp.url}" alt="Floor Plan ${index + 1}">
              <h4>Layout Plan ${index + 1}</h4>
            </div>
          `;
        });
        $('#floorplans-container').html(fpHtml);
        $('#project-floorplans-section').show();
      } else {
        $('#project-floorplans-section').hide();
      }

      // Video support
      if (project.videoUrl) {
        let videoEmbedUrl = project.videoUrl;
        if (videoEmbedUrl.includes('youtube.com/watch')) {
          const videoId = new URLSearchParams(new URL(videoEmbedUrl).search).get('v');
          videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoEmbedUrl.includes('youtu.be/')) {
          const videoId = videoEmbedUrl.split('youtu.be/')[1].split('?')[0];
          videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
        }

        $('#video-embed-container').html(`
          <iframe width="100%" height="450" src="${videoEmbedUrl}" frameborder="0" allowfullscreen></iframe>
        `);
        $('#project-video-section').show();
      } else {
        $('#project-video-section').hide();
      }

      // Testimonials/Reviews specific to project
      if (project.testimonials) {
        $('#project-testimonial-text').text(`"${project.testimonials}"`);
        $('#project-testimonials-section').show();
      } else {
        $('#project-testimonials-section').hide();
      }
    } else {
      window.location.href = '/portfolio';
    }
  }).fail(function () {
    window.location.href = '/portfolio';
  });
}

// --- Blogs Page Module ---
let currentBlogsPage = 1;
const blogsLimit = 6;
let currentBlogCategory = 'all';

function initBlogsPage() {
  // 1. Fetch Blog Categories
  $.get('/api/blog-categories?status=Active', function (res) {
    if (res.success && res.categories.length) {
      let filterButtons = '<button class="filter-btn active" data-filter="all">All Articles</button>';
      res.categories.forEach(cat => {
        filterButtons += `<button class="filter-btn" data-filter="${cat._id}">${cat.name}</button>`;
      });
      $('#blog-filters').html(filterButtons);

      // Category filter binding
      $('#blog-filters').off('click', '.filter-btn').on('click', '.filter-btn', function () {
        $('#blog-filters .filter-btn').removeClass('active');
        $(this).addClass('active');
        currentBlogCategory = $(this).attr('data-filter');
        currentBlogsPage = 1;
        $('#all-blogs-grid').empty();
        loadBlogsList(currentBlogsPage, currentBlogCategory);
      });
    }
  });

  // 2. Load More click binding
  $('#btn-blogs-load-more').off('click').on('click', function (e) {
    e.preventDefault();
    currentBlogsPage++;
    loadBlogsList(currentBlogsPage, currentBlogCategory);
  });

  // 3. Initial load
  currentBlogsPage = 1;
  loadBlogsList(1, 'all');
}

function loadBlogsList(page = 1, category = 'all') {
  let url = `/api/blogs?status=Active&limit=${blogsLimit}&page=${page}`;
  if (category && category !== 'all') {
    url += `&category=${category}`;
  }

  $.get(url, function (res) {
    if (res.success) {
      if (page === 1 && (!res.blogs || res.blogs.length === 0)) {
        $('#all-blogs-grid').html('<div class="text-center" style="grid-column: 1/-1; padding: 40px;">No articles found in this category.</div>');
        $('#blogs-load-more-container').hide();
        return;
      }

      let blogsHtml = '';
      res.blogs.forEach(blog => {
        const date = new Date(blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const imgUrl = blog.featuredImage && blog.featuredImage.url ? blog.featuredImage.url : 'https://placehold.co/600x400';

        blogsHtml += `
          <div class="blog-card">
            <div class="blog-thumb">
              <img src="${imgUrl}" alt="${blog.title}">
            </div>
            <div class="blog-body">
              <div class="blog-meta">
                <span><i class="far fa-calendar-alt"></i> ${date}</span>
                <span><i class="far fa-folder"></i> ${blog.category ? blog.category.name : 'General'}</span>
              </div>
              <h3><a href="/blog-details?slug=${blog.slug}">${blog.title}</a></h3>
              <p class="blog-excerpt">${blog.content.replace(/<[^>]*>/g, '')}</p>
              <a href="/blog-details?slug=${blog.slug}" class="service-link">Read Article <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        `;
      });

      if (page === 1) {
        $('#all-blogs-grid').html(blogsHtml);
      } else {
        $('#all-blogs-grid').append(blogsHtml);
      }

      // Handle button visibility
      if (res.pagination && res.pagination.page < res.pagination.pages) {
        $('#blogs-load-more-container').show();
      } else {
        $('#blogs-load-more-container').hide();
      }
    }
  });
}

// --- Blog Details Page Module ---
function initBlogDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  if (!slug) {
    window.location.href = '/blogs';
    return;
  }

  $.get(`/api/blogs/slug/${slug}`, function (res) {
    if (res.success && res.blog) {
      const blog = res.blog;

      $('.blog-title-placeholder').text(blog.title);
      $('#blog-title').text(blog.title);
      $('#blog-page-title').text(blog.title);
      $('#blog-cat-badge').text(blog.category ? blog.category.name : 'Design Insight');
      $('#blog-cat').text(blog.category ? blog.category.name : 'Trends');
      $('#blog-date').text(new Date(blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
      $('#blog-content').html(blog.content);

      // Extract all gallery images, prioritizing the new array field (up to 3 images)
      const images = [];
      if (blog.images && blog.images.length > 0) {
        blog.images.forEach(img => {
          if (img.url) images.push(img);
        });
      } else if (blog.featuredImage && blog.featuredImage.url) {
        images.push(blog.featuredImage);
      }

      if (images.length > 0) {
        $('#blog-slider-track').empty();
        $('#blog-slider-dots').empty();
        $('#btn-blog-prev, #btn-blog-next').hide();

        images.forEach((img, idx) => {
          $('#blog-slider-track').append(`
            <img class="blog-slider-image" src="${img.url}" alt="Blog Image ${idx + 1}" style="width: 100%; flex-shrink: 0; height: auto; max-height: 580px; object-fit: cover; display: block;">
          `);
        });

        if (images.length > 1) {
          $('#btn-blog-prev, #btn-blog-next').css('display', 'flex');

          images.forEach((_, idx) => {
            $('#blog-slider-dots').append(`
              <span class="blog-dot" data-index="${idx}" style="width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s; ${idx === 0 ? 'background: #fff; width: 12px; height: 12px;' : ''}"></span>
            `);
          });

          let currentIndex = 0;
          const totalSlides = images.length;

          function updateBlogSlider(index) {
            currentIndex = index;
            $('#blog-slider-track').css('transform', `translateX(-${currentIndex * 100}%)`);
            $('#blog-slider-dots .blog-dot').css({
              'background': 'rgba(255,255,255,0.5)',
              'width': '10px',
              'height': '10px'
            });
            $(`#blog-slider-dots .blog-dot[data-index="${currentIndex}"]`).css({
              'background': '#fff',
              'width': '12px',
              'height': '12px'
            });
          }

          $('#btn-blog-next').off('click').on('click', function (e) {
            e.preventDefault();
            updateBlogSlider((currentIndex + 1) % totalSlides);
          });

          $('#btn-blog-prev').off('click').on('click', function (e) {
            e.preventDefault();
            updateBlogSlider((currentIndex - 1 + totalSlides) % totalSlides);
          });

          // Event delegation for dots clicks
          $('#blog-slider-dots').off('click', '.blog-dot').on('click', '.blog-dot', function () {
            const idx = parseInt($(this).data('index'));
            updateBlogSlider(idx);
          });
        }

        $('#blog-image-container').show();
        $('.blog-detail-grid').removeClass('no-image');
      } else {
        $('#blog-image-container').hide();
        $('.blog-detail-grid').addClass('no-image');
      }

      if (blog.seo && blog.seo.metaTitle) {
        document.title = `${blog.seo.metaTitle} | K.DESIGNS & INTERIORS`;
      }
    } else {
      window.location.href = '/blogs';
    }
  }).fail(function () {
    window.location.href = '/blogs';
  });
}

// --- Form Submissions Handler ---
function setupFormSubmissions() {
  // Contact Request Form Submission
  $('#contact-form').submit(function (e) {
    e.preventDefault();
    const submitBtn = $(this).find('button[type="submit"]');
    submitBtn.prop('disabled', true).text('Sending Inqury...');

    const formData = {
      name: $('#name').val(),
      email: $('#email').val(),
      phone: $('#phone').val(),
      subject: $('#subject').val(),
      message: $('#message').val()
    };

    $.ajax({
      url: '/api/contacts',
      method: 'POST',
      data: formData,
      success: function (res) {
        alert(res.message || 'Thank you! Your message has been sent successfully.');
        $('#contact-form')[0].reset();
        submitBtn.prop('disabled', false).text('Send Inquiry');
      },
      error: function (err) {
        const errorMsg = err.responseJSON ? err.responseJSON.message : 'Error sending submission. Please try again.';
        alert(errorMsg);
        submitBtn.prop('disabled', false).text('Send Inquiry');
      }
    });
  });

  // Populate active serving cities dynamically in consultation select
  if ($('#c_city').length) {
    $.get('/api/cities?status=Active', function (res) {
      if (res.success && res.cities && res.cities.length) {
        let opts = '<option value="">Select City</option>';
        res.cities.forEach(city => {
          opts += `<option value="${city.name}">${city.name}</option>`;
        });
        $('#c_city').html(opts);
      }
    });
  }

  let selectedImagesArray = [];

  // Floor plan file input preview
  $('#c_floorPlan').change(function (e) {
    const file = e.target.files[0];
    if (file) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('Unsupported file format. Supported formats: PNG, JPG, JPEG, WEBP, PDF.');
        $(this).val('');
        $('#fp-upload-text').text('Click to upload plan').css('color', '#555');
        return;
      }
      $('#fp-upload-text').text(file.name).css('color', 'var(--primary)');
    } else {
      $('#fp-upload-text').text('Click to upload plan').css('color', '#555');
    }
  });

  // Reference images input change
  $('#c_images').change(function (e) {
    const files = e.target.files;
    const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert(`Unsupported file format for "${file.name}". Supported formats: PNG, JPG, JPEG, WEBP.`);
        continue;
      }
      if (selectedImagesArray.length >= 5) {
        alert('You can upload a maximum of 5 reference images.');
        break;
      }
      selectedImagesArray.push(file);
    }
    renderSelectedImagesPreview();
    $(this).val(''); // clear input so user can choose same files again
  });

  function renderSelectedImagesPreview() {
    let html = '';
    selectedImagesArray.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      html += `
        <div style="position: relative; width: 65px; height: 65px; border-radius: 6px; border: 1px solid #ddd; overflow: hidden; background:#eee;">
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="remove-selected-img" data-index="${index}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; transition: background 0.2s;"><i class="fas fa-times"></i></button>
        </div>
      `;
    });
    $('#selected-images-preview').html(html);
  }

  // Remove image from array queue
  $(document).on('click', '.remove-selected-img', function (e) {
    e.preventDefault();
    const index = parseInt($(this).attr('data-index'));
    selectedImagesArray.splice(index, 1);
    renderSelectedImagesPreview();
  });

  // Consultation booking Form Submission
  $('#consultation-form').submit(function (e) {
    e.preventDefault();
    const submitBtn = $(this).find('.submit-btn');
    const loadingText = 'Booking Consultation...';
    submitBtn.prop('disabled', true).text(loadingText);

    const formData = new FormData();
    formData.append('name', $('#c_name').val());
    formData.append('email', $('#c_email').val());
    formData.append('phone', $('#c_phone').val());
    formData.append('city', $('#c_city').val());
    formData.append('projectType', $('#c_projectType').val());
    formData.append('projectSize', $('#c_projectSize').val());
    formData.append('budget', $('#c_budget').val());
    formData.append('timeline', $('#c_timeline').val());
    formData.append('message', $('#c_message').val());

    // Single Floor Plan File
    const floorPlanInput = document.getElementById('c_floorPlan');
    if (floorPlanInput && floorPlanInput.files.length) {
      formData.append('floorPlan', floorPlanInput.files[0]);
    }

    // Multiple Reference Images from Array Queue
    selectedImagesArray.forEach(file => {
      formData.append('images', file);
    });

    $.ajax({
      url: '/api/consultations',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        alert(res.message || 'Consultation request booked successfully!');

        // Open client WhatsApp notification dynamically
        const textMsg = `Hi K.DESIGNS %26 INTERIORS,%0A%0AI have requested a consultation:%0A*Name:* ${$('#c_name').val()}%0A*Phone:* ${$('#c_phone').val()}%0A*City:* ${$('#c_city').val()}%0A*Project:* ${$('#c_projectType').val()}%0A*Size:* ${$('#c_projectSize').val()}%20SQFT%0A*Budget:* ${$('#c_budget').val()}%0A*Timeline:* ${$('#c_timeline').val()}`;

        // Find WhatsApp number from global settings
        $.get('/api/settings', function (settingsRes) {
          if (settingsRes.success && settingsRes.settings.whatsappNumber) {
            const cleanWa = settingsRes.settings.whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanWa}?text=${textMsg}`, '_blank');
          }
        });

        // Reset all states
        $('#consultation-form')[0].reset();
        selectedImagesArray = [];
        $('#selected-images-preview').empty();
        $('#fp-upload-text').text('Click to upload plan').css('color', '#555');
        submitBtn.prop('disabled', false).text('Request Consultation');
      },
      error: function (err) {
        const errorMsg = err.responseJSON ? err.responseJSON.message : 'Booking failed. Please try again.';
        alert(errorMsg);
        submitBtn.prop('disabled', false).text('Request Consultation');
      }
    });
  });
}

function initServiceDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  if (!slug) {
    window.location.href = '/services';
    return;
  }

  $.get(`/api/services/slug/${slug}`, function (res) {
    if (res.success && res.service) {
      const service = res.service;

      $('.service-title-placeholder').text(service.title);
      $('#service-title').text(service.title);

      // Split description by newlines and wrap in paragraphs for clean alignment
      const formattedDescription = service.description
        ? service.description.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p.trim()}</p>`).join('')
        : '<p>No description available.</p>';
      $('#service-description-body').html(formattedDescription);

      // Extract all gallery images, prioritizing the new array field
      const images = [];
      if (service.images && service.images.length > 0) {
        service.images.forEach(img => {
          if (img.url) images.push(img);
        });
      } else if (service.image && service.image.url) {
        images.push(service.image);
      }

      if (images.length > 0) {
        $('#service-slider-track').empty();
        $('#service-slider-dots').empty();
        $('#btn-service-prev, #btn-service-next').hide();

        images.forEach((img, idx) => {
          $('#service-slider-track').append(`
            <img class="service-slider-image" src="${img.url}" alt="Service Image ${idx + 1}" style="width: 100%; flex-shrink: 0; height: auto; max-height: 580px; object-fit: cover; display: block;">
          `);
        });

        if (images.length > 1) {
          $('#btn-service-prev, #btn-service-next').css('display', 'flex');

          images.forEach((_, idx) => {
            $('#service-slider-dots').append(`
              <span class="service-dot" data-index="${idx}" style="width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s; ${idx === 0 ? 'background: #fff; width: 12px; height: 12px;' : ''}"></span>
            `);
          });

          let currentIndex = 0;
          const totalSlides = images.length;

          function updateSlider(index) {
            currentIndex = index;
            $('#service-slider-track').css('transform', `translateX(-${currentIndex * 100}%)`);
            $('#service-slider-dots .service-dot').css({
              'background': 'rgba(255,255,255,0.5)',
              'width': '10px',
              'height': '10px'
            });
            $(`#service-slider-dots .service-dot[data-index="${currentIndex}"]`).css({
              'background': '#fff',
              'width': '12px',
              'height': '12px'
            });
          }

          $('#btn-service-next').off('click').on('click', function (e) {
            e.preventDefault();
            updateSlider((currentIndex + 1) % totalSlides);
          });

          $('#btn-service-prev').off('click').on('click', function (e) {
            e.preventDefault();
            updateSlider((currentIndex - 1 + totalSlides) % totalSlides);
          });

          // Event delegation for dots clicks
          $('#service-slider-dots').off('click', '.service-dot').on('click', '.service-dot', function () {
            const idx = parseInt($(this).data('index'));
            updateSlider(idx);
          });
        }

        $('#service-image-container').show();
        $('.service-detail-grid').removeClass('no-image');
      } else {
        $('#service-image-container').hide();
        $('.service-detail-grid').addClass('no-image');
      }

      if (service.seo && service.seo.metaTitle) {
        document.title = `${service.seo.metaTitle} | K.DESIGNS & INTERIORS`;
      }
    } else {
      window.location.href = '/services';
    }
  }).fail(function () {
    window.location.href = '/services';
  });
}
