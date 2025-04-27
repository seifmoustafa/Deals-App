const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true,
    },
    image: {
      url: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

announcementSchema.index({ deleted_at: 1 });

announcementSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

announcementSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

announcementSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

announcementSchema.statics.softDelete = async function (announcementId) {
  return this.findByIdAndUpdate(announcementId, {
    deleted_at: new Date(),
    is_active: false,
  });
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
