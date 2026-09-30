import { Dish } from '../types';

export interface SampleMenu {
  id: string;
  name: string;
  cuisine: string;
  tagline: string;
  rawText: string;
  defaultDishes: Omit<Dish, 'variations'>[];
}

export const SAMPLE_MENUS: SampleMenu[] = [
  {
    id: 'trattoria-bella',
    name: 'Trattoria Della Nonna',
    cuisine: 'Authentic Northern Italian',
    tagline: 'Handmade pasta, slow-braised ragùs, and wood-fired craftsmanship.',
    rawText: `Trattoria Della Nonna - Autumn Tasting Menu

STARTERS
1. Burrata Pugliese con Fichi - $18
Creamy artisanal Puglia burrata on grilled sourdough with caramelized black mission figs, 25-year aged balsamic drizzle, toasted pine nuts, and micro basil.

2. Carpaccio di Manzo al Tartufo - $22
Paper-thin prime beef tenderloin with shaved black summer truffles, caperberries, 36-month Parmigiano-Reggiano petals, and cold-pressed Tuscan olive oil.

PRIMI & MAINS
3. Tagliolini al Tartufo Bianco - $34
Handmade egg pasta ribbons tossed in cultured butter, emulsion of Parmigiano broth, and crowned with freshly shaved white Alba truffles.

4. Osso Buco alla Milanese - $42
Milk-fed veal shank braised for 8 hours in Pinot Grigio and aromatic root vegetables, served over saffron-infused risotto Milanese with fresh lemon gremolata.

5. Branzino al Forno - $38
Crispy skin Mediterranean sea bass roasted with Meyer lemon wheels, Castelvetrano olives, caper blossoms, and fresh rosemary sprigs in a light white wine glaze.

DESSERTS
6. Tiramisù al Mascarpone Tradizionale - $14
Savoiardi ladyfingers steeped in single-origin espresso and dark rum, layered with whipped zabaglione mascarpone and dusted with Valrhona Dutch cocoa.`,
    defaultDishes: [
      {
        id: 'dish-1',
        name: 'Burrata Pugliese con Fichi',
        category: 'Starters',
        description: 'Creamy artisanal Puglia burrata on grilled sourdough with caramelized black mission figs, 25-year aged balsamic drizzle, toasted pine nuts, and micro basil.',
        price: '$18',
        keyIngredients: ['Puglia Burrata', 'Black Mission Figs', 'Aged Balsamic', 'Grilled Sourdough', 'Pine Nuts'],
        suggestedProps: ['Charcoal ceramic plate', 'Vintage brass olive oil pourer', 'Fresh basil bouquet'],
      },
      {
        id: 'dish-2',
        name: 'Carpaccio di Manzo al Tartufo',
        category: 'Starters',
        description: 'Paper-thin prime beef tenderloin with shaved black summer truffles, caperberries, 36-month Parmigiano-Reggiano petals, and cold-pressed Tuscan olive oil.',
        price: '$22',
        keyIngredients: ['Prime Beef Tenderloin', 'Black Truffles', 'Parmigiano-Reggiano', 'Caperberries'],
        suggestedProps: ['Dark slate slab', 'Micro arugula garnish', 'Black pepper mill'],
      },
      {
        id: 'dish-3',
        name: 'Tagliolini al Tartufo Bianco',
        category: 'Primi & Mains',
        description: 'Handmade egg pasta ribbons tossed in cultured butter, emulsion of Parmigiano broth, and crowned with freshly shaved white Alba truffles.',
        price: '$34',
        keyIngredients: ['Egg Tagliolini', 'Cultured Butter', 'Parmigiano Broth', 'Fresh Alba White Truffles'],
        suggestedProps: ['Hand-thrown wide rim shallow bowl', 'Silver fork twist', 'Truffle slicer'],
      },
      {
        id: 'dish-4',
        name: 'Osso Buco alla Milanese',
        category: 'Primi & Mains',
        description: 'Milk-fed veal shank braised for 8 hours in Pinot Grigio and aromatic root vegetables, served over saffron-infused risotto Milanese with fresh lemon gremolata.',
        price: '$42',
        keyIngredients: ['Braised Veal Shank', 'Bone Marrow', 'Saffron Risotto', 'Lemon Gremolata'],
        suggestedProps: ['Cast iron skillet or deep rustic platter', 'Glass of Nebbiolo red wine', 'Sprig of thyme'],
      },
      {
        id: 'dish-5',
        name: 'Branzino al Forno',
        category: 'Primi & Mains',
        description: 'Crispy skin Mediterranean sea bass roasted with Meyer lemon wheels, Castelvetrano olives, caper blossoms, and fresh rosemary sprigs in a light white wine glaze.',
        price: '$38',
        keyIngredients: ['Mediterranean Sea Bass', 'Meyer Lemons', 'Castelvetrano Olives', 'Rosemary', 'White Wine'],
        suggestedProps: ['Oval ceramic fish serving platter', 'Sea salt crystal flakes', 'Crusty bread'],
      },
      {
        id: 'dish-6',
        name: 'Tiramisù al Mascarpone Tradizionale',
        category: 'Desserts',
        description: 'Savoiardi ladyfingers steeped in single-origin espresso and dark rum, layered with whipped zabaglione mascarpone and dusted with Valrhona Dutch cocoa.',
        price: '$14',
        keyIngredients: ['Savoiardi Ladyfingers', 'Espresso', 'Dark Rum', 'Mascarpone', 'Valrhona Cocoa Powder'],
        suggestedProps: ['Vintage dessert spoon', 'Espresso cup with crema', 'Dark wood coaster'],
      },
    ],
  },
  {
    id: 'laura-bistro',
    name: "L'Aura Modern Kitchen",
    cuisine: 'Modern French & Nordic Bistro',
    tagline: 'Clean lines, botanical infusions, hyper-seasonal forage, and artistic plating.',
    rawText: `L'Aura Modern Kitchen - Seasonal Menu

APPETIZERS
1. Smoked Heritage Beet Tartare - $19
Salt-baked smoked golden and candy beets, whipped goat curd, pickled mustard seeds, rye crisp shards, and chive emulsion.

2. Pan-Seared Hokkaido Scallops - $26
Caramelized jumbo sea scallops on cauliflower velouté, brown butter foam, crispy lardo ribbons, and sea buckthorn oil droplets.

ENTREES
3. Dry-Aged Duck Breast a l'Orange - $44
Moulard duck breast with spiced honey glaze, caramelized parsnip purée, confit baby carrots, blood orange gastrique, and bitter chicory.

4. Wild Morel & Foraged Chanterelle Risotto - $36
Acquerello aged carnaroli rice with mountain morels, black garlic emulsion, shaved pecorino sardo, and crispy sage leaves.

SWEETS
5. Deconstructed Lemon Verbena Meringue - $16
Torched French meringue shards, Meyer lemon curd, candied bergamot peel, basil blossom granita, and shortbread crumb.`,
    defaultDishes: [
      {
        id: 'laura-1',
        name: 'Smoked Heritage Beet Tartare',
        category: 'Appetizers',
        description: 'Salt-baked smoked golden and candy beets, whipped goat curd, pickled mustard seeds, rye crisp shards, and chive emulsion.',
        price: '$19',
        keyIngredients: ['Golden Beets', 'Goat Curd', 'Pickled Mustard Seeds', 'Rye Crisps'],
        suggestedProps: ['Matte stone plate', 'Edible flowers', 'Brushed brass cutlery'],
      },
      {
        id: 'laura-2',
        name: 'Pan-Seared Hokkaido Scallops',
        category: 'Appetizers',
        description: 'Caramelized jumbo sea scallops on cauliflower velouté, brown butter foam, crispy lardo ribbons, and sea buckthorn oil droplets.',
        price: '$26',
        keyIngredients: ['Hokkaido Scallops', 'Cauliflower Velouté', 'Brown Butter', 'Sea Buckthorn'],
        suggestedProps: ['White porcelain coupe', 'Golden drops of herb oil', 'Microgreens'],
      },
      {
        id: 'laura-3',
        name: "Dry-Aged Duck Breast à l'Orange",
        category: 'Entrees',
        description: 'Moulard duck breast with spiced honey glaze, caramelized parsnip purée, confit baby carrots, blood orange gastrique, and bitter chicory.',
        price: '$44',
        keyIngredients: ['Dry-Aged Duck', 'Parsnip Purée', 'Blood Orange Gastrique', 'Confit Carrots'],
        suggestedProps: ['Textured black ceramic plate', 'Sliced rose-pink duck breast', 'Glistening jus'],
      },
      {
        id: 'laura-4',
        name: 'Wild Morel & Foraged Chanterelle Risotto',
        category: 'Entrees',
        description: 'Acquerello aged carnaroli rice with mountain morels, black garlic emulsion, shaved pecorino sardo, and crispy sage leaves.',
        price: '$36',
        keyIngredients: ['Carnaroli Rice', 'Wild Morels', 'Chanterelles', 'Black Garlic', 'Crispy Sage'],
        suggestedProps: ['Low wide bowl', 'Steam rising gently', 'Pecorino curls'],
      },
      {
        id: 'laura-5',
        name: 'Deconstructed Lemon Verbena Meringue',
        category: 'Sweets',
        description: 'Torched French meringue shards, Meyer lemon curd, candied bergamot peel, basil blossom granita, and shortbread crumb.',
        price: '$16',
        keyIngredients: ['Torched Meringue', 'Meyer Lemon Curd', 'Bergamot Peel', 'Granita'],
        suggestedProps: ['Glass or pale celadon dish', 'Pastel accents', 'Dewy mint sprig'],
      },
    ],
  },
  {
    id: 'tokyo-izakaya',
    name: 'Haru Izakaya & Robata',
    cuisine: 'Contemporary Japanese & Robata Grill',
    tagline: 'Charcoal-fired skewers, rich silky ramen broths, and pristine sashimi artistry.',
    rawText: `Haru Izakaya & Robata - Izakaya Special

SMALL PLATES & SASHIMI
1. Hamachi Crudo with Yuzu Kosho - $21
Slices of yellowtail amberjack, spicy citrus yuzu kosho ponzu, thinly sliced serrano pepper, garlic chips, and micro shiso.

2. A5 Wagyu Beef Kushi-yaki - $28
Bincho-tan charcoal grilled Miyazaki A5 wagyu skewers, tare glaze, freshly grated wasabi root, and smoked flake salt.

BOWLS & GRILL
3. 24-Hour Chashu Tonkotsu Ramen - $23
Rich collagen-rich pork marrow broth, hand-pulled wavy noodles, tender torched chashu pork belly, 6-minute ajitsuke tamago egg, menma bamboo shoots, wood ear mushrooms, and fragrant black garlic oil.

4. Miso-Glazed Black Cod (Gindara Saikyo-yaki) - $36
Sablefish marinated for 72 hours in sweet Saikyo white miso and mirin, caramelized over white oak binchotan charcoal with pickled hajikami ginger shoot.

SWEET FINISH
5. Matcha Basque Burnt Cheesecake - $14
Ceremonial grade Uji matcha molten cheesecake with caramelized crust, fresh whipped Hokkaido cream, and sweet red azuki compote.`,
    defaultDishes: [
      {
        id: 'haru-1',
        name: 'Hamachi Crudo with Yuzu Kosho',
        category: 'Small Plates',
        description: 'Slices of yellowtail amberjack, spicy citrus yuzu kosho ponzu, thinly sliced serrano pepper, garlic chips, and micro shiso.',
        price: '$21',
        keyIngredients: ['Yellowtail Hamachi', 'Yuzu Kosho Ponzu', 'Crispy Garlic', 'Micro Shiso'],
        suggestedProps: ['Icy blue ceramic plate', 'Bamboo chopstick rest', 'Ceramic sake cup'],
      },
      {
        id: 'haru-2',
        name: 'A5 Wagyu Beef Kushi-yaki',
        category: 'Small Plates',
        description: 'Bincho-tan charcoal grilled Miyazaki A5 wagyu skewers, tare glaze, freshly grated wasabi root, and smoked flake salt.',
        price: '$28',
        keyIngredients: ['Miyazaki A5 Wagyu', 'Tare Glaze', 'Fresh Wasabi', 'Smoked Sea Salt'],
        suggestedProps: ['Charred cedar wood board', 'Smoky embers', 'Handmade bamboo skewers'],
      },
      {
        id: 'haru-3',
        name: '24-Hour Chashu Tonkotsu Ramen',
        category: 'Bowls & Grill',
        description: 'Rich collagen-rich pork marrow broth, hand-pulled wavy noodles, tender torched chashu pork belly, 6-minute ajitsuke tamago egg, menma bamboo shoots, wood ear mushrooms, and fragrant black garlic oil.',
        price: '$23',
        keyIngredients: ['Tonkotsu Broth', 'Chashu Pork Belly', 'Ramen Noodles', 'Ajitsuke Tamago', 'Black Garlic Mayu'],
        suggestedProps: ['Deep textured ramen bowl', 'Wooden ramen ladle', 'Chopsticks resting on bowl'],
      },
      {
        id: 'haru-4',
        name: 'Miso-Glazed Black Cod (Gindara)',
        category: 'Bowls & Grill',
        description: 'Sablefish marinated for 72 hours in sweet Saikyo white miso and mirin, caramelized over white oak binchotan charcoal with pickled hajikami ginger shoot.',
        price: '$36',
        keyIngredients: ['Black Cod (Gindara)', 'Saikyo White Miso', 'Mirin', 'Hajikami Ginger'],
        suggestedProps: ['Rectangular black stoneware platter', 'Glistening caramelization', 'Ginger stalk'],
      },
      {
        id: 'haru-5',
        name: 'Matcha Basque Burnt Cheesecake',
        category: 'Sweet Finish',
        description: 'Ceremonial grade Uji matcha molten cheesecake with caramelized crust, fresh whipped Hokkaido cream, and sweet red azuki compote.',
        price: '$14',
        keyIngredients: ['Uji Matcha', 'Cream Cheese', 'Hokkaido Cream', 'Caramelized Crust'],
        suggestedProps: ['Speckled pottery plate', 'Bamboo whisk in background', 'Fork with molten bite'],
      },
    ],
  },
];
