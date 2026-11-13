// A synthetic action set shaped like Spoonjoy's recipe page: one action per consent class. Not Spoonjoy's code or
// data; Spoonjoy adopts the catalog in its own repositories.
import { defineAction, defineActions, field } from "../../../src/actions.mts";

export const getRecipe = defineAction({
  id: "get_recipe",
  consent: "read",
  label: "Open recipe",
  description: "Open the whole recipe.",
  agent: "Read one recipe: its title, ingredients, steps, time and servings.",
  input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", arg: true }) },
  output: { recipe: field.string({ label: "Recipe", description: "The recipe, as JSON." }) },
  cli: "recipe show",
});

export const addRecipeToShoppingList = defineAction({
  id: "add_recipe_to_shopping_list",
  consent: "write",
  label: "Add ingredients to list",
  description: "Add this recipe's ingredients to your shopping list.",
  agent: "Add every ingredient of one recipe to the person's shopping list, scaled to the servings given.",
  input: {
    recipe: field.string({ label: "Recipe", description: "The recipe's id.", arg: true }),
    servings: field.integer({ label: "Servings", description: "How many people to shop for; the recipe's own servings when left out.", optional: true, min: 1 }),
    idempotencyKey: field.string({ label: "Request", description: "A key that makes a retried add a no-op.", optional: true, protocolOnly: true }),
  },
  output: { added: field.integer({ label: "Added", description: "How many items were added." }) },
  cli: "recipe shop",
});

export const shareRecipe = defineAction({
  id: "share_recipe",
  consent: "consequential",
  label: "Share recipe",
  description: "Send this recipe to someone.",
  agent: "Send one recipe to another person by email; they see the recipe and the person's name.",
  input: {
    recipe: field.string({ label: "Recipe", description: "The recipe's id.", arg: true }),
    with: field.string({ label: "Send to", description: "The email address of the person to send it to." }),
  },
  output: {},
  cli: "recipe share",
});

export const orderIngredients = defineAction({
  id: "order_ingredients",
  consent: "person-only",
  label: "Order ingredients",
  description: "Order this recipe's ingredients for delivery and pay for them.",
  agent: "Order a recipe's ingredients for delivery and pay for them.",
  input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", arg: true }) },
  output: {},
  personOnly: {
    reason: "You can't place an order or pay for the person; only they can.",
    how: "with Order ingredients on the recipe in the app",
  },
  cli: "recipe order",
});

export default defineActions("recipe", [getRecipe, addRecipeToShoppingList, shareRecipe, orderIngredients], { tool: "kitchen" });
