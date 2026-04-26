const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,          // never returned by default
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        // Small flag to track password changes (because virtuals aren't tracked)
        _passwordChanged: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    { timestamps: true }
);

// ----- Virtual for plain password -----
userSchema
    .virtual('password')
    .set(function (plain) {
        this._plainPassword = plain;              // store temporarily
        this._passwordChanged = true;            // mark that password was modified
    })
    .get(function () {
        return this._plainPassword;
    });

// ----- Pre‑validate hook: hash password before validation runs -----
// Must be 'validate' not 'save' because Mongoose validates `required` fields
// BEFORE pre-save hooks, so passwordHash would fail the required check.
userSchema.pre('validate', async function (next) {
    // Only hash if the password was explicitly changed (flag set)
    if (!this._passwordChanged) return next();

    try {
        // Invalidate passwordChanged flag (avoid re‑hashing on subsequent saves)
        this._passwordChanged = false;
        this.passwordHash = await bcrypt.hash(this._plainPassword, SALT_ROUNDS);
        this._plainPassword = undefined;          // clear plaintext from memory
        next();
    } catch (err) {
        next(err);
    }
});

// ----- Instance method for comparison -----
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.passwordHash);
};

// ----- JSON transformation -----
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret._passwordChanged;
        delete ret._plainPassword;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('User', userSchema);