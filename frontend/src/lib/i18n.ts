export type SupportedLanguage = 'en' | 'nl' | 'de' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  searching: string;
  recentSearches: string;
  noRecentSearches: string;
  noProductsFound: string;
  noProductsFoundDesc: string;
  brandUnknown: string;
  barcodeLabel: string;
  categoriesLabel: string;
  ingredientsLabel: string;
  noIngredients: string;
  nutritionTitle: string;
  nutritionPer100g: string;
  calories: string;
  energyKj: string;
  fat: string;
  saturatedFat: string;
  carbs: string;
  sugars: string;
  fiber: string;
  proteins: string;
  salt: string;
  sodium: string;
  nutritionLockedTitle: string;
  nutritionLockedDesc: string;
  upgradeToPro: string;
  statusFree: string;
  statusPro: string;
  statusPastDue: string;
  subscribing: string;
  paymentSuccessTitle: string;
  paymentSuccessDesc: string;
  paymentCancelTitle: string;
  paymentCancelDesc: string;
  dismiss: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle: 'FoodSearch Pro',
    appSubtitle: 'Search packaged foods worldwide with verified nutritional data',
    searchPlaceholder: 'Search by product name, brand, or barcode...',
    searchButton: 'Search',
    searching: 'Searching products...',
    recentSearches: 'Recent Searches',
    noRecentSearches: 'No recent searches recorded yet.',
    noProductsFound: 'No Products Found',
    noProductsFoundDesc: 'Try searching with different terms or check spelling.',
    brandUnknown: 'Unknown Brand',
    barcodeLabel: 'Barcode',
    categoriesLabel: 'Categories',
    ingredientsLabel: 'Ingredients',
    noIngredients: 'Ingredient details not available for this product.',
    nutritionTitle: 'Nutritional Facts',
    nutritionPer100g: 'Values per 100g',
    calories: 'Energy (Calories)',
    energyKj: 'Energy (kJ)',
    fat: 'Total Fat',
    saturatedFat: 'Saturated Fat',
    carbs: 'Carbohydrates',
    sugars: 'Sugars',
    fiber: 'Dietary Fiber',
    proteins: 'Proteins',
    salt: 'Salt',
    sodium: 'Sodium',
    nutritionLockedTitle: 'Nutritional Values Paywalled',
    nutritionLockedDesc: 'Detailed macro breakdown and nutritional data require an active subscription.',
    upgradeToPro: 'Unlock with Pro (€4.99/mo)',
    statusFree: 'Demo Free Tier',
    statusPro: 'Pro Subscriber',
    statusPastDue: 'Payment Past Due',
    subscribing: 'Redirecting to Stripe...',
    paymentSuccessTitle: 'Subscription Activated!',
    paymentSuccessDesc: 'Your account is now Pro. Full nutritional metrics are unlocked.',
    paymentCancelTitle: 'Checkout Cancelled',
    paymentCancelDesc: 'No charges were made. You can upgrade anytime.',
    dismiss: 'Dismiss',
  },
  nl: {
    appTitle: 'FoodSearch Pro',
    appSubtitle: 'Zoek wereldwijd naar verpakte voedingsmiddelen met geverifieerde voedingswaarden',
    searchPlaceholder: 'Zoek op productnaam, merk of barcode...',
    searchButton: 'Zoeken',
    searching: 'Producten zoeken...',
    recentSearches: 'Recente Zoekopdrachten',
    noRecentSearches: 'Nog geen recente zoekopdrachten geregistreerd.',
    noProductsFound: 'Geen Producten Gevonden',
    noProductsFoundDesc: 'Probeer een andere zoekterm of controleer de spelling.',
    brandUnknown: 'Onbekend Merk',
    barcodeLabel: 'Streepjescode',
    categoriesLabel: 'Categorieën',
    ingredientsLabel: 'Ingrediënten',
    noIngredients: 'Ingrediëntendetails niet beschikbaar voor dit product.',
    nutritionTitle: 'Voedingswaarden',
    nutritionPer100g: 'Waarden per 100g',
    calories: 'Energie (Calorieën)',
    energyKj: 'Energie (kJ)',
    fat: 'Totaal Vet',
    saturatedFat: 'Verzadigd Vet',
    carbs: 'Koolhydraten',
    sugars: 'Suikers',
    fiber: 'Voedingsvezels',
    proteins: 'Eiwitten',
    salt: 'Zout',
    sodium: 'Natrium',
    nutritionLockedTitle: 'Voedingswaarden Vergrendeld',
    nutritionLockedDesc: 'Gedetailleerde macro-analyse en voedingswaarden vereisen een actief abonnement.',
    upgradeToPro: 'Ontgrendel met Pro (€4,99/mnd)',
    statusFree: 'Demo Gratis Niveau',
    statusPro: 'Pro Abonnee',
    statusPastDue: 'Betaling Achterstallig',
    subscribing: 'Doorverwijzen naar Stripe...',
    paymentSuccessTitle: 'Abonnement Geactiveerd!',
    paymentSuccessDesc: 'Uw account is nu Pro. Alle voedingswaarden zijn ontgrendeld.',
    paymentCancelTitle: 'Betaling Geannuleerd',
    paymentCancelDesc: 'Er zijn geen kosten in rekening gebracht.',
    dismiss: 'Sluiten',
  },
  de: {
    appTitle: 'FoodSearch Pro',
    appSubtitle: 'Suchen Sie weltweit nach verpackten Lebensmitteln mit Nährwertdaten',
    searchPlaceholder: 'Nach Produktname, Marke oder Barcode suchen...',
    searchButton: 'Suchen',
    searching: 'Produkte suchen...',
    recentSearches: 'Letzte Suchanfragen',
    noRecentSearches: 'Noch keine Suchanfragen aufgezeichnet.',
    noProductsFound: 'Keine Produkte Gefunden',
    noProductsFoundDesc: 'Versuchen Sie einen anderen Begriff oder prüfen Sie die Schreibweise.',
    brandUnknown: 'Unbekannte Marke',
    barcodeLabel: 'Strichcode',
    categoriesLabel: 'Kategorien',
    ingredientsLabel: 'Zutaten',
    noIngredients: 'Zutatenangaben für dieses Produkt nicht verfügbar.',
    nutritionTitle: 'Nährwertangaben',
    nutritionPer100g: 'Werte pro 100g',
    calories: 'Energie (Kalorien)',
    energyKj: 'Energie (kJ)',
    fat: 'Fett',
    saturatedFat: 'Gesättigte Fettsäuren',
    carbs: 'Kohlenhydrate',
    sugars: 'Zucker',
    fiber: 'Ballaststoffe',
    proteins: 'Eiweiß',
    salt: 'Salz',
    sodium: 'Natrium',
    nutritionLockedTitle: 'Nährwertdaten Gesperrt',
    nutritionLockedDesc: 'Detaillierte Nährwert- und Makroanalysen erfordern ein aktives Abonnement.',
    upgradeToPro: 'Mit Pro freischalten (4,99 €/Monat)',
    statusFree: 'Demo Kostenlose Stufe',
    statusPro: 'Pro Abonnent',
    statusPastDue: 'Zahlung Überfällig',
    subscribing: 'Weiterleitung zu Stripe...',
    paymentSuccessTitle: 'Abonnement Aktiviert!',
    paymentSuccessDesc: 'Ihr Konto ist jetzt Pro. Alle Nährwertdaten sind freigeschaltet.',
    paymentCancelTitle: 'Zahlung Abgebrochen',
    paymentCancelDesc: 'Es wurden keine Gebühren erhoben.',
    dismiss: 'Schließen',
  },
  fr: {
    appTitle: 'FoodSearch Pro',
    appSubtitle: 'Recherchez des aliments emballés dans le monde entier avec données nutritionnelles',
    searchPlaceholder: 'Rechercher par nom, marque ou code-barres...',
    searchButton: 'Rechercher',
    searching: 'Recherche en cours...',
    recentSearches: 'Recherches Récentes',
    noRecentSearches: 'Aucune recherche enregistrée pour le moment.',
    noProductsFound: 'Aucun Produit Trouvé',
    noProductsFoundDesc: 'Essayez un autre mot-clé ou vérifiez l’orthographe.',
    brandUnknown: 'Marque Inconnue',
    barcodeLabel: 'Code-barres',
    categoriesLabel: 'Catégories',
    ingredientsLabel: 'Ingrédients',
    noIngredients: 'Informations sur les ingrédients indisponibles.',
    nutritionTitle: 'Valeurs Nutritionnelles',
    nutritionPer100g: 'Valeurs pour 100g',
    calories: 'Énergie (Calories)',
    energyKj: 'Énergie (kJ)',
    fat: 'Matières grasses',
    saturatedFat: 'Acides gras saturés',
    carbs: 'Glucides',
    sugars: 'Sucres',
    fiber: 'Fibres alimentaires',
    proteins: 'Protéines',
    salt: 'Sel',
    sodium: 'Sodium',
    nutritionLockedTitle: 'Données Nutritionnelles Verrouillées',
    nutritionLockedDesc: 'L’analyse détaillée des nutriments nécessite un abonnement actif.',
    upgradeToPro: 'Débloquer avec Pro (4,99 €/mois)',
    statusFree: 'Niveau Démo Gratuit',
    statusPro: 'Abonné Pro',
    statusPastDue: 'Paiement En Retard',
    subscribing: 'Redirection vers Stripe...',
    paymentSuccessTitle: 'Abonnement Activé !',
    paymentSuccessDesc: 'Votre compte est Pro. Toutes les données nutritionnelles sont débloquées.',
    paymentCancelTitle: 'Paiement Annulé',
    paymentCancelDesc: 'Aucun montant n’a été débité.',
    dismiss: 'Fermer',
  },
};