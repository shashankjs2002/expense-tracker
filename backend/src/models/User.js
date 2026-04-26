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
        // Hashed password; never leaked by default
        passwordHash: {
            type: String,
            required: true,
            select: false,   // exclude from queries unless explicitly .select('+passwordHash')
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
    },
    { timestamps: true }   // adds createdAt, updatedAt
);

// ----- Virtual for setting plain-text password -----
// This is never stored; it only exists when we set user.password = '...'
userSchema.virtual('password')
    .set(function (plain) {
        this._password = plain;   // store temporarily so pre-save can access it
    })
    .get(function () {
        return this._password;
    });

// ----- Pre-save hook to hash password -----
userSchema.pre('save', async function (next) {
    // Only hash if the password virtual was set (new or changing)
    if (!this.isModified('password')) return next();

    try {
        this.passwordHash = await bcrypt.hash(this._password, SALT_ROUNDS);
        next();
    } catch (err) {
        next(err);
    }
});

// ----- Instance method for password comparison -----
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.passwordHash);
};

// ----- Remove the temporary plain password after hashing -----
userSchema.post('save', function () {
    // Ensure the plain text is not hanging around (security best practice)
    this._password = undefined;
});

// ----- JSON transformation: never expose passwordHash or __v -----
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('User', userSchema);