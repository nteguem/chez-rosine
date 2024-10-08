const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userRoles = ['admin', 'user', 'deliveryPerson'];

const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullname: { type: String },
  location: { type: String }, 
  engagementLevel: { type: Number }, 
  role: { 
    type: String, 
    required: true, 
    enum: userRoles, 
    default: 'user' 
  }, 
  referralCode: { type: String, unique: true },
  // Champs spécifiques pour les livreurs
  deliveryStatus: { 
    type: String, 
    enum: ['available', 'busy', 'offline'], 
    default: 'available' 
  }, 
}, { timestamps: true });

// Génération du code de parrainage unique
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Middleware avant sauvegarde : génération du code de parrainage et hashage du mot de passe
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    let code;
    let user;
    do {
      code = generateReferralCode();
      user = await mongoose.models.User.findOne({ referralCode: code });
    } while (user);
    this.referralCode = code;
  }

  // Hash du mot de passe avant sauvegarde si modifié
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
