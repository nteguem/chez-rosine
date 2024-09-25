const menuContent = `1. *Commander maintenant* - tapez 1\n2. *Promotions et offres spéciales* - tapez 2\n3. *Assistance et contact* - tapez 3`;

const adminMenuContent = `
1️⃣ Faire une campagne, tapez 1.

Administration - Optimisez vos opérations avec efficacité et précision 🚀`;

const adminMenuData = (name, isWelcome) => {
  return isWelcome
    ? `🏠 Votre menu d'administration :
  
${adminMenuContent}`
    : `Salut ${name},\n\n Bienvenue dans l'espace d'administration de Predictfoot. Nous sommes ici pour vous aider à gérer efficacement toutes les opérations.

${adminMenuContent}`;
};


const menuData = (name, isWelcome,products) => {
  return isWelcome
    ? `🏠 Que souhaitez-vous faire aujourd'hui ? Tapez le numéro correspondant pour continuer :\n\n${menuContent}`
    : `👋 ${name}, Bienvenue chez Rosine 🍽️ ,\n\n  Nous proposons les produits délicieux à base de viande ou de poisson : \n${products} \nQue souhaitez-vous faire aujourd'hui ? Tapez le numéro correspondant pour continuer :

${menuContent}`; 
};

module.exports = { menuData,adminMenuData };
