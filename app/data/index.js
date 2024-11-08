const menuContent = `1. *Commander maintenant* - tapez 1\n2. *Promotions et offres spéciales* - tapez 2\n3. *Discuter directement avec un membre de notre équipe* - tapez 3`;

const adminMenuContent = `
1️⃣ Faire une campagne, tapez 1.

Administration - Optimisez vos opérations avec efficacité et précision 🚀`;

const adminMenuData = (name, isWelcome) => {
  return isWelcome
    ? `🏠 Votre menu d'administration :
  
${adminMenuContent}`
    : `Salut ${name},\n\n Bienvenue dans l'espace d'administration des bons plats. Nous sommes ici pour vous aider à gérer efficacement toutes les opérations.

${adminMenuContent}`;
};


const menuData = (name, isWelcome, products) => {
  return isWelcome
    ? `🏠 Que souhaitez-vous faire aujourd'hui ? Tapez le numéro correspondant pour continuer :\n\n${menuContent}\n\nVous pouvez également consulter notre catalogue : www.catalogue.fr 📖`
    : `Salut ${name}, bienvenue chez Les Bons Plats ! 🍽️\n\n
Je suis votre assistant virtuel, ici pour vous aider à passer vos commandes rapidement !\n\n
Que souhaitez-vous faire aujourd'hui ? Tapez le numéro correspondant pour continuer :\n\n${menuContent}\n\nVous pouvez également consulter notre catalogue : www.catalogue.fr 📖`;
};

module.exports = { menuData, adminMenuData };
