const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const makeUniqueSlug = async (model, title, fieldName = 'slug') => {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = 'item';
  
  let uniqueSlug = baseSlug;
  let count = 1;
  
  while (true) {
    const existing = await model.findOne({ [fieldName]: uniqueSlug });
    if (!existing) {
      break;
    }
    uniqueSlug = `${baseSlug}-${count}`;
    count++;
  }
  
  return uniqueSlug;
};

module.exports = { slugify, makeUniqueSlug };
