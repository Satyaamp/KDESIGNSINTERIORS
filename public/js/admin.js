$(document).ready(function() {
  // Prevent Back-button browser cache access to dashboard after logout
  window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
      window.location.reload();
    }
  });

  const path = window.location.pathname;
  
  // 1. Session Protection Checks
  const token = localStorage.getItem('admin_token');
  const isLoggedIn = !!token;
  
  if (path.includes('admin/login')) {
    if (isLoggedIn) {
      window.location.href = '/admin/dashboard';
    }
  } else if (path.includes('admin/')) {
    if (!isLoggedIn) {
      window.location.href = '/admin/login';
      return;
    }

    // Inject admin sidebar dynamically from template
    if ($('aside.admin-sidebar').length) {
      $('aside.admin-sidebar').load('/admin/components/sidebar.html', function() {
        // Initialize collapsible sidebar state from preference
        const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isSidebarCollapsed) {
          $('.admin-sidebar').addClass('collapsed');
        }

        // Dynamic brand elements builder for sidebar collapse toggle
        const sidebarBrand = $('.sidebar-brand');
        if (sidebarBrand.length) {
          sidebarBrand.css({
            'display': 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'width': '100%'
          });
          const currentBrandContent = sidebarBrand.html();
          sidebarBrand.html(`
            <div class="brand-left" style="display:flex; align-items:center; gap:10px;">
              ${currentBrandContent}
            </div>
            <button id="sidebar-toggle-btn" style="background:none; border:none; color:var(--text-gray); cursor:pointer; font-size:1.1rem; padding: 4px 8px; display:flex; align-items:center; justify-content:center; border-radius:4px; outline:none; transition: color 0.2s, transform 0.3s;" title="Toggle Sidebar">
              <i class="fas fa-angle-double-left" style="color: #fff;"></i>
            </button>
          `);
        }

        // Run guards and active highlights once loaded
        applyPermissionsGuards();
        highlightActiveAdminSidebarLink();
      });
    }

    // Collapsed state click transition bindings
    $(document).on('click', '#sidebar-toggle-btn', function(e) {
      e.preventDefault();
      const sidebar = $('.admin-sidebar');
      sidebar.toggleClass('collapsed');
      const collapsed = sidebar.hasClass('collapsed');
      localStorage.setItem('sidebar_collapsed', collapsed ? 'true' : 'false');
    });

    // Mobile Hamburger Menu Injection
    const headerTitle = $('.admin-header .header-title');
    if (headerTitle.length && !$('#mobile-nav-toggle').length) {
      headerTitle.css({
        'display': 'flex',
        'align-items': 'center'
      });
      headerTitle.prepend(`
        <button id="mobile-nav-toggle" style="background:none; border:none; color:#374151; cursor:pointer; font-size:1.4rem; margin-right:15px; display:none; align-items:center; justify-content:center; padding: 4px;" title="Toggle Menu">
          <i class="fas fa-bars"></i>
        </button>
      `);
    }

    // Mobile navigation toggle click handler
    $(document).on('click', '#mobile-nav-toggle', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.admin-sidebar').toggleClass('open');
    });

    // Close sidebar on mobile when clicking outside
    $(document).on('click', function(e) {
      if ($(window).width() <= 992) {
        if (!$(e.target).closest('.admin-sidebar').length && !$(e.target).closest('#mobile-nav-toggle').length) {
          $('.admin-sidebar').removeClass('open');
        }
      }
    });
    
    // Shared Visual Rich Editor Helper (Quill)
    window.createRichEditor = function(selector, placeholderText) {
      if ($(selector).length) {
        return new Quill(selector, {
          theme: 'snow',
          placeholder: placeholderText || 'Write content details here...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline', 'strike'],        // toggle styles
              ['blockquote'],                                   // notepad note
              [{ 'header': 2 }, { 'header': 3 }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'color': [] }, { 'background': [] }],          // highlights
              ['clean']                                         // clear formatting
            ]
          }
        });
      }
      return null;
    };
    
    // Shared Live Preview Overlay Simulator
    window.openLivePreview = function(title, categoryName, contentHtml, imageUrls) {
      $('#admin-preview-overlay').remove();

      let imageContent = '<div style="color:#aaa; font-size:14px; text-align:center;">No images chosen yet</div>';
      if (imageUrls && imageUrls.length > 0) {
        if (imageUrls.length === 1) {
          imageContent = `<img src="${imageUrls[0]}" style="width:100%; height:100%; object-fit:cover; display:block;">`;
        } else {
          imageContent = `
            <img src="${imageUrls[0]}" style="width:100%; height:100%; object-fit:cover; display:block;">
            <div style="position:absolute; bottom:15px; right:15px; background:rgba(0,0,0,0.7); color:#fff; font-size:11px; padding:4px 8px; border-radius:4px;">
              <i class="fas fa-images"></i> 1 of ${imageUrls.length} Images
            </div>
          `;
        }
      }

      const overlayHtml = `
        <div id="admin-preview-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Inter', sans-serif;">
          <style>
            #preview-content-body blockquote {
              background: #fefcf2 !important;
              border-left: 4px solid var(--accent, #c8a27b) !important;
              padding: 20px 20px 20px 35px !important;
              margin: 20px 0 !important;
              border-radius: 8px !important;
              font-style: italic !important;
              color: #333 !important;
              position: relative !important;
              font-size: 1.1rem !important;
              line-height: 2rem !important;
              border: 1px solid #f6f2dd !important;
              background-image: linear-gradient(#e1dbbd 1px, transparent 1px) !important;
              background-size: 100% 2rem !important;
            }
            #preview-content-body blockquote::before {
              content: "\\201C" !important;
              font-family: serif !important;
              font-size: 3.5rem !important;
              color: rgba(200, 162, 123, 0.25) !important;
              position: absolute !important;
              top: -10px !important;
              left: 8px !important;
            }
            #preview-content-body mark, #preview-content-body .highlight {
              background: linear-gradient(120deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.25) 100%) !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
              font-weight: 600 !important;
              color: #333 !important;
              display: inline !important;
            }
            #preview-content-body p:first-of-type::first-letter {
              font-family: serif !important;
              font-size: 3rem !important;
              float: left !important;
              line-height: 0.9 !important;
              margin-right: 8px !important;
              color: var(--accent, #c8a27b) !important;
              font-weight: 700 !important;
            }
            #preview-content-body ul {
              margin: 15px 0 15px 20px !important;
            }
            #preview-content-body ul li {
              margin-bottom: 8px !important;
              list-style-type: square !important;
            }
          </style>
          <div style="background:#faf9f6; width:95%; max-width:1150px; height:85vh; border-radius:16px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px rgba(0,0,0,0.3);">
            <!-- Header -->
            <div style="background:#fff; border-bottom:1px solid #ddd; padding:15px 25px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:600; color:#111; font-size:1.1rem; display:flex; align-items:center; gap:8px;"><i class="fas fa-eye" style="color:#c8a27b;"></i> Real-Time Live Preview</span>
              <button id="close-preview-btn" style="background:#111; color:#fff; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:6px; font-size:13px;">Close Preview &times;</button>
            </div>
            <!-- Body -->
            <div style="flex:1; overflow-y:auto; padding:45px 25px;">
              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 45px; align-items: flex-start; max-width: 1050px; margin: 0 auto;">
                
                <!-- Left Column: Image -->
                <div style="border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid #eaeaea; background:#fff; aspect-ratio:4/3; position:relative; display:flex; align-items:center; justify-content:center;">
                  ${imageContent}
                </div>
                
                <!-- Right Column: Details -->
                <div style="background: transparent;">
                  <span style="display: inline-block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: #c8a27b; background: #fdfcfb; border: 1px solid #f3efea; padding: 5px 12px; border-radius: 50px; font-weight: 600; margin-bottom: 15px;">${categoryName || 'General'}</span>
                  <h1 style="font-size: 2.1rem; color: #111; margin: 0 0 20px 0; font-family: serif; line-height: 1.3; font-weight:400;">${title || 'Untitled Post'}</h1>
                  <div id="preview-content-body" style="font-size: 1.05rem; line-height: 1.85; color: #555; text-align: justify; text-justify: inter-word;">
                    ${contentHtml || '<p style="color:#999;">No content written yet...</p>'}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      `;

      $('body').append(overlayHtml);
      
      // Bind close click
      $('#close-preview-btn').click(function(e) {
        e.preventDefault();
        $('#admin-preview-overlay').remove();
      });
    };
    
    // Enforce fine-grained CRUD elements visibility
    function enforceCrudButtons() {
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const role = adminUser.role || 'Editor';
      if (role === 'SuperAdmin') return; // SuperAdmin bypasses checks

      const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : [];
      const curModule = path.split('/').pop().replace('.html', '');
      if (!curModule || curModule === 'dashboard' || curModule === 'login') return;

      // Normalize category/city panels to 'categories' module checks
      if (curModule === 'categories') {
        const hasAdd = permissions.includes('categories_add');
        const hasEdit = permissions.includes('categories_edit');
        const hasDelete = permissions.includes('categories_delete');

        if (!hasAdd) $('.btn-add, #btn-add, [id^="btn-add"], .btn-create, #open-modal').hide();
        if (!hasEdit) $('.icon-btn-edit, .edit-btn').hide();
        if (!hasDelete) $('.icon-btn-delete, .delete-btn').hide();
        return;
      }

      // Treat consultation details page checks
      if (curModule === 'consultation-details') {
        const hasEdit = permissions.includes('consultations_edit');
        if (!hasEdit) {
          $('#save-notes-btn, #btn-save-notes, button:contains("Save")').hide();
          $('select, input, textarea').prop('disabled', true);
        }
        return;
      }

      // General module checking
      const hasAdd = permissions.includes(curModule + '_add');
      const hasEdit = permissions.includes(curModule + '_edit');
      const hasDelete = permissions.includes(curModule + '_delete');

      if (!hasAdd) {
        $('.btn-add, #btn-add, [id^="btn-add"], .btn-create, #open-modal').hide();
        $('button, a').each(function() {
          const txt = $(this).text().trim().toLowerCase();
          if (txt === 'add' || txt === 'create' || txt.startsWith('add ') || txt.startsWith('create ')) {
            $(this).hide();
          }
        });
      }

      if (!hasEdit) {
        $('.icon-btn-edit, .edit-btn').hide();
      }

      if (!hasDelete) {
        $('.icon-btn-delete, .delete-btn').hide();
      }
    }

    // MutationObserver to automatically enforce CRUD permissions on dynamically rendered list rows
    let crudObserver = null;
    function watchCrudElements() {
      if (crudObserver) crudObserver.disconnect();
      
      crudObserver = new MutationObserver(function() {
        enforceCrudButtons();
      });
      
      crudObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Run once immediately
      enforceCrudButtons();
    }

    // Function to show/hide menus and guard pages dynamically
    function applyPermissionsGuards() {
      const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const role = adminUser.role || 'Editor';
      const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : [];

      // Set admin display name and username in header
      const namePart = adminUser.name ? adminUser.name.trim() : '';
      const usernamePart = adminUser.username || 'Admin';
      const headerText = namePart ? `${namePart} (${usernamePart})` : usernamePart;
      $('#admin-user-display').text(headerText);
      if (adminUser.profilePicture && adminUser.profilePicture.url) {
        $('.header-user img').remove();
        $('.header-user').prepend(`<img src="${adminUser.profilePicture.url}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; margin-right:8px; border:2px solid var(--primary);">`);
        $('.header-user i.fa-user-circle').hide();
      }

      // Hide menus based on permissions
      $('.sidebar-menu li').each(function() {
        const a = $(this).find('a');
        const href = a.attr('href');
        if (!href) return;
        
        const module = href.split('/').pop(); // Extract e.g. "services" from "/admin/services"
        if (module === 'dashboard' || module === 'login') return;

        // Handle Role Matrix screen specifically
        if ($(this).hasClass('super-only')) {
          if (role !== 'SuperAdmin') {
            $(this).hide();
          } else {
            $(this).show();
          }
          return;
        }
        
        // Handle My Profile tab specifically
        if (module === 'profile') return;

        // Viewer/Editor permissions check
        if (role !== 'SuperAdmin' && !permissions.includes(module) && !permissions.includes(module + '_view')) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });

      // Guard current page access
      const curModule = path.split('/').pop().replace('.html', '');
      if (curModule && curModule !== 'dashboard' && curModule !== 'login') {
        if (curModule === 'admins' && role !== 'SuperAdmin') {
          window.location.href = '/admin/dashboard';
        } else if (curModule !== 'admins' && curModule !== 'profile' && role !== 'SuperAdmin' && !permissions.includes(curModule) && !permissions.includes(curModule + '_view')) {
          window.location.href = '/admin/dashboard';
        }
      }
    }

    // Active Admin Sidebar Link highlighter
    function highlightActiveAdminSidebarLink() {
      const path = window.location.pathname;
      $('.sidebar-menu li').removeClass('active');
      $('.sidebar-menu li').each(function() {
        const a = $(this).find('a');
        const href = a.attr('href');
        if (href && (path === href || path.includes(href))) {
          $(this).addClass('active');
        }
      });
    }

    // Run guards immediately using cached details
    applyPermissionsGuards();
    watchCrudElements();

    // Dynamic Live Profile Cache Update & Re-guarding
    $.ajax({
      url: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        if (res.success && res.admin) {
          localStorage.setItem('admin_user', JSON.stringify(res.admin));
          // Re-apply guards with freshly fetched configurations
          applyPermissionsGuards();
        }
      }
    });
  }

  // Active Menu Highlight
  setupSidebarNavigation(path);

  // Setup Global AJAX Headers for JWT Auth & Disable Caching
  $.ajaxSetup({
    cache: false,
    beforeSend: function(xhr) {
      const activeToken = localStorage.getItem('admin_token');
      if (activeToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${activeToken}`);
      }
    }
  });

  // Global loading state for submit buttons during forms submission
  $(document).on('submit', 'form', function() {
    const form = $(this);
    const submitBtn = form.find('button[type="submit"]');
    if (submitBtn.length && !submitBtn.prop('disabled')) {
      submitBtn.data('original-html', submitBtn.html());
      submitBtn.prop('disabled', true);
      submitBtn.html('<i class="fas fa-circle-notch fa-spin" style="margin-right: 8px;"></i> Processing...');
    }
  });

  // Global loading state for delete actions when AJAX DELETE starts
  $(document).ajaxSend(function(event, xhr, settings) {
    if (settings.type === 'DELETE') {
      const activeBtn = $(document.activeElement);
      if (activeBtn.length && (activeBtn.hasClass('icon-btn-delete') || activeBtn.find('.fa-trash-alt').length || activeBtn.hasClass('delete-btn') || activeBtn.attr('class')?.includes('delete'))) {
        activeBtn.data('original-html', activeBtn.html());
        activeBtn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i>');
      }
    }
  });

  // Global AJAX completion listener to restore button states (submits and deletes)
  $(document).ajaxComplete(function() {
    $('button:disabled').each(function() {
      const btn = $(this);
      const originalHtml = btn.data('original-html');
      if (originalHtml) {
        btn.prop('disabled', false);
        btn.html(originalHtml);
      }
    });
  });

  // Admin Logout Action
  $(document).on('click', '#admin-logout', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      
      // Delete the gatekeeper cookie so the secret link is required next time!
      document.cookie = "admin_access_authorized=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      window.location.href = '/admin/login';
    }
  });

  // Page Specific Actions
  if (path.includes('admin/login')) {
    setupLoginHandler();
  } else if (path.includes('admin/dashboard')) {
    loadDashboardStats();
  } else if (path.includes('admin/services')) {
    initAdminServices();
  } else if (path.includes('admin/projects')) {
    initAdminProjects();
  } else if (path.includes('admin/categories')) {
    initAdminCategories();
  } else if (path.includes('admin/blogs')) {
    initAdminBlogs();
  } else if (path.includes('admin/testimonials')) {
    initAdminTestimonials();
  } else if (path.includes('admin/team')) {
    initAdminTeam();
  } else if (path.includes('admin/consultations')) {
    initAdminConsultations();
  } else if (path.includes('admin/contacts')) {
    initAdminContacts();
  } else if (path.includes('admin/settings')) {
    initAdminSettings();
  } else if (path.includes('admin/admins')) {
    initAdminSubAccounts();
  } else if (path.includes('admin/profile')) {
    initAdminProfile();
  }
});

// Dynamic Module Refresh Loader Binder
window.setupModuleRefresh = function(headerSelector, buttonId, loadFunction) {
  const cardHeader = $(headerSelector).first();
  if (cardHeader.length && !$(`#${buttonId}`).length) {
    cardHeader.css({
      'display': 'flex',
      'justify-content': 'space-between',
      'align-items': 'center'
    });
    
    const addButton = cardHeader.find('button, .btn-admin-primary, .btn-primary');
    const refreshBtnHtml = `
      <button id="${buttonId}" class="admin-btn-refresh" title="Refresh Data">
        <i class="fas fa-sync-alt"></i>
      </button>
    `;
    
    if (addButton.length) {
      addButton.before(refreshBtnHtml);
    } else {
      cardHeader.append(refreshBtnHtml);
    }

    $(document).off('click', `#${buttonId}`).on('click', `#${buttonId}`, function(e) {
      e.preventDefault();
      const btn = $(this);
      const icon = btn.find('i');
      if (icon.hasClass('fa-spin')) return; // Prevent spamming click

      icon.addClass('fa-spin');
      const startTime = Date.now();

      loadFunction(() => {
        const elapsedTime = Date.now() - startTime;
        const minimumSpinTime = 800; // Enforce minimum 800ms satisfying rotation feel
        const remainingTime = Math.max(0, minimumSpinTime - elapsedTime);

        setTimeout(() => {
          icon.removeClass('fa-spin');
        }, remainingTime);
      });
    });
  }
};

// Toast notice generator
function showToast(message, type = 'success') {
  let toast = $('#admin-toast');
  if (toast.length === 0) {
    $('body').append('<div id="admin-toast" class="admin-toast"></div>');
    toast = $('#admin-toast');
  }
  
  toast.removeClass('success error warning show')
       .addClass(type)
       .html(`<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`);
       
  setTimeout(() => toast.addClass('show'), 100);
  
  setTimeout(() => {
    toast.removeClass('show');
  }, 4000);
}

// Highlights current tab in Sidebar
function setupSidebarNavigation(path) {
  $('.sidebar-menu li').removeClass('active');
  $('.sidebar-menu a').each(function() {
    const href = $(this).attr('href');
    if (href && href.includes('categories')) {
      $(this).html('<i class="fas fa-database"></i> Master');
    }
    if (href && path.includes(href)) {
      $(this).parent().addClass('active');
    }
  });
}

// --- Login Handler ---
function setupLoginHandler() {
  // Real-time username role preview / existence checker
  let debounceTimeout = null;
  $('#username').on('input', function() {
    clearTimeout(debounceTimeout);
    const usernameVal = $(this).val().trim();
    const badge = $('#username-role-badge');
    
    if (!usernameVal) {
      badge.hide().text('');
      return;
    }

    debounceTimeout = setTimeout(function() {
      $.ajax({
        url: `/api/auth/check-role/${encodeURIComponent(usernameVal)}`,
        method: 'GET',
        success: function(res) {
          if (res.success) {
            badge.css({
              'color': '#34d399',
              'display': 'block'
            }).html(`<i class="fas fa-check-circle" style="margin-right:5px;"></i>Role: ${res.role}`);
          }
        },
        error: function(err) {
          badge.css({
            'color': '#f87171',
            'display': 'block'
          }).html(`<i class="fas fa-times-circle" style="margin-right:5px;"></i>No such user exists`);
        }
      });
    }, 400); // 400ms debounce
  });

  $('#admin-login-form').submit(function(e) {
    e.preventDefault();
    const btn = $(this).find('button[type="submit"]');
    
    // Animate button to loading state
    btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Verifying...');

    const data = {
      username: $('#username').val(),
      password: $('#password').val()
    };

    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      data: data,
      success: function(res) {
        if (res.success) {
          localStorage.setItem('admin_token', res.token);
          localStorage.setItem('admin_user', JSON.stringify(res.admin));
          
          // Render beautiful success overlay
          const overlayHtml = `
            <div id="login-success-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease;">
              <div class="loader-spinner" style="width: 50px; height: 50px; border: 3px solid rgba(197, 168, 128, 0.15); border-top: 3px solid #C5A880; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 25px; box-shadow: 0 0 15px rgba(197, 168, 128, 0.15);"></div>
              <div class="loader-title" style="font-family: 'Playfair Display', Georgia, serif; font-size: 1.5rem; color: #ffffff; margin-bottom: 8px; letter-spacing: 1px; font-weight: 700;">Access Authorized</div>
              <div class="loader-status" style="font-size: 0.82rem; color: #C5A880; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; text-align: center; transition: all 0.25s ease;">Verifying credentials...</div>
            </div>
          `;
          
          $('body').append(overlayHtml);
          
          // Trigger CSS fade-in
          setTimeout(function() {
            $('#login-success-overlay').css('opacity', '1');
          }, 50);

          // Step-by-step progress status messages (taking 10 seconds total)
          const statusMessages = [
            { time: 1200, text: 'Retrieving corporate services catalog...' },
            { time: 2400, text: 'Loading architectural projects gallery...' },
            { time: 3600, text: 'Syncing master categories & cities...' },
            { time: 4800, text: 'Downloading dynamic team profiles...' },
            { time: 6000, text: 'Updating client testimonial registry...' },
            { time: 7200, text: 'Fetching booking requests & consultations...' },
            { time: 8400, text: 'Checking incoming contact desk inquiries...' },
            { time: 9400, text: 'Configuring dashboard workspace...' }
          ];

          statusMessages.forEach(function(msg) {
            setTimeout(function() {
              const statusEl = $('.loader-status');
              statusEl.css({
                'opacity': '0',
                'transform': 'translateY(-5px)'
              });
              
              setTimeout(function() {
                statusEl.text(msg.text).css({
                  'opacity': '1',
                  'transform': 'translateY(0)'
                });
              }, 150);
            }, msg.time);
          });

          // Final Redirect at 10 seconds
          setTimeout(function() {
            window.location.href = '/admin/dashboard';
          }, 10000);
        }
      },
      error: function(err) {
        const errorMsg = err.responseJSON ? err.responseJSON.message : 'Invalid credentials';
        
        // Show clean dynamic error state on button
        btn.html('Invalid Credentials').css('background-color', '#ef4444');
        
        setTimeout(function() {
          btn.prop('disabled', false).html('Login').css('background-color', 'var(--accent, #C5A880)');
        }, 1500);
      }
    });
  });
}

// --- Dashboard Statistics Loader ---
function loadDashboardStats(callback) {
  // Setup module refresh in the dashboard header
  window.setupModuleRefresh('.admin-header .header-title', 'btn-refresh-dashboard', loadDashboardStats);

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const role = adminUser.role || 'Editor';
  const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : [];

  // Parallel fetches for count statistics
  const endpoints = [
    { url: '/api/projects?admin=true', key: 'projectsCount', countKey: 'projects', module: 'projects' },
    { url: '/api/services?admin=true', key: 'servicesCount', countKey: 'services', module: 'services' },
    { url: '/api/blogs?admin=true', key: 'blogsCount', countKey: 'blogs', module: 'blogs' },
    { url: '/api/testimonials?admin=true', key: 'testimonialsCount', countKey: 'testimonials', module: 'testimonials' },
    { url: '/api/consultations', key: 'consultationsCount', countKey: 'consultations', module: 'consultations' },
    { url: '/api/contacts', key: 'contactsCount', countKey: 'contacts', module: 'contacts' }
  ];

  // Hide stats cards based on Role Matrix permissions
  $('.widget-card').each(function() {
    const module = $(this).attr('data-module');
    if (!module) return;
    if (role !== 'SuperAdmin' && !permissions.includes(module) && !permissions.includes(module + '_view')) {
      $(this).remove();
    }
  });

  // Enable download buttons if allowed by Role Matrix
  let showReportsPanel = false;
  if (role === 'SuperAdmin' || permissions.includes('report_consultations')) {
    $('#download-bookings-report').show();
    showReportsPanel = true;
  }
  if (role === 'SuperAdmin' || permissions.includes('report_contacts')) {
    $('#download-inquiries-report').show();
    showReportsPanel = true;
  }
  if (role === 'SuperAdmin' || permissions.includes('report_services')) {
    $('#download-services-report').show();
    showReportsPanel = true;
  }
  if (role === 'SuperAdmin' || permissions.includes('report_projects')) {
    $('#download-projects-report').show();
    showReportsPanel = true;
  }
  if (role === 'SuperAdmin' || permissions.includes('report_blogs')) {
    $('#download-blogs-report').show();
    showReportsPanel = true;
  }
  if (role === 'SuperAdmin' || permissions.includes('report_testimonials')) {
    $('#download-testimonials-report').show();
    showReportsPanel = true;
  }

  if (showReportsPanel) {
    $('.reports-panel-card').show();
  }

  const promises = [];
  // Fetch only permitted modules
  endpoints.forEach(ep => {
    if (role === 'SuperAdmin' || permissions.includes(ep.module) || permissions.includes(ep.module + '_view')) {
      const p = $.get(ep.url, function(res) {
        if (res.success) {
          const count = res.pagination ? res.pagination.total : (res[ep.countKey] ? res[ep.countKey].length : 0);
          $(`#stat-${ep.key}`).text(count);
        }
      });
      promises.push(p);
    }
  });

  if (typeof callback === 'function') {
    $.when.apply($, promises).always(callback);
  }
}

// Helper to format Date & Time in IST Timezone
function formatISTDateTime(dateVal) {
  if (!dateVal) return 'N/A';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// HTML/XML Entity Escaper
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Download Bookings Excel Helper
$(document).on('click', '#download-bookings-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/consultations?limit=1000', function(res) {
    if (res.success && res.consultations) {
      let rowsHtml = '';
      res.consultations.forEach(c => {
        const floorPlanLink = c.floorPlan && c.floorPlan.url 
          ? `<a href="${c.floorPlan.url}" style="color:#2563eb; text-decoration:underline;">View Floor Plan</a>` 
          : '<span style="color:#9ca3af; font-style:italic;">None</span>';
        
        let refImagesHtml = '<span style="color:#9ca3af; font-style:italic;">None</span>';
        if (c.images && c.images.length > 0) {
          refImagesHtml = c.images.map((img, idx) => `<a href="${img.url}" style="color:#2563eb; text-decoration:underline;">Image ${idx + 1}</a>`).join(', ');
        }

        const formattedDate = formatISTDateTime(c.statusUpdatedAt);
        const createdAtDate = formatISTDateTime(c.createdAt);

        rowsHtml += `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.phone)}</td>
            <td>${escapeHtml(c.city || 'N/A')}</td>
            <td>${escapeHtml(c.projectType || 'N/A')}</td>
            <td>${escapeHtml(c.projectSize || 'N/A')}</td>
            <td>${escapeHtml(c.budget || 'N/A')}</td>
            <td>${escapeHtml(c.timeline || 'N/A')}</td>
            <td class="wrap-cell">${escapeHtml(c.message)}</td>
            <td>${floorPlanLink}</td>
            <td>${refImagesHtml}</td>
            <td><strong class="status-${c.status}">${c.status}</strong></td>
            <td>${escapeHtml(c.statusUpdatedBy || 'N/A')}</td>
            <td>${formattedDate}</td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Bookings Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
          .status-Pending { color: #D97706; }
          .status-Contacted { color: #2563EB; }
          .status-Completed { color: #059669; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="15" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="15" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Bookings & Consultation Leads Report</th>
              </tr>
              <tr>
                <th colspan="15" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="15" style="background:#ffffff; border:none; height:15px;"></th></tr>
              
              <!-- Actual Columns -->
              <tr>
                <th>Client Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>City / Region</th>
                <th>Project Type</th>
                <th>Project Size (SQFT)</th>
                <th>Estimated Budget</th>
                <th>Timeline</th>
                <th>Requirement Brief</th>
                <th>Floor Plan Attachment</th>
                <th>Reference Images</th>
                <th>Status</th>
                <th>Status Updated By</th>
                <th>Status Updated At</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      downloadExcelFile(excelTemplate, 'bookings_report.xls');
    } else {
      alert('No bookings data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Bookings Report (Excel)');
  });
});

// Download Inquiries Excel Helper
$(document).on('click', '#download-inquiries-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/contacts?limit=1000', function(res) {
    if (res.success && res.contacts) {
      let rowsHtml = '';
      res.contacts.forEach(c => {
        const formattedDate = formatISTDateTime(c.statusUpdatedAt);
        const createdAtDate = formatISTDateTime(c.createdAt);

        rowsHtml += `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.phone || 'N/A')}</td>
            <td class="wrap-cell">${escapeHtml(c.subject || 'General Inquiry')}</td>
            <td class="wrap-cell">${escapeHtml(c.message)}</td>
            <td class="wrap-cell">${escapeHtml(c.adminNotes || 'N/A')}</td>
            <td><strong class="status-${c.status}">${c.status}</strong></td>
            <td>${escapeHtml(c.statusUpdatedBy || 'N/A')}</td>
            <td>${formattedDate}</td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Inquiries Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
          .status-Pending { color: #D97706; }
          .status-Read { color: #2563EB; }
          .status-Replied { color: #059669; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="10" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="10" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Contact Inquiries Report</th>
              </tr>
              <tr>
                <th colspan="10" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="10" style="background:#ffffff; border:none; height:15px;"></th></tr>
              
              <!-- Actual Columns -->
              <tr>
                <th>Contact Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Subject</th>
                <th>Full Message / Inquiry</th>
                <th>Admin Follow-up Notes</th>
                <th>Status</th>
                <th>Status Updated By</th>
                <th>Status Updated At</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      downloadExcelFile(excelTemplate, 'inquiries_report.xls');
    } else {
      alert('No inquiries data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Inquiries Report (Excel)');
  });
});

// Download Services Excel Helper
$(document).on('click', '#download-services-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/services?limit=1000&admin=true', function(res) {
    if (res.success && res.services) {
      let rowsHtml = '';
      res.services.forEach(s => {
        let imagesHtml = '<span style="color:#9ca3af; font-style:italic;">None</span>';
        if (s.images && s.images.length > 0) {
          imagesHtml = s.images.map((img, idx) => `<a href="${img.url}" style="color:#2563eb; text-decoration:underline;">Image ${idx + 1}</a>`).join(', ');
        } else if (s.image && s.image.url) {
          imagesHtml = `<a href="${s.image.url}" style="color:#2563eb; text-decoration:underline;">View Image</a>`;
        }
        const createdAtDate = formatISTDateTime(s.createdAt);
        rowsHtml += `
          <tr>
            <td>${escapeHtml(s.title)}</td>
            <td><a href="${window.location.origin}/service-details?slug=${s.slug}" style="color:#2563eb; text-decoration:underline;">View Details</a></td>
            <td>${escapeHtml(s.slug)}</td>
            <td class="wrap-cell">${escapeHtml(s.description)}</td>
            <td><strong style="color:${s.status === 'Active' ? '#059669' : '#d97706'}">${s.status}</strong></td>
            <td>${imagesHtml}</td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Services Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="7" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="7" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Services List Report</th>
              </tr>
              <tr>
                <th colspan="7" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="7" style="background:#ffffff; border:none; height:15px;"></th></tr>
              <tr>
                <th>Service Title</th>
                <th>Public Details Link</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th>Gallery Images</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      downloadExcelFile(excelTemplate, 'services_report.xls');
    } else {
      alert('No services data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Services Report (Excel)');
  });
});

// Download Projects Excel Helper
$(document).on('click', '#download-projects-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/projects?limit=1000&admin=true', function(res) {
    if (res.success && res.projects) {
      let rowsHtml = '';
      res.projects.forEach(p => {
        let imagesHtml = '<span style="color:#9ca3af; font-style:italic;">None</span>';
        if (p.images && p.images.length > 0) {
          imagesHtml = p.images.map((img, idx) => `<a href="${img.url}" style="color:#2563eb; text-decoration:underline;">Image ${idx + 1}</a>`).join(', ');
        }
        
        let floorPlansHtml = '<span style="color:#9ca3af; font-style:italic;">None</span>';
        if (p.floorPlans && p.floorPlans.length > 0) {
          floorPlansHtml = p.floorPlans.map((fp, idx) => `<a href="${fp.url}" style="color:#2563eb; text-decoration:underline;">Plan ${idx + 1}</a>`).join(', ');
        }

        const createdAtDate = formatISTDateTime(p.createdAt);
        rowsHtml += `
          <tr>
            <td>${escapeHtml(p.title)}</td>
            <td><a href="${window.location.origin}/project-details?slug=${p.slug}" style="color:#2563eb; text-decoration:underline;">View Details</a></td>
            <td>${escapeHtml(p.category ? p.category.name : 'N/A')}</td>
            <td>${escapeHtml(p.location ? p.location.name : 'N/A')}</td>
            <td class="wrap-cell">${escapeHtml(p.description)}</td>
            <td class="wrap-cell">${escapeHtml(p.testimonials || 'N/A')}</td>
            <td>${imagesHtml}</td>
            <td>${floorPlansHtml}</td>
            <td><strong style="color:${p.status === 'Active' ? '#059669' : '#d97706'}">${p.status}</strong></td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Projects Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="10" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="10" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Projects List Report</th>
              </tr>
              <tr>
                <th colspan="10" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="10" style="background:#ffffff; border:none; height:15px;"></th></tr>
              <tr>
                <th>Project Title</th>
                <th>Public Details Link</th>
                <th>Category</th>
                <th>Location</th>
                <th>Description</th>
                <th>Client Review</th>
                <th>Gallery Images</th>
                <th>Floor Plans</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      downloadExcelFile(excelTemplate, 'projects_report.xls');
    } else {
      alert('No projects data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Projects Report (Excel)');
  });
});

// Download Blogs Excel Helper
$(document).on('click', '#download-blogs-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/blogs?limit=1000&admin=true', function(res) {
    if (res.success && res.blogs) {
      let rowsHtml = '';
      res.blogs.forEach(b => {
        let coverImgHtml = '<span style="color:#9ca3af; font-style:italic;">None</span>';
        if (b.featuredImage && b.featuredImage.url) {
          coverImgHtml = `<a href="${b.featuredImage.url}" style="color:#2563eb; text-decoration:underline;">View Cover</a>`;
        }

        const createdAtDate = formatISTDateTime(b.createdAt);
        rowsHtml += `
          <tr>
            <td>${escapeHtml(b.title)}</td>
            <td><a href="${window.location.origin}/blog-details?slug=${b.slug}" style="color:#2563eb; text-decoration:underline;">View Details</a></td>
            <td>${escapeHtml(b.slug)}</td>
            <td>${escapeHtml(b.category ? b.category.name : 'N/A')}</td>
            <td class="wrap-cell">${escapeHtml(b.summary || 'N/A')}</td>
            <td>${coverImgHtml}</td>
            <td><strong style="color:${b.status === 'Active' ? '#059669' : '#d97706'}">${b.status}</strong></td>
            <td>${escapeHtml(b.authorName || 'Admin')}</td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Blogs Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="9" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="9" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Blogs List Report</th>
              </tr>
              <tr>
                <th colspan="9" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="9" style="background:#ffffff; border:none; height:15px;"></th></tr>
              <tr>
                <th>Blog Title</th>
                <th>Public Details Link</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Summary</th>
                <th>Cover Image</th>
                <th>Status</th>
                <th>Author</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      downloadExcelFile(excelTemplate, 'blogs_report.xls');
    } else {
      alert('No blogs data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Blogs Report (Excel)');
  });
});

// Download Testimonials Excel Helper
$(document).on('click', '#download-testimonials-report', function() {
  const btn = $(this);
  btn.prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Exporting...');
  $.get('/api/testimonials?limit=1000&admin=true', function(res) {
    if (res.success && res.testimonials) {
      let rowsHtml = '';
      res.testimonials.forEach(t => {
        const createdAtDate = formatISTDateTime(t.createdAt);
        rowsHtml += `
          <tr>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(t.designation || 'N/A')}</td>
            <td>${t.rating} Stars</td>
            <td class="wrap-cell">${escapeHtml(t.review)}</td>
            <td><strong style="color:${t.status === 'Active' ? '#059669' : '#d97706'}">${t.status}</strong></td>
            <td>${createdAtDate}</td>
          </tr>
        `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Testimonials Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #111827; color: #C5A880; font-weight: bold; text-align: left; padding: 12px 15px; border: 1px solid #374151; font-size: 13px; white-space: nowrap; }
          td { padding: 10px 15px; border: 1px solid #E5E7EB; color: #374151; font-size: 12px; vertical-align: top; white-space: nowrap; }
          .wrap-cell { white-space: normal !important; max-width: 350px !important; }
          tr:nth-child(even) { background-color: #F9FAFB; }
        </style>
        </head>
        <body>
          <table>
            <thead>
              <!-- Branded Header block -->
              <tr>
                <th colspan="6" style="background-color: #111827; color: #C5A880; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border: 1px solid #111827;">K.DESIGNS & INTERIORS</th>
              </tr>
              <tr>
                <th colspan="6" style="background-color: #1F2937; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; padding: 8px; border: 1px solid #1F2937;">Testimonials List Report</th>
              </tr>
              <tr>
                <th colspan="6" style="background-color: #f3f4f6; color: #4b5563; font-size: 10px; font-weight: 500; text-align: center; padding: 6px; border: 1px solid #e5e7eb;">Generated: ${formatISTDateTime(new Date())} | Timezone: IST (India)</th>
              </tr>
              <tr style="height: 15px;"><th colspan="6" style="background:#ffffff; border:none; height:15px;"></th></tr>
              <tr>
                <th>Client Name</th>
                <th>Designation</th>
                <th>Rating</th>
                <th>Review Message</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      downloadExcelFile(excelTemplate, 'testimonials_report.xls');
    } else {
      alert('No testimonials data available.');
    }
  }).always(function() {
    btn.prop('disabled', false).html('<i class="fas fa-download"></i> Testimonials Report (Excel)');
  });
});

function downloadExcelFile(htmlContent, fileName) {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Services CRUD ---
function initAdminServices() {
  let editId = null;
  let keepExistingImages = [];
  
  // Initialize Quill Editor for Services Description
  const quill = window.createRichEditor('#service-description-editor', 'Write a detailed description about the service...');

  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-services', loadServicesList);
  loadServicesList();

  // Search box binding
  $('#search-services').on('input', function() {
    loadServicesList($(this).val());
  });

  // Modal open
  $('#btn-add-service').click(function() {
    editId = null;
    keepExistingImages = [];
    $('#service-modal-title').text('Add Service');
    $('#service-form')[0].reset();
    if (quill) quill.root.innerHTML = '';
    $('#image-preview-box').html('<span class="placeholder">Gallery Previews</span>');
    $('#service-modal').addClass('open');
  });

  // Modal close
  $('.modal-close, #btn-cancel-service').click(function() {
    $('#service-modal').removeClass('open');
  });

  // Live Preview click binding
  $('#btn-preview-service').click(function(e) {
    e.preventDefault();
    const title = $('#service-title').val();
    const category = 'Service Details';
    const content = quill ? quill.root.innerHTML : '';
    
    const imageUrls = [];
    // Read existing
    $('#image-preview-box .existing-preview-item img').each(function() {
      imageUrls.push($(this).attr('src'));
    });
    // Read new selections
    const fileInput = document.getElementById('service-image');
    if (fileInput && fileInput.files) {
      for (let i = 0; i < fileInput.files.length; i++) {
        imageUrls.push(URL.createObjectURL(fileInput.files[i]));
      }
    }
    
    window.openLivePreview(title, category, content, imageUrls);
  });

  // Image Upload Preview binding
  $('#service-image').change(function() {
    $('#image-preview-box .new-preview').remove();
    
    const files = this.files;
    if (files && files.length > 0) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`Unsupported file format for "${file.name}". Supported formats: PNG, JPG, JPEG, WEBP.`);
          $(this).val('');
          $('#image-preview-box .new-preview').remove();
          if ($('#image-preview-box').children().length === 0) {
            $('#image-preview-box').html('<span class="placeholder" style="color:#aaa; font-style:italic; font-size:12px;">Add Service Image</span>');
          }
          return;
        }
      }

      $('#image-preview-box .placeholder').remove();
      
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
          $('#image-preview-box').append(`
            <div class="new-preview" style="position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#fff; display:inline-block;">
              <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
              <span style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; width:15px; height:15px; display:flex; align-items:center; justify-content:center; border-radius:50%; cursor:not-allowed;" title="New file selection">i</span>
            </div>
          `);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  });

  // Remove existing image handler
  $(document).on('click', '.btn-remove-existing-img', function(e) {
    e.preventDefault();
    const publicId = $(this).data('id');
    keepExistingImages = keepExistingImages.filter(id => id !== publicId);
    $(this).parent('.existing-preview-item').remove();
    if ($('#image-preview-box').children().length === 0) {
      $('#image-preview-box').html('<span class="placeholder">Gallery Previews</span>');
    }
  });

  // Submit form handler
  $('#service-form').submit(function(e) {
    e.preventDefault();
    if (quill) {
      $('#service-description').val(quill.root.innerHTML);
    }
    const formData = new FormData(this);
    
    if (editId) {
      formData.append('keepExistingImages', JSON.stringify(keepExistingImages));
    }
    
    const url = editId ? `/api/services/${editId}` : '/api/services';
    const method = editId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        if (res.success) {
          showToast(editId ? 'Service updated successfully!' : 'Service created successfully!');
          $('#service-modal').removeClass('open');
          loadServicesList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  // Edit / Delete action delegation
  $(document).on('click', '.edit-service-btn', function() {
    const id = $(this).data('id');
    editId = id;
    
    $.get(`/api/services?admin=true`, function(res) {
      const service = res.services.find(s => s._id === id);
      if (service) {
        $('#service-modal-title').text('Edit Service');
        $('#service-title').val(service.title);
        if (quill) {
          quill.root.innerHTML = service.description || '';
        }
        $('#service-description').val(service.description || '');
        $('#service-status').val(service.status);
        $('#service-metaTitle').val(service.seo?.metaTitle || '');
        $('#service-metaDescription').val(service.seo?.metaDescription || '');
        $('#service-keywords').val(service.seo?.keywords || '');
        
        keepExistingImages = [];
        if (service.images && service.images.length > 0) {
          keepExistingImages = service.images.map(img => img.public_id);
        } else if (service.image && service.image.public_id) {
          keepExistingImages = [service.image.public_id];
        }

        // Render current images
        $('#image-preview-box').empty();
        const currentImages = service.images && service.images.length > 0 
          ? service.images 
          : (service.image && service.image.url ? [service.image] : []);
        
        if (currentImages.length > 0) {
          currentImages.forEach(img => {
            if (!img.url) return;
            $('#image-preview-box').append(`
              <div class="existing-preview-item" data-id="${img.public_id}" style="position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#fff; display:inline-block; margin-right:5px; margin-bottom:5px;">
                <img src="${img.url}" style="width:100%; height:100%; object-fit:cover;">
                <button type="button" class="btn-remove-existing-img" data-id="${img.public_id}" style="position:absolute; top:2px; right:2px; background:var(--danger); color:#fff; border:none; font-size:10px; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; cursor:pointer;">&times;</button>
              </div>
            `);
          });
        } else {
          $('#image-preview-box').html('<span class="placeholder">Gallery Previews</span>');
        }
        
        $('#service-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-service-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this service?')) {
      $.ajax({
        url: `/api/services/${id}`,
        method: 'DELETE',
        success: function(res) {
          showToast('Service deleted successfully!');
          loadServicesList();
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });
}

function loadServicesList(search = '', page = 1, callback) {
  if (typeof search === 'function') {
    callback = search;
    search = '';
    page = 1;
  }
  const term = search || $('#search-services').val() || '';
  $.get(`/api/services?admin=true&search=${term}&page=${page}`, function(res) {
    if (res.success) {
      let rows = '';
      res.services.forEach(s => {
        const img = s.image && s.image.url ? `<img src="${s.image.url}" class="row-img">` : '<span class="text-gray">No image</span>';
        rows += `
          <tr>
            <td>${img}</td>
            <td><strong>${s.title}</strong></td>
            <td>/services/slug/${s.slug}</td>
            <td><span class="status-pill ${s.status.toLowerCase()}">${s.status}</span></td>
            <td>
              <div class="actions-cell">
                <a href="/service-details?slug=${s.slug}" target="_blank" class="icon-btn icon-btn-view" title="View Public Page"><i class="fas fa-eye"></i></a>
                <button class="icon-btn icon-btn-edit edit-service-btn" data-id="${s._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-service-btn" data-id="${s._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#services-table-body').html(rows || '<tr><td colspan="5" class="text-center">No services found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Projects CRUD ---
function initAdminProjects() {
  let editId = null;
  let loadedProjectObj = null;
  
  // Initialize Quill Editor for Projects Description
  const quill = window.createRichEditor('#project-description-editor', 'Describe styling themes, space sizes, layout models, construction materials...');

  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-projects', loadProjectsList);
  loadProjectsList();
  loadProjectCategoryOptions();
  loadProjectLocationOptions();

  // Search box binding
  $('#search-projects').on('input', function() {
    loadProjectsList($(this).val());
  });

  // Validate project images format on select
  $('#project-images').change(function() {
    const files = this.files;
    if (files && files.length > 0) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`Unsupported file format for "${file.name}". Supported formats: PNG, JPG, JPEG, WEBP.`);
          $(this).val('');
          return;
        }
      }
    }
  });

  // Validate project floorplans format on select
  $('#project-floorplans').change(function() {
    const files = this.files;
    if (files && files.length > 0) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`Unsupported file format for "${file.name}". Supported formats: PNG, JPG, JPEG, WEBP, PDF.`);
          $(this).val('');
          return;
        }
      }
    }
  });

  // Modal actions
  $('#btn-add-project').click(function() {
    editId = null;
    loadedProjectObj = null;
    $('#project-modal-title').text('Add Project');
    $('#project-form')[0].reset();
    if (quill) quill.root.innerHTML = '';
    $('#project-images-preview').html('');
    $('#project-floorplans-preview').html('');
    $('#project-modal').addClass('open');
  });

  $('.modal-close, #btn-cancel-project').click(function() {
    $('#project-modal').removeClass('open');
  });

  // Live Preview click binding
  $('#btn-preview-project').click(function(e) {
    e.preventDefault();
    const title = $('#project-title').val();
    const category = $('#project-category option:selected').text();
    const content = quill ? quill.root.innerHTML : '';
    
    const imageUrls = [];
    // Read existing checkbox checked ones
    $('#project-images-preview .preview-thumb-box').each(function() {
      const isChecked = $(this).find('.kept-image-check').is(':checked');
      if (isChecked) {
        imageUrls.push($(this).find('img').attr('src'));
      }
    });
    // Read new selections
    const fileInput = document.getElementById('project-images');
    if (fileInput && fileInput.files) {
      for (let i = 0; i < fileInput.files.length; i++) {
        imageUrls.push(URL.createObjectURL(fileInput.files[i]));
      }
    }
    
    window.openLivePreview(title, category, content, imageUrls);
  });

  // Submit Handler
  $('#project-form').submit(function(e) {
    e.preventDefault();
    if (quill) {
      $('#project-description').val(quill.root.innerHTML);
    }
    const formData = new FormData(this);
    
    // Manage kept images/floorplans if editing
    if (editId && loadedProjectObj) {
      const keptImages = [];
      const keptFps = [];
      
      $('.kept-image-check').each(function() {
        if ($(this).is(':checked')) {
          keptImages.push($(this).val());
        }
      });
      $('.kept-fp-check').each(function() {
        if ($(this).is(':checked')) {
          keptFps.push($(this).val());
        }
      });
      
      formData.append('keepExistingImages', JSON.stringify(keptImages));
      formData.append('keepExistingFloorPlans', JSON.stringify(keptFps));
    }

    const url = editId ? `/api/projects/${editId}` : '/api/projects';
    const method = editId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        if (res.success) {
          showToast(editId ? 'Project updated successfully!' : 'Project created successfully!');
          $('#project-modal').removeClass('open');
          loadProjectsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  // Edit / Delete Project actions
  $(document).on('click', '.edit-project-btn', function() {
    const id = $(this).data('id');
    editId = id;

    $.get(`/api/projects?admin=true`, function(res) {
      const project = res.projects.find(p => p._id === id);
      if (project) {
        loadedProjectObj = project;
        $('#project-modal-title').text('Edit Project');
        $('#project-title').val(project.title);
        if (quill) {
          quill.root.innerHTML = project.description || '';
        }
        $('#project-description').val(project.description || '');
        $('#project-category').val(project.category?._id || '');
        $('#project-video').val(project.videoUrl || '');
        const locationVal = project.location || '';
        if (locationVal && $('#project-location option[value="' + locationVal + '"]').length === 0) {
          $('#project-location').append(`<option value="${locationVal}">${locationVal}</option>`);
        }
        $('#project-location').val(locationVal);
        $('#project-completionDate').val(project.completionDate || '');
        $('#project-testimonial').val(project.testimonials || '');
        $('#project-status').val(project.status);
        $('#project-metaTitle').val(project.seo?.metaTitle || '');
        $('#project-metaDescription').val(project.seo?.metaDescription || '');
        $('#project-keywords').val(project.seo?.keywords || '');
        
        // Render current images with checkboxes to discard/keep
        let imgsHtml = '';
        project.images.forEach(img => {
          imgsHtml += `
            <div class="preview-thumb-box">
              <img src="${img.url}">
              <label style="position:absolute; bottom:2px; left:2px; background:rgba(255,255,255,0.8); padding:0 4px; font-size:10px; border-radius:2px;">
                <input type="checkbox" class="kept-image-check" value="${img.public_id}" checked> Keep
              </label>
            </div>
          `;
        });
        $('#project-images-preview').html(imgsHtml);

        // Render current floor plans
        let fpHtml = '';
        project.floorPlans.forEach(fp => {
          fpHtml += `
            <div class="preview-thumb-box">
              <img src="${fp.url}">
              <label style="position:absolute; bottom:2px; left:2px; background:rgba(255,255,255,0.8); padding:0 4px; font-size:10px; border-radius:2px;">
                <input type="checkbox" class="kept-fp-check" value="${fp.public_id}" checked> Keep
              </label>
            </div>
          `;
        });
        $('#project-floorplans-preview').html(fpHtml);
        
        $('#project-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-project-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this project?')) {
      $.ajax({
        url: `/api/projects/${id}`,
        method: 'DELETE',
        success: function(res) {
          showToast('Project deleted successfully!');
          loadProjectsList();
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });
}

function loadProjectsList(search = '', page = 1, callback) {
  if (typeof search === 'function') {
    callback = search;
    search = '';
    page = 1;
  }
  const term = search || $('#search-projects').val() || '';
  $.get(`/api/projects?admin=true&search=${term}&page=${page}`, function(res) {
    if (res.success) {
      let rows = '';
      res.projects.forEach(p => {
        const cover = p.images && p.images[0] ? `<img src="${p.images[0].url}" class="row-img">` : '<span class="text-gray">No image</span>';
        rows += `
          <tr>
            <td>${cover}</td>
            <td><strong>${p.title}</strong></td>
            <td>${p.category ? p.category.name : '<span class="text-gray">None</span>'}</td>
            <td><span class="status-pill ${p.status.toLowerCase()}">${p.status}</span></td>
            <td>
              <div class="actions-cell">
                <a href="/project-details?slug=${p.slug}" target="_blank" class="icon-btn icon-btn-view" title="View Public Page"><i class="fas fa-eye"></i></a>
                <button class="icon-btn icon-btn-edit edit-project-btn" data-id="${p._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-project-btn" data-id="${p._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#projects-table-body').html(rows || '<tr><td colspan="5" class="text-center">No projects found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

function loadProjectCategoryOptions() {
  $.get('/api/project-categories?status=Active', function(res) {
    if (res.success) {
      let opts = '<option value="">Select Category</option>';
      res.categories.forEach(c => {
        opts += `<option value="${c._id}">${c.name}</option>`;
      });
      $('#project-category').html(opts);
    }
  });
}

function loadProjectLocationOptions() {
  $.get('/api/cities?status=Active', function(res) {
    if (res.success) {
      let opts = '<option value="">Select Location</option>';
      res.cities.forEach(city => {
        opts += `<option value="${city.name}">${city.name}</option>`;
      });
      // Fallback/add empty options or manually typed locations if editing an old project
      $('#project-location').html(opts);
    }
  });
}

// --- Blogs CRUD ---
function initAdminBlogs() {
  let editId = null;
  let keepExistingImages = [];
  
  // Initialize Quill Editor
  const quill = window.createRichEditor('#blog-content-editor', 'Write visual rich content details here...');

  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-blogs', loadBlogsList);
  loadBlogsList();
  loadBlogCategoryOptions();

  $('#search-blogs').on('input', function() {
    loadBlogsList($(this).val());
  });

  $('#btn-add-blog').click(function() {
    editId = null;
    keepExistingImages = [];
    $('#blog-modal-title').text('Create Blog Post');
    $('#blog-form')[0].reset();
    if (quill) quill.root.innerHTML = '';
    $('#blog-image-preview').html('<span class="placeholder">Gallery Previews</span>');
    $('#blog-modal').addClass('open');
  });

  $('.modal-close, #btn-cancel-blog').click(function() {
    $('#blog-modal').removeClass('open');
  });

  // Live Preview click binding
  $('#btn-preview-blog').click(function(e) {
    e.preventDefault();
    const title = $('#blog-title').val();
    const category = $('#blog-category option:selected').text();
    const content = quill ? quill.root.innerHTML : '';
    
    const imageUrls = [];
    // Read existing
    $('#blog-image-preview .existing-preview-item img').each(function() {
      imageUrls.push($(this).attr('src'));
    });
    // Read new selections
    const fileInput = document.getElementById('blog-featuredImage');
    if (fileInput && fileInput.files) {
      for (let i = 0; i < fileInput.files.length; i++) {
        imageUrls.push(URL.createObjectURL(fileInput.files[i]));
      }
    }
    
    window.openLivePreview(title, category, content, imageUrls);
  });

  // Image Upload Preview binding (with max 3 validation)
  $('#blog-featuredImage').change(function() {
    $('#blog-image-preview .new-preview').remove();
    
    const files = this.files;
    if (files && files.length > 0) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExts.includes(ext)) {
          alert(`Unsupported file format for "${file.name}". Supported formats: PNG, JPG, JPEG, WEBP.`);
          $(this).val('');
          $('#blog-image-preview .new-preview').remove();
          if ($('#blog-image-preview').children().length === 0) {
            $('#blog-image-preview').html('<span class="placeholder">Gallery Previews</span>');
          }
          return;
        }
      }

      // Validate that total new + kept images doesn't exceed 3
      const totalCount = files.length + keepExistingImages.length;
      if (totalCount > 3) {
        showToast('You can select a maximum of 3 images for a blog post.', 'error');
        this.value = ''; // Reset file input
        if ($('#blog-image-preview').children().length === 0) {
          $('#blog-image-preview').html('<span class="placeholder">Gallery Previews</span>');
        }
        return;
      }

      $('#blog-image-preview .placeholder').remove();
      
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
          $('#blog-image-preview').append(`
            <div class="new-preview" style="position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#fff; display:inline-block; margin-right:5px; margin-bottom:5px;">
              <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
              <span style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; width:15px; height:15px; display:flex; align-items:center; justify-content:center; border-radius:50%; cursor:not-allowed;" title="New file selection">i</span>
            </div>
          `);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  });

  // Remove existing blog image handler
  $(document).on('click', '.btn-remove-existing-blog-img', function(e) {
    e.preventDefault();
    const publicId = $(this).data('id');
    keepExistingImages = keepExistingImages.filter(id => id !== publicId);
    $(this).parent('.existing-preview-item').remove();
    if ($('#blog-image-preview').children().length === 0) {
      $('#blog-image-preview').html('<span class="placeholder">Gallery Previews</span>');
    }
  });



  $('#blog-form').submit(function(e) {
    e.preventDefault();
    if (quill) {
      $('#blog-content').val(quill.root.innerHTML);
    }
    const formData = new FormData(this);
    
    if (editId) {
      formData.append('keepExistingImages', JSON.stringify(keepExistingImages));
    }
    
    const url = editId ? `/api/blogs/${editId}` : '/api/blogs';
    const method = editId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        if (res.success) {
          showToast(editId ? 'Blog post updated successfully!' : 'Blog post published!');
          $('#blog-modal').removeClass('open');
          loadBlogsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Publishing error', 'error');
      }
    });
  });

  $(document).on('click', '.edit-blog-btn', function() {
    const id = $(this).data('id');
    editId = id;

    $.get(`/api/blogs?admin=true`, function(res) {
      const blog = res.blogs.find(b => b._id === id);
      if (blog) {
        $('#blog-modal-title').text('Edit Blog Post');
        $('#blog-title').val(blog.title);
        if (quill) {
          quill.root.innerHTML = blog.content || '';
        }
        $('#blog-content').val(blog.content || '');
        $('#blog-category').val(blog.category?._id || '');
        $('#blog-status').val(blog.status);

        
        keepExistingImages = [];
        if (blog.images && blog.images.length > 0) {
          keepExistingImages = blog.images.map(img => img.public_id);
        } else if (blog.featuredImage && blog.featuredImage.public_id) {
          keepExistingImages = [blog.featuredImage.public_id];
        }

        // Render current images
        $('#blog-image-preview').empty();
        const currentImages = blog.images && blog.images.length > 0 
          ? blog.images 
          : (blog.featuredImage && blog.featuredImage.url ? [blog.featuredImage] : []);
        
        if (currentImages.length > 0) {
          currentImages.forEach(img => {
            if (!img.url) return;
            $('#blog-image-preview').append(`
              <div class="existing-preview-item" data-id="${img.public_id}" style="position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#fff; display:inline-block; margin-right:5px; margin-bottom:5px;">
                <img src="${img.url}" style="width:100%; height:100%; object-fit:cover;">
                <button type="button" class="btn-remove-existing-blog-img" data-id="${img.public_id}" style="position:absolute; top:2px; right:2px; background:var(--danger); color:#fff; border:none; font-size:10px; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; cursor:pointer;">&times;</button>
              </div>
            `);
          });
        } else {
          $('#blog-image-preview').html('<span class="placeholder">Gallery Previews</span>');
        }
        
        $('#blog-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-blog-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this blog post?')) {
      $.ajax({
        url: `/api/blogs/${id}`,
        method: 'DELETE',
        success: function(res) {
          showToast('Blog deleted successfully!');
          loadBlogsList();
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });
}

function loadBlogsList(search = '', page = 1, callback) {
  if (typeof search === 'function') {
    callback = search;
    search = '';
    page = 1;
  }
  const term = search || $('#search-blogs').val() || '';
  $.get(`/api/blogs?admin=true&search=${term}&page=${page}`, function(res) {
    if (res.success) {
      let rows = '';
      res.blogs.forEach(b => {
        const cover = b.featuredImage && b.featuredImage.url ? `<img src="${b.featuredImage.url}" class="row-img">` : '';
        rows += `
          <tr>
            <td>${cover}</td>
            <td><strong>${b.title}</strong></td>
            <td>${b.category ? b.category.name : 'General'}</td>
            <td><span class="status-pill ${b.status.toLowerCase()}">${b.status}</span></td>
            <td>
              <div class="actions-cell">
                <a href="/blog-details?slug=${b.slug}" target="_blank" class="icon-btn icon-btn-view" title="View Public Page"><i class="fas fa-eye"></i></a>
                <button class="icon-btn icon-btn-edit edit-blog-btn" data-id="${b._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-blog-btn" data-id="${b._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#blogs-table-body').html(rows || '<tr><td colspan="5" class="text-center">No blog posts found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

function loadBlogCategoryOptions() {
  $.get('/api/blog-categories?status=Active', function(res) {
    if (res.success) {
      let opts = '<option value="">Select Category</option>';
      res.categories.forEach(c => {
        opts += `<option value="${c._id}">${c.name}</option>`;
      });
      $('#blog-category').html(opts);
    }
  });
}

// --- Testimonials CRUD ---
function initAdminTestimonials() {
  let editId = null;
  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-testimonials', loadTestimonialsList);
  loadTestimonialsList();

  $('#btn-add-testimonial').click(function() {
    editId = null;
    $('#testimonial-modal-title').text('Add Testimonial');
    $('#testimonial-form')[0].reset();
    $('#testimonial-modal').addClass('open');
  });

  $('.modal-close, #btn-cancel-testimonial').click(function() {
    $('#testimonial-modal').removeClass('open');
  });

  // Validate testimonial image format
  $('#testimonial-image').change(function() {
    const file = this.files[0];
    if (file) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('Unsupported file format. Supported formats: PNG, JPG, JPEG, WEBP.');
        $(this).val('');
      }
    }
  });

  $('#testimonial-form').submit(function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const url = editId ? `/api/testimonials/${editId}` : '/api/testimonials';
    const method = editId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        if (res.success) {
          showToast(editId ? 'Testimonial updated!' : 'Testimonial added!');
          $('#testimonial-modal').removeClass('open');
          loadTestimonialsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  $(document).on('click', '.edit-testimonial-btn', function() {
    const id = $(this).data('id');
    editId = id;
    $.get('/api/testimonials?admin=true', function(res) {
      const test = res.testimonials.find(t => t._id === id);
      if (test) {
        $('#testimonial-modal-title').text('Edit Testimonial');
        $('#testimonial-name').val(test.name);
        $('#testimonial-designation').val(test.designation);
        $('#testimonial-review').val(test.review);
        $('#testimonial-rating').val(test.rating);
        $('#testimonial-status').val(test.status);
        $('#testimonial-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-testimonial-btn', function() {
    const id = $(this).data('id');
    if (confirm('Delete this testimonial?')) {
      $.ajax({
        url: `/api/testimonials/${id}`,
        method: 'DELETE',
        success: function() {
          showToast('Testimonial deleted successfully');
          loadTestimonialsList();
        }
      });
    }
  });
}

function loadTestimonialsList(callback) {
  $.get('/api/testimonials?admin=true', function(res) {
    if (res.success) {
      let rows = '';
      res.testimonials.forEach(t => {
        rows += `
          <tr>
            <td><strong>${t.name}</strong><br><small>${t.designation}</small></td>
            <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.review}</td>
            <td>${t.rating} Stars</td>
            <td><span class="status-pill ${t.status.toLowerCase()}">${t.status}</span></td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-edit edit-testimonial-btn" data-id="${t._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-testimonial-btn" data-id="${t._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#testimonials-table-body').html(rows || '<tr><td colspan="5" class="text-center">No testimonials found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Team Members CRUD ---
function initAdminTeam() {
  let editId = null;
  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-team', loadTeamList);
  loadTeamList();

  $('#btn-add-team').click(function() {
    editId = null;
    $('#team-modal-title').text('Add Team Member');
    $('#team-form')[0].reset();
    $('#team-modal').addClass('open');
  });

  $('.modal-close, #btn-cancel-team').click(function() {
    $('#team-modal').removeClass('open');
  });

  // Validate team member image format
  $('#team-image').change(function() {
    const file = this.files[0];
    if (file) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('Unsupported file format. Supported formats: PNG, JPG, JPEG, WEBP.');
        $(this).val('');
      }
    }
  });

  $('#team-form').submit(function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const url = editId ? `/api/team/${editId}` : '/api/team';
    const method = editId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        if (res.success) {
          showToast(editId ? 'Team member updated!' : 'Team member added!');
          $('#team-modal').removeClass('open');
          loadTeamList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  $(document).on('click', '.edit-team-btn', function() {
    const id = $(this).data('id');
    editId = id;
    $.get('/api/team?admin=true', function(res) {
      const member = res.teamMembers.find(m => m._id === id);
      if (member) {
        $('#team-modal-title').text('Edit Team Member');
        $('#team-name').val(member.name);
        $('#team-designation').val(member.designation);
        $('#team-facebook').val(member.socialLinks?.facebook || '');
        $('#team-instagram').val(member.socialLinks?.instagram || '');
        $('#team-linkedin').val(member.socialLinks?.linkedin || '');
        $('#team-status').val(member.status);
        $('#team-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-team-btn', function() {
    const id = $(this).data('id');
    if (confirm('Delete this team member?')) {
      $.ajax({
        url: `/api/team/${id}`,
        method: 'DELETE',
        success: function() {
          showToast('Team member deleted successfully');
          loadTeamList();
        }
      });
    }
  });
}

function loadTeamList(callback) {
  $.get('/api/team?admin=true', function(res) {
    if (res.success) {
      let rows = '';
      res.teamMembers.forEach(m => {
        const avatar = m.image?.url ? `<img src="${m.image.url}" class="row-img" style="border-radius:50%; width:40px; height:40px;">` : '';
        rows += `
          <tr>
            <td>${avatar}</td>
            <td><strong>${m.name}</strong></td>
            <td>${m.designation}</td>
            <td><span class="status-pill ${m.status.toLowerCase()}">${m.status}</span></td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-edit edit-team-btn" data-id="${m._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-team-btn" data-id="${m._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#team-table-body').html(rows || '<tr><td colspan="5" class="text-center">No team members found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Consultations List View ---
let loadedConsultations = [];

function initAdminConsultations() {
  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-consultations', loadConsultationsList);
  loadConsultationsList();

  $(document).on('change', '.consult-status-select', function() {
    const id = $(this).data('id');
    const newStatus = $(this).val();
    
    $.ajax({
      url: `/api/consultations/${id}`,
      method: 'PUT',
      data: { status: newStatus },
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        showToast('Consultation status updated.');
        loadConsultationsList();
      }
    });
  });

  $(document).on('click', '.delete-consult-btn', function() {
    const id = $(this).data('id');
    if (confirm('Delete this request permanently?')) {
      $.ajax({
        url: `/api/consultations/${id}`,
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
        },
        success: function() {
          showToast('Request deleted.');
          loadConsultationsList();
        }
      });
    }
  });
}

function loadConsultationsList(callback) {
  $.get('/api/consultations', function(res) {
    if (res.success) {
      loadedConsultations = res.consultations;
      let rows = '';
      res.consultations.forEach(c => {
        rows += `
          <tr>
            <td><strong>${c.name}</strong><br><span style="font-size:11px; color:#888;">City: ${c.city || 'N/A'}</span></td>
            <td>Email: ${c.email}<br>Phone: ${c.phone}</td>
            <td>
              <span style="font-size:12px;"><strong>Type:</strong> ${c.projectType || 'N/A'}</span><br>
              <span style="font-size:12px;"><strong>Size:</strong> ${c.projectSize ? (c.projectSize + ' SQFT') : 'N/A'}</span><br>
              <span style="font-size:12px;"><strong>Budget:</strong> ${c.budget || 'N/A'}</span>
            </td>
            <td>
              <select class="admin-form-control consult-status-select" data-id="${c._id}" style="width:120px; padding:6px 10px; font-size:12px;" ${c.status === 'Completed' ? 'disabled' : ''}>
                <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''} ${c.status !== 'Pending' ? 'disabled' : ''}>Pending</option>
                <option value="Contacted" ${c.status === 'Contacted' ? 'selected' : ''} ${c.status === 'Completed' ? 'disabled' : ''}>Contacted</option>
                <option value="Completed" ${c.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
              ${c.statusUpdatedBy ? `
                <div style="font-size: 10px; color: #10b981; margin-top: 4px; line-height: 1.2; font-weight: 500;">
                  <i class="fas fa-signature" style="font-size:8px;"></i> By: ${c.statusUpdatedBy}<br>
                  ${new Date(c.statusUpdatedAt).toLocaleDateString('en-IN')}
                </div>
              ` : ''}
            </td>
            <td>
              <div class="actions-cell">
                <a href="/admin/consultation-details.html?id=${c._id}" target="_blank" class="icon-btn icon-btn-view" title="View Details"><i class="fas fa-eye"></i></a>
                <button class="icon-btn icon-btn-delete delete-consult-btn" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#consultations-table-body').html(rows || '<tr><td colspan="5" class="text-center">No consultation requests found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

let loadedContacts = [];
let currentContactId = null;

function initAdminContacts() {
  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-contacts', loadContactsList);
  loadContactsList();

  $(document).on('change', '.contact-status-select', function() {
    const id = $(this).data('id');
    const newStatus = $(this).val();
    
    $.ajax({
      url: `/api/contacts/${id}`,
      method: 'PUT',
      data: { status: newStatus },
      success: function() {
        showToast('Inquiry status updated.');
        loadContactsList();
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to update status.';
        alert(errorMsg);
        loadContactsList();
      }
    });
  });

  $(document).on('click', '.delete-contact-btn', function() {
    const id = $(this).data('id');
    if (confirm('Delete inquiry?')) {
      $.ajax({
        url: `/api/contacts/${id}`,
        method: 'DELETE',
        success: function() {
          showToast('Inquiry deleted.');
          loadContactsList();
        }
      });
    }
  });

  // Open Details Modal
  $(document).on('click', '.view-contact-btn', function() {
    const id = $(this).attr('data-id');
    currentContactId = id;
    const contact = loadedContacts.find(item => item._id === id);
    if (contact) {
      $('#modal-c-name').text(contact.name);
      $('#modal-c-subject').text(contact.subject || 'General Inquiry');
      $('#modal-c-email').text(contact.email);
      $('#modal-c-phone').text(contact.phone || 'Not specified');
      $('#modal-c-message').text(contact.message || '');
      $('#modal-c-notes').val(contact.adminNotes || '');
      $('#contact-details-modal').addClass('open').css('display', 'flex');
    }
  });

  // Close Details Modal
  $(document).on('click', '#close-contact-modal-btn, #close-contact-modal-btn2', function() {
    $('#contact-details-modal').removeClass('open').hide();
    currentContactId = null;
  });

  // Save Admin Follow-up Notes
  $(document).on('click', '#save-contact-notes-btn', function() {
    if (!currentContactId) return;
    const notes = $('#modal-c-notes').val();
    const saveBtn = $(this);
    saveBtn.prop('disabled', true).text('Saving...');

    $.ajax({
      url: `/api/contacts/${currentContactId}`,
      method: 'PUT',
      data: { adminNotes: notes },
      success: function() {
        showToast('Admin notes saved successfully.');
        $('#contact-details-modal').removeClass('open').hide();
        currentContactId = null;
        loadContactsList();
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to save notes.';
        alert(errorMsg);
      },
      complete: function() {
        saveBtn.prop('disabled', false).text('Save Notes');
      }
    });
  });
}

function loadContactsList(callback) {
  $.get('/api/contacts', function(res) {
    if (res.success) {
      loadedContacts = res.contacts;
      let rows = '';
      res.contacts.forEach(c => {
        rows += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>Email: ${c.email}<br>Phone: ${c.phone || 'N/A'}</td>
            <td>Subject: ${c.subject || 'General Inquiry'}</td>
            <td>
              <select class="admin-form-control contact-status-select" data-id="${c._id}" style="width:120px; padding:6px 10px; font-size:12px;" ${c.status === 'Replied' ? 'disabled' : ''}>
                <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''} ${c.status !== 'Pending' ? 'disabled' : ''}>Pending</option>
                <option value="Read" ${c.status === 'Read' ? 'selected' : ''} ${c.status === 'Replied' ? 'disabled' : ''}>Read</option>
                <option value="Replied" ${c.status === 'Replied' ? 'selected' : ''}>Replied</option>
              </select>
              ${c.statusUpdatedBy ? `
                <div style="font-size: 10px; color: #10b981; margin-top: 4px; line-height: 1.2; font-weight: 500;">
                  <i class="fas fa-signature" style="font-size:8px;"></i> By: ${c.statusUpdatedBy}<br>
                  ${new Date(c.statusUpdatedAt).toLocaleDateString('en-IN')}
                </div>
              ` : ''}
            </td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-view view-contact-btn" data-id="${c._id}" title="View Details" style="border:none; cursor:pointer;"><i class="fas fa-eye"></i></button>
                <button class="icon-btn icon-btn-delete delete-contact-btn" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#contacts-table-body').html(rows || '<tr><td colspan="5" class="text-center">No contact inquiries found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Website Settings Manager ---
function initAdminSettings() {
  let savedEmail = '';
  let isEmailVerified = false;

  // Fetch current configs
  $.get('/api/settings', function(res) {
    if (res.success && res.settings) {
      const settings = res.settings;
      
      $('#siteName').val(settings.siteName);
      $('#contactEmail').val(settings.contactEmail);
      savedEmail = settings.contactEmail || '';
      isEmailVerified = settings.isEmailVerified === true;
      updateEmailVerificationStatus(savedEmail);

      $('#contactPhone').val(settings.contactPhone);
      $('#whatsappNumber').val(settings.whatsappNumber);
      $('#address').val(settings.address);
      $('#googleMapUrl').val(settings.googleMapUrl);
      
      if (settings.socialLinks) {
        $('#fbLink').val(settings.socialLinks.facebook || '');
        $('#instaLink').val(settings.socialLinks.instagram || '');
        $('#linkedinLink').val(settings.socialLinks.linkedin || '');
        $('#ytLink').val(settings.socialLinks.youtube || '');
      }
      
      if (settings.seo) {
        $('#defaultMetaTitle').val(settings.seo.defaultMetaTitle || '');
        $('#defaultMetaDescription').val(settings.seo.defaultMetaDescription || '');
        $('#defaultKeywords').val(settings.seo.defaultKeywords || '');
      }

      if (settings.logo && settings.logo.url) {
        $('#logo-preview').html(`<img src="${settings.logo.url}" style="height:60px; width:auto; object-fit:contain;">`);
      }
    }
  });

  // Track email input changes
  $('#contactEmail').on('input', function() {
    const currentInputVal = $(this).val().trim();
    updateEmailVerificationStatus(currentInputVal);
  });

  function updateEmailVerificationStatus(currentVal) {
    const badge = $('#email-verification-badge');
    const triggerBtn = $('#btn-trigger-email-otp');
    
    if (currentVal === savedEmail && isEmailVerified) {
      badge.text('Verified').css({ 'background': '#DEF7EC', 'color': '#03543F' });
      triggerBtn.hide();
      $('#email-otp-verification-section').hide();
    } else {
      badge.text('Unverified').css({ 'background': '#FDE8E8', 'color': '#9B1C1C' });
      triggerBtn.show();
    }
  }

  // Trigger Send OTP click
  $('#btn-trigger-email-otp').click(function(e) {
    e.preventDefault();
    const newEmail = $('#contactEmail').val().trim();
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email address first.');
      return;
    }

    const btn = $(this);
    btn.prop('disabled', true).text('Sending OTP...');

    $.ajax({
      url: '/api/settings/send-otp',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email: newEmail }),
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        btn.prop('disabled', false).text('Verify via OTP');
        if (res.success) {
          showToast('Verification OTP sent successfully!');
          $('#email-otp-verification-section').show();
          $('#email-verification-otp-code').val('').focus();
        }
      },
      error: function(err) {
        btn.prop('disabled', false).text('Verify via OTP');
        alert(err.responseJSON?.message || 'Failed to send OTP. Please check your SMTP settings.');
      }
    });
  });

  // Confirm OTP code
  $('#btn-submit-email-otp').click(function(e) {
    e.preventDefault();
    const newEmail = $('#contactEmail').val().trim();
    const otpCode = $('#email-verification-otp-code').val().trim();

    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP.');
      return;
    }

    const btn = $(this);
    btn.prop('disabled', true).text('Confirming...');

    $.ajax({
      url: '/api/settings/verify-otp',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email: newEmail, otp: otpCode }),
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        btn.prop('disabled', false).text('Confirm');
        if (res.success) {
          showToast('Email verified and updated successfully!');
          savedEmail = newEmail;
          isEmailVerified = true;
          updateEmailVerificationStatus(newEmail);
          $('#email-otp-verification-section').hide();
          $('#btn-trigger-email-otp').hide();
        }
      },
      error: function(err) {
        btn.prop('disabled', false).text('Confirm');
        alert(err.responseJSON?.message || 'Verification failed. Incorrect or expired OTP.');
      }
    });
  });

  // Cancel OTP verification
  $('#btn-cancel-email-otp').click(function(e) {
    e.preventDefault();
    $('#email-otp-verification-section').hide();
  });

  // Validate site logo format
  $('#logo').change(function() {
    const file = this.files[0];
    if (file) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('Unsupported file format. Supported formats: PNG, JPG, JPEG, WEBP.');
        $(this).val('');
      }
    }
  });

  // Submit edits
  $('#settings-form').submit(function(e) {
    e.preventDefault();

    // Check if email is verified
    if ($('#email-verification-badge').text() === 'Unverified') {
      alert('Please verify your new email address via OTP first, or revert it back to the original verified email.');
      return;
    }

    const formData = new FormData(this);

    // Map social fields to correct payload names
    formData.append('facebook', $('#fbLink').val());
    formData.append('instagram', $('#instaLink').val());
    formData.append('linkedin', $('#linkedinLink').val());
    formData.append('youtube', $('#ytLink').val());

    // Map SEO fields
    formData.append('defaultMetaTitle', $('#defaultMetaTitle').val());
    formData.append('defaultMetaDescription', $('#defaultMetaDescription').val());
    formData.append('defaultKeywords', $('#defaultKeywords').val());

    $.ajax({
      url: '/api/settings',
      method: 'PUT',
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        if (res.success) {
          showToast('Website configurations updated successfully!');
          if (res.settings.logo && res.settings.logo.url) {
            $('#logo-preview').html(`<img src="${res.settings.logo.url}" style="height:60px; width:auto;">`);
          }
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Save failed', 'error');
      }
    });
  });
}

// --- Categories Manager CRUD ---
function initAdminCategories() {
  let editProjectCatId = null;
  let editBlogCatId = null;

  window.setupModuleRefresh('#tab-categories .data-card:first-child .card-header', 'btn-refresh-project-cats', loadProjectCatsList);
  window.setupModuleRefresh('#tab-categories .data-card:last-child .card-header', 'btn-refresh-blog-cats', loadBlogCatsList);
  window.setupModuleRefresh('#tab-cities .data-card .card-header', 'btn-refresh-cities', loadCitiesList);

  loadProjectCatsList();
  loadBlogCatsList();

  // Tabs Navigation click binding
  $('.tab-btn').click(function(e) {
    e.preventDefault();
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');

    const tabName = $(this).attr('data-tab');
    $('.tab-pane').hide();
    $('#tab-' + tabName).show();
  });

  // --- Project Categories Actions ---
  $('#btn-add-project-cat').click(function() {
    editProjectCatId = null;
    $('#project-cat-modal-title').text('Add Project Category');
    $('#project-cat-form')[0].reset();
    $('#project-cat-modal').addClass('open');
  });

  $('#btn-cancel-project-cat, #project-cat-modal .modal-close').click(function() {
    $('#project-cat-modal').removeClass('open');
  });

  $('#project-cat-form').submit(function(e) {
    e.preventDefault();
    const data = {
      name: $('#project-cat-name').val(),
      status: $('#project-cat-status').val()
    };
    const url = editProjectCatId ? `/api/project-categories/${editProjectCatId}` : '/api/project-categories';
    const method = editProjectCatId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: data,
      success: function(res) {
        if (res.success) {
          showToast(editProjectCatId ? 'Project category updated!' : 'Project category created!');
          $('#project-cat-modal').removeClass('open');
          loadProjectCatsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  $(document).on('click', '.edit-project-cat-btn', function() {
    const id = $(this).data('id');
    editProjectCatId = id;
    $.get('/api/project-categories?admin=true', function(res) {
      const cat = res.categories.find(c => c._id === id);
      if (cat) {
        $('#project-cat-modal-title').text('Edit Project Category');
        $('#project-cat-name').val(cat.name);
        $('#project-cat-status').val(cat.status);
        $('#project-cat-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-project-cat-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this project category?')) {
      $.ajax({
        url: `/api/project-categories/${id}`,
        method: 'DELETE',
        success: function() {
          showToast('Project category deleted successfully!');
          loadProjectCatsList();
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });

  // --- Blog Categories Actions ---
  $('#btn-add-blog-cat').click(function() {
    editBlogCatId = null;
    $('#blog-cat-modal-title').text('Add Blog Category');
    $('#blog-cat-form')[0].reset();
    $('#blog-cat-modal').addClass('open');
  });

  $('#btn-cancel-blog-cat, #blog-cat-modal .modal-close').click(function() {
    $('#blog-cat-modal').removeClass('open');
  });

  $('#blog-cat-form').submit(function(e) {
    e.preventDefault();
    const data = {
      name: $('#blog-cat-name').val(),
      status: $('#blog-cat-status').val()
    };
    const url = editBlogCatId ? `/api/blog-categories/${editBlogCatId}` : '/api/blog-categories';
    const method = editBlogCatId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: data,
      success: function(res) {
        if (res.success) {
          showToast(editBlogCatId ? 'Blog category updated!' : 'Blog category created!');
          $('#blog-cat-modal').removeClass('open');
          loadBlogCatsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  $(document).on('click', '.edit-blog-cat-btn', function() {
    const id = $(this).data('id');
    editBlogCatId = id;
    $.get('/api/blog-categories?admin=true', function(res) {
      const cat = res.categories.find(c => c._id === id);
      if (cat) {
        $('#blog-cat-modal-title').text('Edit Blog Category');
        $('#blog-cat-name').val(cat.name);
        $('#blog-cat-status').val(cat.status);
        $('#blog-cat-modal').addClass('open');
      }
    });
  });

  $(document).on('click', '.delete-blog-cat-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this blog category?')) {
      $.ajax({
        url: `/api/blog-categories/${id}`,
        method: 'DELETE',
        success: function() {
          showToast('Blog category deleted successfully!');
          loadBlogCatsList();
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });

  // --- Serving Cities Actions ---
  let editCityId = null;
  loadCitiesList();

  $('#btn-add-city').click(function() {
    editCityId = null;
    $('#city-modal-title').text('Add Serving City');
    $('#city-form')[0].reset();
    $('#city-modal').addClass('open');
  });

  $('#btn-cancel-city, #city-modal .modal-close').click(function() {
    $('#city-modal').removeClass('open');
  });

  $('#city-form').submit(function(e) {
    e.preventDefault();
    const data = {
      name: $('#city-name').val().trim(),
      status: $('#city-status').val()
    };
    const url = editCityId ? `/api/cities/${editCityId}` : '/api/cities';
    const method = editCityId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      data: data,
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        if (res.success) {
          showToast(editCityId ? 'Serving city updated!' : 'Serving city created!');
          $('#city-modal').removeClass('open');
          loadCitiesList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Error occurred', 'error');
      }
    });
  });

  $(document).on('click', '.edit-city-btn', function() {
    const id = $(this).data('id');
    editCityId = id;
    $.get('/api/cities', function(res) {
      if (res.success) {
        const city = res.cities.find(c => c._id === id);
        if (city) {
          $('#city-modal-title').text('Edit Serving City');
          $('#city-name').val(city.name);
          $('#city-status').val(city.status);
          $('#city-modal').addClass('open');
        }
      }
    });
  });

  $(document).on('click', '.delete-city-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to delete this serving city?')) {
      $.ajax({
        url: `/api/cities/${id}`,
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
        },
        success: function(res) {
          if (res.success) {
            showToast('Serving city deleted successfully!');
            loadCitiesList();
          }
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Error deleting city', 'error');
        }
      });
    }
  });

  function loadCitiesList(callback) {
    $.get('/api/cities', function(res) {
      if (res.success) {
        let rows = '';
        res.cities.forEach(city => {
          rows += `
            <tr>
              <td><strong>${city.name}</strong></td>
              <td><span class="status-pill ${city.status.toLowerCase()}">${city.status}</span></td>
              <td>
                <div class="actions-cell">
                  <button class="icon-btn icon-btn-edit edit-city-btn" data-id="${city._id}"><i class="fas fa-edit"></i></button>
                  <button class="icon-btn icon-btn-delete delete-city-btn" data-id="${city._id}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td>
            </tr>
          `;
        });
        $('#cities-table-body').html(rows || '<tr><td colspan="3" class="text-center">No serving cities found.</td></tr>');
      }
      if (typeof callback === 'function') callback();
    }).fail(function() {
      if (typeof callback === 'function') callback();
    });
  }
}

function loadProjectCatsList(callback) {
  $.get('/api/project-categories?admin=true', function(res) {
    if (res.success) {
      let rows = '';
      res.categories.forEach(c => {
        rows += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td><span class="status-pill ${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-edit edit-project-cat-btn" data-id="${c._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-project-cat-btn" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#project-cats-table-body').html(rows || '<tr><td colspan="3" class="text-center">No categories found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

function loadBlogCatsList(callback) {
  $.get('/api/blog-categories?admin=true', function(res) {
    if (res.success) {
      let rows = '';
      res.categories.forEach(c => {
        rows += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td><span class="status-pill ${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-edit edit-blog-cat-btn" data-id="${c._id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn icon-btn-delete delete-blog-cat-btn" data-id="${c._id}"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      $('#blog-cats-table-body').html(rows || '<tr><td colspan="3" class="text-center">No categories found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Role Matrix & Sub-Admins CRUD ---
function initAdminSubAccounts() {
  let editAdminId = null;
  window.setupModuleRefresh('.data-card .card-header', 'btn-refresh-admins', loadAdminsList);
  loadAdminsList();

  function applyRoleDefaultPermissions(roleVal) {
    if (roleVal === 'Viewer') {
      $('.perm-check').each(function() {
        const val = $(this).val();
        if (val.endsWith('_view')) {
          $(this).prop('checked', true);
        } else {
          $(this).prop('checked', false);
        }
      });
    } else if (roleVal === 'Editor') {
      $('.perm-check').each(function() {
        const val = $(this).val();
        if (val.startsWith('report_')) {
          $(this).prop('checked', false);
        } else {
          $(this).prop('checked', true);
        }
      });
    } else if (roleVal === 'SuperAdmin') {
      $('.perm-check').prop('checked', true);
    }
  }

  $('#admin-role').change(function() {
    applyRoleDefaultPermissions($(this).val());
  });

  $('#btn-add-admin').click(function() {
    editAdminId = null;
    $('#admin-modal-title').text('Create Admin Account');
    $('#admin-form')[0].reset();
    $('#pwd-required-badge').show();
    $('#admin-password').prop('required', true);
    applyRoleDefaultPermissions('Editor'); // Editor default permissions
    $('#admin-modal').addClass('open');
  });

  $('.modal-close, #btn-cancel-admin').click(function() {
    $('#admin-modal').removeClass('open');
  });

  $('#admin-form').submit(function(e) {
    e.preventDefault();
    
    // Build permissions list
    const permissions = [];
    $('.perm-check:checked').each(function() {
      permissions.push($(this).val());
    });

    const data = {
      name: $('#admin-name').val(),
      role: $('#admin-role').val(),
      email: $('#admin-email').val(),
      phone: $('#admin-phone').val(),
      username: $('#admin-username').val(),
      password: $('#admin-password').val(),
      permissions: permissions
    };

    const url = editAdminId ? `/api/auth/admins/${editAdminId}` : '/api/auth/admins';
    const method = editAdminId ? 'PUT' : 'POST';

    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(res) {
        if (res.success) {
          showToast(editAdminId ? 'Sub-account updated!' : 'Sub-account created successfully!');
          $('#admin-modal').removeClass('open');
          loadAdminsList();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Action failed', 'error');
      }
    });
  });

  $(document).on('click', '.edit-admin-btn', function() {
    const id = $(this).data('id');
    editAdminId = id;
    
    $.get('/api/auth/admins', function(res) {
      if (res.success) {
        const ad = res.admins.find(x => x._id === id);
        if (ad) {
          $('#admin-modal-title').text('Edit Admin Account');
          $('#admin-name').val(ad.name);
          $('#admin-role').val(ad.role);
          $('#admin-email').val(ad.email);
          $('#admin-phone').val(ad.phone);
          $('#admin-username').val(ad.username);
          
          // Password is not required when editing
          $('#pwd-required-badge').hide();
          $('#admin-password').prop('required', false).val('');
          
          // Clear checkboxes and check the ones assigned
          $('.perm-check').prop('checked', false);
          if (ad.permissions && Array.isArray(ad.permissions)) {
            ad.permissions.forEach(p => {
              $(`.perm-check[value="${p}"]`).prop('checked', true);
            });
          }

          $('#admin-modal').addClass('open');
        }
      }
    });
  });

  $(document).on('click', '.delete-admin-btn', function() {
    const id = $(this).data('id');
    if (confirm('Are you sure you want to permanently delete this sub-admin account?')) {
      $.ajax({
        url: `/api/auth/admins/${id}`,
        method: 'DELETE',
        success: function(res) {
          if (res.success) {
            showToast('Account deleted successfully');
            loadAdminsList();
          }
        },
        error: function(err) {
          showToast(err.responseJSON?.message || 'Delete failed', 'error');
        }
      });
    }
  });
}

function loadAdminsList(callback) {
  $.get('/api/auth/admins', function(res) {
    if (res.success) {
      let rows = '';
      res.admins.forEach(ad => {
        const photo = ad.profilePicture && ad.profilePicture.url 
          ? `<img src="${ad.profilePicture.url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--border);">` 
          : `<div style="width:40px; height:40px; border-radius:50%; background:#E5E7EB; color:#4B5563; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-user"></i></div>`;

        // Format permissions as badges
        let badges = '';
        if (ad.role === 'SuperAdmin') {
          badges = `<span class="status-pill active" style="font-weight: 600;">ALL ACCESS</span>`;
        } else if (ad.permissions && ad.permissions.length > 0) {
          ad.permissions.forEach(p => {
            badges += `<span class="status-pill active" style="margin-right: 4px; margin-bottom: 4px; font-size:0.75rem; text-transform:uppercase;">${p}</span>`;
          });
        } else {
          badges = `<span class="status-pill disabled" style="font-size:0.75rem;">NO ACCESS</span>`;
        }

        // Action buttons (prevent deleting own logged-in account)
        const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const deleteButton = currentUser.id === ad._id 
          ? `<button class="icon-btn icon-btn-delete" disabled style="opacity: 0.3; cursor: not-allowed;" title="You cannot delete yourself"><i class="fas fa-trash-alt"></i></button>`
          : `<button class="icon-btn icon-btn-delete delete-admin-btn" data-id="${ad._id}"><i class="fas fa-trash-alt"></i></button>`;

        rows += `
          <tr>
            <td>${photo}</td>
            <td><strong>${ad.name}</strong><br><small style="color:var(--text-gray);">${ad.email || 'No email'}</small></td>
            <td>${ad.username}</td>
            <td><span class="status-pill ${ad.role === 'SuperAdmin' ? 'active' : 'inactive'}">${ad.role}</span></td>
            <td style="max-width:350px; white-space:normal; overflow:visible;">${badges}</td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn icon-btn-edit edit-admin-btn" data-id="${ad._id}"><i class="fas fa-edit"></i></button>
                ${deleteButton}
              </div>
            </td>
          </tr>
        `;
      });
      $('#admins-table-body').html(rows || '<tr><td colspan="6" class="text-center">No other admin accounts found.</td></tr>');
    }
    if (typeof callback === 'function') callback();
  }).fail(function() {
    if (typeof callback === 'function') callback();
  });
}

// --- Admin profile manager ---
function initAdminProfile() {
  loadProfileData();

  // Trigger file input click
  $('#change-photo-btn').click(function() {
    $('#profilePicture').click();
  });

  // Handle live preview of uploaded profile image
  $('#profilePicture').change(function() {
    const file = this.files[0];
    if (file) {
      const allowedExts = ['png', 'jpg', 'jpeg', 'webp'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        alert('Unsupported file format. Supported formats: PNG, JPG, JPEG, WEBP.');
        $(this).val('');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        $('#profile-avatar-box').html(`<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`);
      };
      reader.readAsDataURL(file);
    }
  });

  // Save profile edits
  $('#profile-info-form').submit(function(e) {
    e.preventDefault();
    const formData = new FormData(this);

    $.ajax({
      url: '/api/auth/profile',
      method: 'PUT',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      success: function(res) {
        if (res.success) {
          showToast('Profile settings updated successfully!');
          localStorage.setItem('admin_user', JSON.stringify(res.admin));
          loadProfileData();
          
          // Force header updates
          $('#admin-user-display').text(res.admin.username || 'Admin');
          if (res.admin.profilePicture && res.admin.profilePicture.url) {
            $('.header-user img').remove();
            $('.header-user').prepend(`<img src="${res.admin.profilePicture.url}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; margin-right:8px; border:2px solid var(--primary);">`);
            $('.header-user i.fa-user-circle').hide();
          }
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Profile save failed', 'error');
      }
    });
  });

  // Change password submit
  $('#profile-password-form').submit(function(e) {
    e.preventDefault();
    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmNewPassword = $('#confirmNewPassword').val();

    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    const data = { currentPassword, newPassword };

    $.ajax({
      url: '/api/auth/change-password',
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(res) {
        if (res.success) {
          showToast('Password changed successfully!');
          $('#profile-password-form')[0].reset();
        }
      },
      error: function(err) {
        showToast(err.responseJSON?.message || 'Password update failed', 'error');
      }
    });
  });
}

function loadProfileData() {
  $.ajax({
    url: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
    },
    success: function(res) {
      if (res.success && res.admin) {
        const admin = res.admin;
        $('#profile-name').val(admin.name);
        $('#profile-email').val(admin.email);
        $('#profile-phone').val(admin.phone || '');

        if (admin.profilePicture && admin.profilePicture.url) {
          $('#profile-avatar-box').html(`<img src="${admin.profilePicture.url}" style="width:100%; height:100%; object-fit:cover;">`);
        } else {
          $('#profile-avatar-box').html(`<span class="text-gray" id="avatar-placeholder" style="font-size:3rem;"><i class="fas fa-user"></i></span>`);
        }
      }
    }
  });
}
